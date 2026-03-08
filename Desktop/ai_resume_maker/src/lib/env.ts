/**
 * Environment variable validation module.
 * Import this at app startup to fail fast on missing configuration.
 */

function getEnvVar(name: string, required: boolean = true): string {
    const value = process.env[name];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || "";
}

// Validated environment variables
export const env = {
    // Supabase (public - safe to expose)
    SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

    // AI Services (server-only - never expose to client)
    OPENROUTER_API_KEY: getEnvVar("OPENROUTER_API_KEY", false),
    OPENAI_API_KEY: getEnvVar("OPENAI_API_KEY", false),

    // PDF Service (server-only)
    API2PDF_KEY: getEnvVar("API2PDF_KEY", false),
} as const;

// Validation check - run at import time
export function validateEnv(): void {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    // At least one AI key should be present for AI features
    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
        console.warn("Warning: No AI API key configured. AI features will be unavailable.");
    }
}

// Auto-validate on import (server-side only)
if (typeof window === "undefined") {
    try {
        validateEnv();
    } catch (error) {
        console.error("Environment validation failed:", error);
        // Don't throw in development to allow partial functionality
        if (process.env.NODE_ENV === "production") {
            throw error;
        }
    }
}
