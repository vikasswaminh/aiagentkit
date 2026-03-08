import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getUsers() {
    const supabase = await createClient();

    // Get all unique users from resumes table with their resume counts
    const { data: resumes } = await supabase
        .from("resumes")
        .select("user_id, created_at");

    // Group by user_id
    const userMap = new Map<string, { resumeCount: number; firstSeen: string }>();
    resumes?.forEach((resume: { user_id: string; created_at: string }) => {
        if (userMap.has(resume.user_id)) {
            userMap.get(resume.user_id)!.resumeCount++;
        } else {
            userMap.set(resume.user_id, {
                resumeCount: 1,
                firstSeen: resume.created_at,
            });
        }
    });

    // Get user profiles
    const { data: profiles } = await supabase
        .from("user_profiles")
        .select("*");

    // Get user emails via secure RPC
    const { data: userEmails } = await supabase.rpc('get_user_emails') as { data: { user_id: string; email: string }[] | null };
    const emailMap = new Map<string, string>(userEmails?.map((u) => [u.user_id, u.email]) || []);

    const profileMap = new Map(profiles?.map((p: { user_id: string; full_name: string | null; is_banned: boolean }) => [p.user_id, p]) || []);

    // Combine data
    const users = Array.from(userMap.entries()).map(([userId, data]) => ({
        id: userId,
        resumeCount: data.resumeCount,
        firstSeen: data.firstSeen,
        profile: profileMap.get(userId) || null,
        email: emailMap.get(userId) || null,
    }));

    return users;
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Active Users</h1>
                    <p className="text-slate-500 font-medium text-lg">Manage and monitor platform membership</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by ID or email..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64 text-sm font-medium shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">#</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">User Identity</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Resumes</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                        No users match your current criteria
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, idx) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-[13px] font-mono text-slate-300 text-center italic">
                                            {idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                    {user.profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 line-clamp-1">
                                                        {user.profile?.full_name || user.email?.split('@')[0] || "Anonymous User"}
                                                    </span>
                                                    <code className="text-[11px] text-slate-400 font-medium">
                                                        {user.email || user.id}
                                                    </code>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">{user.resumeCount}</span>
                                                <span className="text-[12px] text-slate-400 font-medium italic">files</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.profile?.is_banned ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">
                                                    Banned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 italic">
                                            {new Date(user.firstSeen).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors group/link"
                                            >
                                                Manage
                                                <svg className="ml-1.5 w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400 italic uppercase tracking-wider">
                        Total Membership: {users.length}
                    </p>
                    <div className="flex gap-2">
                        {/* Pagination placeholders for visual parity */}
                        <button disabled className="px-3 py-1 rounded border border-slate-200 text-slate-300 text-[12px] font-bold cursor-not-allowed">Prev</button>
                        <button disabled className="px-3 py-1 rounded border border-slate-200 text-slate-300 text-[12px] font-bold cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
