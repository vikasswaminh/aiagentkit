import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminRole } from "./admin";

/**
 * Server Component utility to enforce admin authorization.
 * Redirects to dashboard if not authorized.
 */
export async function verifyAdminServer(allowedRoles: AdminRole[] = ["admin", "super_admin"]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: admin } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (!admin || !allowedRoles.includes(admin.role as AdminRole)) {
        redirect("/dashboard");
    }

    return { user, admin };
}
