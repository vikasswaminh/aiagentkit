import { NextResponse } from "next/server";

// Simple in-memory rate limiting map
// NOTE: This will reset on every serverless function cold start / deployment.
// It is intended as a best-effort mitigation per instance.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

/**
 * Basic in-memory rate limiter.
 * 
 * @param userId Unique identifier for the user
 * @param limit Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 1 minute)
 * @returns { success: boolean, retryAfter?: number }
 */
export function isRateLimited(userId: string, limit: number = 10, windowMs: number = 60000) {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || (now - userLimit.lastReset) > windowMs) {
        rateLimitMap.set(userId, { count: 1, lastReset: now });
        return { success: false };
    }

    if (userLimit.count >= limit) {
        const retryAfter = Math.ceil((userLimit.lastReset + windowMs - now) / 1000);
        return { success: true, retryAfter };
    }

    userLimit.count += 1;
    return { success: false };
}

/**
 * Utility to generate a rate limit response.
 */
export function rateLimitResponse(retryAfter?: number) {
    return NextResponse.json(
        { error: "Too many requests. Please try again soon." },
        {
            status: 429,
            headers: {
                "Retry-After": (retryAfter || 60).toString()
            }
        }
    );
}
