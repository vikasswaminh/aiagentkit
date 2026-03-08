import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ScoreResumeSchema } from "@/lib/schemas/ai";
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
        const validation = ScoreResumeSchema.safeParse(jsonBody);
        if (!validation.success) {
            const details = validation.error.issues.map(e => e.message);
            return errorResponse("Invalid request payload", details, 400);
        }

        const { success: limited, retryAfter } = isRateLimited(user.id, 10, 60000);
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const resumeData = validation.data;

        const resumeText = `
NAME: ${resumeData.basics.name}
EMAIL: ${resumeData.basics.email}
PHONE: ${resumeData.basics.phone}
LOCATION: ${resumeData.basics.location}
SUMMARY: ${resumeData.basics.summary}

EXPERIENCE (${resumeData.experience.length} entries):
${resumeData.experience.map(e => `- ${e.role} at ${e.company} (${e.startDate}-${e.endDate}): ${e.bullets.join("; ")}`).join("\n")}

EDUCATION (${resumeData.education.length} entries):
${resumeData.education.map(e => `- ${e.degree} at ${e.institution}`).join("\n")}

SKILLS (${resumeData.skills.length}): ${resumeData.skills.join(", ")}
ACHIEVEMENTS: ${resumeData.achievements?.join("; ") || "None"}
CERTIFICATIONS: ${resumeData.certifications?.join("; ") || "None"}`;

        const aiResult = await chatWithFallback(
            [
                {
                    role: "system",
                    content: `You are an expert ATS resume analyst. Score a resume and provide improvement tips.

STRICT RULES:
- Return ONLY valid JSON in this exact format: {"score": <number 0-100>, "tips": ["tip1", "tip2", ...]}
- Score based on: contact info completeness, summary quality, experience detail, skills count, bullet quality, section completeness.
- Provide 3-5 specific, actionable tips.
- Each tip should be one short sentence.
- NO markdown, NO explanations outside the JSON.`
                },
                {
                    role: "user",
                    content: `Score this resume for ATS compatibility and provide improvement tips:

${resumeText}

Return ONLY the JSON object with score and tips.`
                }
            ],
            { temperature: 0.5, max_tokens: 400 }
        );

        const raw = aiResult.content;

        let score = 50;
        let tips: string[] = [];

        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (typeof parsed.score === "number") {
                    score = Math.max(0, Math.min(100, Math.round(parsed.score)));
                }
                if (Array.isArray(parsed.tips)) {
                    tips = parsed.tips.filter((t: unknown): t is string => typeof t === "string").slice(0, 6);
                }
            }
        } catch {
            // Fallback score based on content analysis
            let fallbackScore = 30;
            if (resumeData.basics.summary?.length > 20) fallbackScore += 10;
            if (resumeData.experience.length >= 2) fallbackScore += 15;
            if (resumeData.skills.length >= 5) fallbackScore += 15;
            if (resumeData.education.length >= 1) fallbackScore += 10;
            if (resumeData.achievements && resumeData.achievements.length > 0) fallbackScore += 10;
            if (resumeData.certifications && resumeData.certifications.length > 0) fallbackScore += 10;
            score = Math.min(100, fallbackScore);
            tips = ["Add more quantifiable metrics to your experience bullets.", "Include a professional summary.", "List at least 8-10 relevant skills."];
        }

        createClient().then(async (supabaseClient) => {
            const { error: logError } = await supabaseClient.from("ai_usage").insert({
                user_id: user.id,
                type: "score_resume",
                input_text: resumeText.substring(0, 2000),
                output_text: JSON.stringify({ score, tips }),
                tokens_used: aiResult.tokens,
                model_used: aiResult.model
            });
            if (logError) console.error("AI usage logging failed:", logError);
        }).catch(err => console.error("Logging failed:", err));

        return NextResponse.json({ score, tips });
    } catch (error: unknown) {
        console.error("Score resume API error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return errorResponse(`Failed to score resume: ${detail}`, [], 500);
    }
}
