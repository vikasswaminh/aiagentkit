import { NextRequest, NextResponse } from "next/server";
import { ResumeSchema } from "@/lib/schemas/resume";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, rateLimitResponse } from "@/lib/security/rate-limit";
import { chatWithFallback } from "@/lib/ai/openrouter";
// unpdf is designed for serverless environments - no web worker needed
import { extractText } from "unpdf";

// Strict constraint: PDF only, max 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_TEXT_LENGTH = 100; // Lenient for concise resumes

/**
 * Extract text from PDF buffer using unpdf (serverless-compatible)
 * unpdf is built specifically for edge/serverless environments
 */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<{ text: string; numPages: number }> {
    const uint8Array = new Uint8Array(buffer);

    // unpdf's extractText returns { text, totalPages }
    const result = await extractText(uint8Array, { mergePages: true });

    console.log(`PDF loaded: ${result.totalPages} pages`);

    // Handle both string and array return types from unpdf
    const extractedText = Array.isArray(result.text)
        ? result.text.join('\n\n')
        : String(result.text);

    return {
        text: extractedText,
        numPages: result.totalPages,
    };
}


export async function POST(req: NextRequest) {
    try {
        // 1. Check authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Rate Limiting (3 imports per minute)
        const { success: limited, retryAfter } = isRateLimited(user.id, 3, 60000);
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
        }

        // 1. Extract raw text using pdfjs-dist (serverless-compatible, no worker)
        let rawText = "";
        try {
            const arrayBuffer = await file.arrayBuffer();

            const pdfData = await extractTextFromPDF(arrayBuffer);

            console.log(`PDF loaded: ${pdfData.numPages} pages`);

            // Security: Limit page count to prevent PDF bombs
            const MAX_PAGES = 20;
            if (pdfData.numPages > MAX_PAGES) {
                return NextResponse.json({
                    error: `PDF too large. Maximum ${MAX_PAGES} pages allowed.`
                }, { status: 400 });
            }

            rawText = pdfData.text;

            // Log extraction stats (no content)
            console.log(`PDF text extracted: ${rawText.length} characters`);
        } catch (pdfError: any) {
            console.error("PDF extraction failed:", pdfError);
            return NextResponse.json({
                error: "Failed to read PDF content",
                details: pdfError.message
            }, { status: 500 });
        }

        // 2. Scanned PDF detection
        if (rawText.trim().length < MIN_TEXT_LENGTH) {
            return NextResponse.json({
                error: "This PDF appears to be scanned or contains insufficient text. Please upload a text-based PDF."
            }, { status: 400 });
        }

        // 3. Normalize text (collapsed whitespace)
        const normalizedText = rawText.replace(/\s+/g, ' ').trim();

        const systemPrompt = `You are a resume parser. Extract ALL structured data from the resume text.
Return ONLY valid JSON matching this exact schema (no explanations, no markdown):

{
  "basics": {
    "name": "string or empty",
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string or empty",
    "summary": "string or empty"
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "skills": ["string"],
  "achievements": ["string"],
  "certifications": ["string"]
}

Rules:
- Extract ALL information present in the text including achievements, honors, awards, and certifications
- Look for sections like "Achievements", "Honours", "Honors", "Awards", "Certifications", "Licenses"
- For missing fields, use empty string "" or empty array []
- For dates, use format like "Jan 2020" or "2020"
- Skills should be individual items, not comma-separated strings
- Achievements should include any awards, honors, or notable accomplishments
- Certifications should include professional certifications, licenses, and courses`;

        const aiResult = await chatWithFallback(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Parse this resume text into JSON:\n\n${normalizedText.slice(0, 8000)}` }
            ],
            { temperature: 0.1, max_tokens: 2000 }
        );

        const aiOutput = aiResult.content;

        // 5. Parse and validate AI output
        try {
            // Remove markdown code blocks if present
            let cleanOutput = aiOutput.trim();
            if (cleanOutput.startsWith("```json")) {
                cleanOutput = cleanOutput.slice(7);
            } else if (cleanOutput.startsWith("```")) {
                cleanOutput = cleanOutput.slice(3);
            }
            if (cleanOutput.endsWith("```")) {
                cleanOutput = cleanOutput.slice(0, -3);
            }
            cleanOutput = cleanOutput.trim();

            const parsedJson = JSON.parse(cleanOutput);
            console.log("Parsed JSON successfully");

            // Validate with Zod schema
            const validatedData = ResumeSchema.safeParse(parsedJson);

            if (validatedData.success) {
                // Clean up the data
                const finalData = validatedData.data;

                // Filter empty bullets
                finalData.experience = finalData.experience.map(exp => ({
                    ...exp,
                    bullets: exp.bullets
                        .filter(b => b && b.trim().length > 0)
                        .map(b => b.trim().slice(0, 500))
                }));

                console.log("Resume data validated and ready");
                return NextResponse.json(finalData);
            } else {
                console.error("Schema validation failed:", validatedData.error.issues);
                return NextResponse.json({
                    error: "AI output validation failed",
                    details: validatedData.error.issues.map(i => i.message).join(", ")
                }, { status: 422 });
            }
        } catch (parseError: any) {
            console.error("JSON parse error:", parseError);
            // Raw output logged for debugging (remove in production)
            return NextResponse.json({
                error: "Failed to parse AI response",
                details: parseError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Resume import error:", error);
        return NextResponse.json({
            error: "An error occurred during resume processing",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
