import OpenAI from "openai";

// Model fallback chain — tried in order, last resort is openrouter/free
// which auto-routes to whatever free models are currently available.
const MODEL_CHAIN = [
    "qwen/qwen3-235b-a22b-2507:free",
    "deepseek/deepseek-r1-0528:free",
    "google/gemini-2.5-flash-preview:free",
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

            const content = completion.choices[0]?.message?.content?.trim() || "";
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
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`Model ${model} failed: ${msg}`);
            lastError = err instanceof Error ? err : new Error(msg);

            // Don't retry on auth errors — all models will fail
            if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
                throw lastError;
            }
        }
    }

    throw lastError || new Error("All AI models failed");
}
