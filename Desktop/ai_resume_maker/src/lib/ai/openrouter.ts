import OpenAI from "openai";

// Model fallback chain — tried in order, last resort is openrouter/free
// which auto-routes to whatever free models are currently available.
// Verified working as of 2026-03-08.
const MODEL_CHAIN = [
    "openai/gpt-oss-120b:free",
    "google/gemma-3-27b-it:free",
    "arcee-ai/trinity-large-preview:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
] as const;

export function getOpenRouterClient(): OpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("AI API key not configured (OPENROUTER_API_KEY missing)");
    }

    return new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "https://freefreecv.com",
            "X-Title": "FreeFreeCV Resume Builder",
        },
    });
}

/**
 * Call OpenRouter with automatic model fallback.
 * Tries each model in MODEL_CHAIN until one succeeds.
 */
export async function chatWithFallback(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: { temperature?: number; max_tokens?: number }
): Promise<{ content: string; model: string; tokens: number }> {
    const client = getOpenRouterClient();
    const temperature = options?.temperature ?? 0.7;
    const max_tokens = options?.max_tokens ?? 500;

    let lastError: Error | null = null;

    for (const model of MODEL_CHAIN) {
        try {
            const completion = await client.chat.completions.create({
                model,
                messages,
                temperature,
                max_tokens,
            });

            const choiceMsg = completion.choices[0]?.message;
            // Some models (reasoning models) put text in a "reasoning" field with content=null
            const reasoning = (choiceMsg as unknown as Record<string, unknown>)?.reasoning;
            const content = (choiceMsg?.content || (typeof reasoning === "string" ? reasoning : "") || "").trim();
            if (!content) {
                lastError = new Error(`Empty response from ${model}`);
                continue;
            }

            return {
                content,
                model,
                tokens: completion.usage?.total_tokens || 0,
            };
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.warn(`Model ${model} failed: ${errMsg}`);
            lastError = err instanceof Error ? err : new Error(errMsg);

            // Don't retry on auth errors — all models will fail
            if (errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("Unauthorized")) {
                throw lastError;
            }
        }
    }

    throw lastError || new Error("All AI models failed");
}
