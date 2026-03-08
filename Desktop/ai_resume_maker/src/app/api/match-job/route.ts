import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MatchJobSchema } from "@/lib/schemas/ai";
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
        const validation = MatchJobSchema.safeParse(jsonBody);
        if (!validation.success) {
            const details = validation.error.issues.map(e => e.message);
            return errorResponse("Invalid request payload", details, 400);
        }

        const { success: limited, retryAfter } = isRateLimited(user.id, 10, 60000);
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const { resumeSkills, resumeBullets, jobDescription } = validation.data;

        const aiResult = await chatWithFallback(
            [
                {
                    role: "system",
                    content: `You are an expert job application advisor. Analyze how well a resume matches a job description.

STRICT RULES:
- Return ONLY valid JSON in this exact format:
{
  "matchScore": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
- matchedKeywords: skills/terms found in BOTH resume and job description.
- missingKeywords: important skills/terms in the job description that are MISSING from the resume.
- suggestions: 3-5 actionable tips to improve match.
- NO markdown, NO explanations outside JSON.`
                },
                {
                    role: "user",
                    content: `Analyze this resume against the job description:

RESUME SKILLS: ${resumeSkills.join(", ")}

RESUME EXPERIENCE BULLETS:
${resumeBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

JOB DESCRIPTION:
${jobDescription}

Return ONLY the JSON object.`
                }
            ],
            { temperature: 0.5, max_tokens: 500 }
        );

        const raw = aiResult.content;

        let result = {
            matchScore: 50,
            matchedKeywords: [] as string[],
            missingKeywords: [] as string[],
            suggestions: [] as string[],
        };

        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (typeof parsed.matchScore === "number") {
                    result.matchScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore)));
                }
                if (Array.isArray(parsed.matchedKeywords)) {
                    result.matchedKeywords = parsed.matchedKeywords.filter((s: unknown): s is string => typeof s === "string").slice(0, 20);
                }
                if (Array.isArray(parsed.missingKeywords)) {
                    result.missingKeywords = parsed.missingKeywords.filter((s: unknown): s is string => typeof s === "string").slice(0, 20);
                }
                if (Array.isArray(parsed.suggestions)) {
                    result.suggestions = parsed.suggestions.filter((s: unknown): s is string => typeof s === "string").slice(0, 6);
                }
            }
        } catch {
            result.suggestions = ["Try adding more keywords from the job description to your skills section."];
        }

        createClient().then(async (supabaseClient) => {
            const { error: logError } = await supabaseClient.from("ai_usage").insert({
                user_id: user.id,
                type: "match_job",
                input_text: jobDescription.substring(0, 2000),
                output_text: JSON.stringify(result),
                tokens_used: aiResult.tokens,
                model_used: aiResult.model
            });
            if (logError) console.error("AI usage logging failed:", logError);
        }).catch(err => console.error("Logging failed:", err));

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Match job API error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return errorResponse(`Failed to match job: ${detail}`, [], 500);
    }
}
