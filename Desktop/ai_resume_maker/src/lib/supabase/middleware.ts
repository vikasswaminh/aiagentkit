import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware session updater and UX Guard.
 * NOTE: This is a BEST EFFORT guard for UX purposes ONLY.
 * Final authorization MUST be enforced server-side in API routes.
 */
export const updateSession = async (request: NextRequest) => {
    try {
        // Standard Supabase Next.js Middleware pattern
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Refresh session if expired
        const { data: { user } } = await supabase.auth.getUser();

        const url = request.nextUrl.clone();

        // Protect these prefix paths for UX
        const isDashboardRoute = url.pathname.startsWith('/dashboard');
        const isBuilderRoute = url.pathname.startsWith('/builder');
        const isAdminRoute = url.pathname.startsWith('/admin');

        const isProtectedRoute = isDashboardRoute || isBuilderRoute || isAdminRoute;

        // 1. Unauthenticated UX Guard
        if (!user && isProtectedRoute) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // 2. Admin UX Guard
        if (user && isAdminRoute) {
            const { data: admin } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            const allowedRoles = ['admin', 'super_admin'];
            if (!admin || !allowedRoles.includes(admin.role)) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        return response;
    } catch (error) {
        // Log the error for debugging
        console.error("Middleware error:", error);

        const url = request.nextUrl.clone();

        // Fail closed for admin routes - don't allow access on auth errors
        if (url.pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // For other routes, proceed but log the issue
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }
};
