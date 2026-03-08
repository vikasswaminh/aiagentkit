import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This is a one-time setup endpoint to create the initial admin user
// IMPORTANT: Remove or secure this endpoint after initial setup in production

const ADMIN_EMAIL = "vikas@networkershome.com";

export async function POST() {
    try {
        const supabase = await createClient();

        // 1. Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        }

        // 2. Strict Bootstrap Check
        // Only the pre-configured email can run this setup
        if (user.email !== ADMIN_EMAIL) {
            console.warn(`Unauthorized setup attempt by ${user.email}`);
            return NextResponse.json({
                error: "Unauthorized: Bootstrap access denied"
            }, { status: 403 });
        }

        // 3. Check if already an admin (Fail closed)
        const { data: existingAdmin } = await supabase
            .from("admin_users")
            .select("id, role")
            .eq("user_id", user.id)
            .single();

        if (existingAdmin) {
            return NextResponse.json({
                message: "Configuration already finalized",
                role: existingAdmin.role
            });
        }

        // 4. Finalize Admin Setup
        const { error } = await supabase
            .from("admin_users")
            .insert({
                user_id: user.id,
                role: "super_admin",
            });

        if (error) {
            console.error("Admin setup insertion failed:", error);
            return NextResponse.json({ error: "Failed to finalize admin configuration." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Setup complete: Super Admin privileges granted.",
            redirect: "/admin"
        });

    } catch (error: unknown) {
        console.error("Critical Admin Setup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Admin setup endpoint. POST to this endpoint while logged in as " + ADMIN_EMAIL + " to become admin."
    });
}
