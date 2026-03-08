import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EnhanceRequestSchema } from "@/lib/schemas/ai";
import { isRateLimited, rateLimitResponse } from "@/lib/security/rate-limit";
import { chatWithFallback } from "@/lib/ai/openrouter";

// Type-safe error response helper
const errorResponse = (message: string, details?: string[], status: number = 400) => {
    return NextResponse.json({
        error: message,
        details: details || []
    }, { status });
};

export async function POST(req: NextRequest) {
    try {
        // 1. Check authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return errorResponse("Unauthorized", [], 401);
        }

        // 2. Payload Validation with Zod (Do this BEFORE rate limiting)
        const jsonBody = await req.json();
        const validation = EnhanceRequestSchema.safeParse(jsonBody);

        if (!validation.success) {
            const details = validation.error.issues.map(e => e.message);
            return errorResponse("Invalid request payload", details, 400);
        }

        // 3. Rate Limiting (Check per-user limit)
        const { success: limited, retryAfter } = isRateLimited(user.id, 10, 60000); // 10 req/min
        if (limited) {
            return rateLimitResponse(retryAfter);
        }

        const { type, content, context } = validation.data;

        let systemPrompt = `You are an expert ATS-optimized resume writer. Your mission is to rewrite resume bullet points to be punchy, high-impact, and professional.

STRICT CONSTRAINTS:
- Use THE STAR METHOD: Situation/Task, Action (Strong Verb), and Result (Metric).
- BREVITY IS CRITICAL: Each bullet must be a single, concise line. Max 15-20 words per bullet.
- NO MARKDOWN: Do not use bold (**), italics (*), or blockquotes (>). Return PLAIN TEXT.
- NO CONVERSATIONAL FILLER: Do not say "Here are your bullets" or "I have enhanced them".
- ACTION VERBS ONLY: Start every single line with a powerful action verb (e.g., Architected, Spearheaded, Orchestrated).`;

        let userPrompt = "";

        if (type === "experience") {
            systemPrompt += `\n- Format for work experience: Action verb + Task + Result/Impact`;
            userPrompt = `REWRITE these work experience bullet points${context?.role ? ` for a ${context.role} role` : ""}${context?.organization ? ` at ${context.organization}` : ""}.
Make them 50% shorter and 100% more impactful.

INPUT BULLETS:
${content.map((bullet, i) => `${i + 1}. ${bullet}`).join("\n")}

OUTPUT FORMAT: Return a plain numbered list. One bullet per line.
Example:
1. Developed...
2. Optimized...

NO PREAMBLE. NO BLOCKQUOTES. NO BOLDING.`;
        } else if (type === "project") {
            systemPrompt += `\n- Highlight technical implementation details and impact`;
            userPrompt = `REWRITE these project bullets${context?.projectName ? ` for project "${context.projectName}"` : ""}.
Focus on technical stack and measurable outcomes. Keep them ultra-concise.

INPUT BULLETS:
${content.map((bullet, i) => `${i + 1}. ${bullet}`).join("\n")}

OUTPUT ONLY THE NUMBERED LIST.`;
        } else if (type === "achievement") {
            systemPrompt += `\n- Make achievements specific and measurable`;
            userPrompt = `REWRITE this achievement to be a single, punchy, professional sentence.

INPUT:
${content[0]}

OUTPUT ONLY THE REWRITTEN TEXT.`;
        }

        const result = await chatWithFallback(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            { temperature: 0.7, max_tokens: 500 }
        );

        const response = result.content;

        // Log usage (background task)
        createClient().then(async (supabaseClient) => {
            const { error: logError } = await supabaseClient.from("ai_usage").insert({
                user_id: user.id,
                type,
                input_text: JSON.stringify(content),
                output_text: response,
                tokens_used: result.tokens,
                model_used: result.model
            });
            if (logError) console.error("AI usage logging failed:", logError);
        }).catch(err => console.error("Supabase client creation for logging failed:", err));

        let enhanced: string[];
        if (type === "achievement") {
            enhanced = [response.trim()];
        } else {
            enhanced = response
                .split("\n")
                .map(line => {
                    // Robust cleaning: remove leading markdown artifacts like >, *, -, 1., etc.
                    return line
                        .replace(/^[>\s*-]*/, "") // Clean leading markdown artifacts
                        .replace(/^\d+[\.\)]\s*/, "") // Clean leading numbers like 1. or 1)
                        .trim();
                })
                .filter(line => line.length > 0 && !line.toLowerCase().startsWith("input") && !line.toLowerCase().startsWith("output"));
        }

        return NextResponse.json({ enhanced });
    } catch (error: unknown) {
        console.error("Enhance API error:", error);
        const detail = error instanceof Error ? error.message : String(error);
        if (detail.includes("404")) {
            return errorResponse(`Model not found or unavailable on OpenRouter. Please verify your API key and model selection.`, [detail], 404);
        }
        return errorResponse(`Failed to process enhancement request: ${detail}`, [], 500);
    }
}
