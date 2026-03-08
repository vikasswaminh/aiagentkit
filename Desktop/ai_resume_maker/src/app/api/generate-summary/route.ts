import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GenerateSummarySchema } from "@/lib/schemas/ai";
import { isRateLimited, rateLimitResponse } from "@/lib/security/rate-limit";
import { chatWithFallback } from "@/lib/ai/openrouter";

const errorResponse = (message: string, details?: string[], status: number = 400) => {
    return NextResponse.json({ error: message, details: details || [] }, { status });
};

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return errorResponse("Unauthorized", [], 401);
        }

        const jsonBody = await req.json();
        const validation = GenerateSummarySchema.safeParse(jsonBody);
        if (!validation.success) {
            const details = validation.error.issues.map(e => e.message);
            return errorResponse("Invalid request payload", details, 400);
        }

        const { success: limited, retryAfter } = isRateLimited(user.id, 10, 60000);
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const { experience, skills, education } = validation.data;

        const experienceText = experience.map(e =>
            `${e.role} at ${e.company}${e.bullets?.length ? `: ${e.bullets.join("; ")}` : ""}`
        ).join("\n");

        const educationText = education.map(e => `${e.degree} from ${e.institution}`).join(", ");

        const result = await chatWithFallback(
            [
                {
                    role: "system",
                    content: `You are an expert resume writer. Generate a professional summary for a resume.

STRICT RULES:
- Write exactly 2-3 sentences.
- Be specific about years of experience, key skills, and achievements.
- Use strong professional language. No first person (I, me, my).
- NO MARKDOWN. Return PLAIN TEXT only.
- NO preamble like "Here is your summary". Just the summary text.`
                },
                {
                    role: "user",
                    content: `Generate a professional resume summary based on:

EXPERIENCE:
${experienceText || "Not provided"}

SKILLS: ${skills.join(", ") || "Not provided"}

EDUCATION: ${educationText || "Not provided"}

Return ONLY the summary text, nothing else.`
                }
            ],
            { temperature: 0.7, max_tokens: 200 }
        );

        const summary = result.content;

        createClient().then(async (supabaseClient) => {
            const { error: logError } = await supabaseClient.from("ai_usage").insert({
                user_id: user.id,
                type: "generate_summary",
                input_text: JSON.stringify({ experience, skills, education }),
                output_text: summary,
                tokens_used: result.tokens,
                model_used: result.model
            });
            if (logError) console.error("AI usage logging failed:", logError);
        }).catch(err => console.error("Logging failed:", err));

        return NextResponse.json({ summary });
    } catch (error: unknown) {
        console.error("Generate summary API error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return errorResponse(`Failed to generate summary: ${detail}`, [], 500);
    }
}
