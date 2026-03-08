import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type AdminRole = "admin" | "super_admin";

/**
 * Server-side utility to enforce admin authorization.
 * 
 * @param allowedRoles List of roles permitted to access the resource (default: admin, super_admin)
 * @returns The user and admin profile if authorized
 * @throws 401/403 NextResponse if unauthorized
 */
export async function requireAdmin(allowedRoles: AdminRole[] = ["admin", "super_admin"]) {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            authorized: false,
            response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
            user: null,
            admin: null
        };
    }

    // 2. Fetch admin profile and verify role
    const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (adminError || !admin) {
        return {
            authorized: false,
            response: NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 }),
            user,
            admin: null
        };
    }

    // moderator and viewer are explicitely excluded if not in allowedRoles
    if (!allowedRoles.includes(admin.role as AdminRole)) {
        return {
            authorized: false,
            response: NextResponse.json({ error: "Unauthorized: Insufficient privileges" }, { status: 403 }),
            user,
            admin
        };
    }

    return {
        authorized: true,
        response: null,
        user,
        admin
    };
}
