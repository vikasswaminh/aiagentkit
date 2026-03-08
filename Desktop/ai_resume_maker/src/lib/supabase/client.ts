import { createBrowserClient } from '@supabase/ssr'

// Fail fast if env vars are missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function createClient() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error("Missing required Supabase environment variables");
    }
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
