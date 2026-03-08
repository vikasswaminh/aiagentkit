import { NextRequest, NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/ai/openrouter";

// Simple IP-based rate limit: 5 requests per minute per IP
const ipMap = new Map<string, { count: number; resetAt: number }>();

function isIpLimited(ip: string): boolean {
    const now = Date.now();
    const entry = ipMap.get(ip);
    if (!entry || now > entry.resetAt) {
        ipMap.set(ip, { count: 1, resetAt: now + 60000 });
        return false;
    }
    if (entry.count >= 5) return true;
    entry.count++;
    return false;
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (isIpLimited(ip)) {
        return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    let bullet: string;
    try {
        const body = await req.json();
        bullet = String(body.bullet ?? "").trim().slice(0, 300);
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!bullet || bullet.length < 5) {
        return NextResponse.json({ error: "Please enter at least 5 characters." }, { status: 400 });
    }

    try {
        const result = await chatWithFallback(
            [
                {
                    role: "system",
                    content: "You are a professional resume writer. Rewrite the given resume bullet point to be more impactful using strong action verbs and quantifiable results. Return ONLY the improved bullet point — no explanation, no prefix, no quotes.",
                },
                { role: "user", content: bullet },
            ],
            { temperature: 0.7, max_tokens: 100 }
        );
        return NextResponse.json({ enhanced: result.content });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Demo enhance failed:", msg);
        return NextResponse.json({ error: "AI enhancement failed. Please try again." }, { status: 500 });
    }
}
