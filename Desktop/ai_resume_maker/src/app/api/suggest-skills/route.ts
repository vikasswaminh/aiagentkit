import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SuggestSkillsSchema } from "@/lib/schemas/ai";
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
        const validation = SuggestSkillsSchema.safeParse(jsonBody);
        if (!validation.success) {
            const details = validation.error.issues.map(e => e.message);
            return errorResponse("Invalid request payload", details, 400);
        }

        const { success: limited, retryAfter } = isRateLimited(user.id, 10, 60000);
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const { experience, currentSkills } = validation.data;

        const experienceText = experience.map(e =>
            `${e.role} at ${e.company}${e.bullets?.length ? `: ${e.bullets.join("; ")}` : ""}`
        ).join("\n");

        const aiResult = await chatWithFallback(
            [
                {
                    role: "system",
                    content: `You are an expert resume advisor. Suggest relevant skills for a resume based on the person's experience.

STRICT RULES:
- Return ONLY a JSON array of skill strings. Example: ["Python", "Docker", "AWS"]
- Suggest 8-12 skills that are NOT already in their current skill list.
- Focus on industry-relevant, ATS-friendly skills.
- Include a mix of technical skills, tools, and methodologies.
- NO explanations, NO markdown, ONLY the JSON array.`
                },
                {
                    role: "user",
                    content: `Based on this experience, suggest skills they should add to their resume:

EXPERIENCE:
${experienceText || "Not provided"}

CURRENT SKILLS (do NOT repeat these): ${currentSkills.join(", ") || "None listed"}

Return ONLY a JSON array of suggested skill strings.`
                }
            ],
            { temperature: 0.7, max_tokens: 300 }
        );

        const raw = aiResult.content;

        let suggestions: string[] = [];
        try {
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    suggestions = parsed
                        .filter((s: unknown): s is string => typeof s === "string")
                        .map(s => s.trim())
                        .filter(s => s.length > 0 && !currentSkills.some(cs => cs.toLowerCase() === s.toLowerCase()));
                }
            }
        } catch {
            suggestions = raw
                .replace(/[\[\]"]/g, "")
                .split(",")
                .map(s => s.trim())
                .filter(s => s.length > 0 && !currentSkills.some(cs => cs.toLowerCase() === s.toLowerCase()));
        }

        createClient().then(async (supabaseClient) => {
            const { error: logError } = await supabaseClient.from("ai_usage").insert({
                user_id: user.id,
                type: "suggest_skills",
                input_text: JSON.stringify({ experience, currentSkills }),
                output_text: JSON.stringify(suggestions),
                tokens_used: aiResult.tokens,
                model_used: aiResult.model
            });
            if (logError) console.error("AI usage logging failed:", logError);
        }).catch(err => console.error("Logging failed:", err));

        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        console.error("Suggest skills API error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return errorResponse(`Failed to suggest skills: ${detail}`, [], 500);
    }
}
