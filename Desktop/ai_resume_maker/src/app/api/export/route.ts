import { NextRequest, NextResponse } from "next/server";
import { ResumeSchema, ResumeData } from "@/lib/schemas/resume";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, rateLimitResponse } from "@/lib/security/rate-limit";
import { sanitizeResumeData, sanitizeFilename } from "@/lib/security/sanitizer";
import { generatePDF, renderResumeToHtml } from "@/lib/pdf/pdf-server";

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use Vercel's trusted header first, then fallback
    const forwardedFor = req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = user?.id ? `user:${user.id}` : `anon:${ip}`;

    // 2. Rate Limiting (Check per-user limit)
    const { success: limited, retryAfter } = isRateLimited(rateLimitKey, 5, 60000); // 5 exports/min
    if (limited) {
      return rateLimitResponse(retryAfter);
    }

    // 3. Payload Validation with Zod
    const jsonBody = await req.json();
    const validation = ResumeSchema.safeParse(jsonBody);

    if (!validation.success) {
      return NextResponse.json({
        error: "Invalid resume data",
        details: validation.error.issues.map(e => e.message)
      }, { status: 400 });
    }

    // 4. Data Sanitization
    const sanitizedData = sanitizeResumeData(validation.data) as ResumeData;

    // 5. Generate HTML Snapshot via pdfService (Isolates react-dom/server and components)
    const { fullHtml, stats } = await renderResumeToHtml(sanitizedData);

    // Precise instrumentation for audit trail
    console.log(`[PDF Export Audit] Stats:`, stats);
    console.log(`[PDF Export Audit] Breakdown:
      - HTML Content: ${(stats.htmlLength / 1024).toFixed(2)} KB
      - Main CSS: ${(stats.cssLength / 1024).toFixed(2)} KB
      - Base64 Fonts: ${(stats.fontsLength / 1024).toFixed(2)} KB
      - Total Payload: ${(stats.totalLength / 1024).toFixed(2)} KB
    `);

    // Safety check - api2pdf typically handles 10MB+, but we throttle at 10MB to avoid timeouts
    const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
    if (stats.totalLength > MAX_PAYLOAD_SIZE) {
      console.error(`[PDF Export Failure] Payload exceeded safety threshold (10MB). Total: ${stats.totalLength}`);
      return NextResponse.json({
        error: "Resume content is too complex for export.",
        details: `Payload size (${(stats.totalLength / 1024 / 1024).toFixed(2)} MB) exceeds system limit.`
      }, { status: 400 });
    }

    // 6. Call api2pdf Service
    const pdfResult = await generatePDF(fullHtml);

    if (!pdfResult.success || !pdfResult.pdf) {
      console.error("api2pdf generation failed:", pdfResult.error);
      return NextResponse.json({
        error: pdfResult.error || "Failed to generate PDF.",
        details: "PDF generation service error"
      }, { status: 502 });
    }

    // 7. Log download history
    if (user) {
      try {
        await supabase.from("download_history").insert({
          user_id: user.id,
          format: "pdf"
        });
      } catch (dbError) {
        console.error("Failed to log download history:", dbError);
      }
    }

    // 8. Return PDF
    const safeFilename = sanitizeFilename(sanitizedData.basics?.name || "Resume");
    return new NextResponse(new Uint8Array(pdfResult.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${safeFilename}.pdf`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF Export Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to process PDF export." }, { status: 500 });
  }
}
