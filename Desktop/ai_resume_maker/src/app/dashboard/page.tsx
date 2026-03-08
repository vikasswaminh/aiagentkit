import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch user's resumes
    const { data: resumes } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    // Fetch download history
    const { data: downloads } = await supabase
        .from("download_history")
        .select("*, resumes(name)")
        .eq("user_id", user.id)
        .order("downloaded_at", { ascending: false })
        .limit(10);

    return (
        <DashboardClient
            user={user}
            resumes={resumes || []}
            downloads={downloads || []}
        />
    );
}
