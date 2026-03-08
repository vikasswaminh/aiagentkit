import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js 16 Proxy Function
 * This replaces the deprecated middleware.ts convention.
 * NOTE: As of Next.js 16.1.4, the build engine (Turbopack) may encounter 
 * internal worker crashes during production optimization. This is an 
 * upstream framework issue and does not affect the correctness of the 
 * security logic or routing implementation.
 */
export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images and icons
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
