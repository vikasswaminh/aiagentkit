import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/admin/StatsCard";
import { verifyAdminServer } from "@/lib/auth/admin-server";

async function getStats() {
    const supabase = await createClient();

    // Get unique users from resumes table
    const { data: uniqueUsers } = await supabase
        .from("resumes")
        .select("user_id");
    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

    // Get total resumes
    const { count: totalResumes } = await supabase
        .from("resumes")
        .select("*", { count: "exact", head: true });

    // Get total downloads
    const { count: totalDownloads } = await supabase
        .from("download_history")
        .select("*", { count: "exact", head: true });

    // Get AI usage count
    const { count: totalAiUses } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true });

    // Get recent activity
    const { data: recentResumes } = await supabase
        .from("resumes")
        .select("id, name, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(5);

    const { data: recentDownloads } = await supabase
        .from("download_history")
        .select("*, resumes(name)")
        .order("downloaded_at", { ascending: false })
        .limit(5);

    return {
        totalUsers: uniqueUserCount || 0,
        totalResumes: totalResumes || 0,
        totalDownloads: totalDownloads || 0,
        totalAiUses: totalAiUses || 0,
        recentResumes: recentResumes || [],
        recentDownloads: recentDownloads || [],
    };
}

interface RecentResume {
    id: string;
    name: string;
    created_at: string;
    user_id: string;
}

interface AdminDownload {
    id: string;
    downloaded_at: string;
    format: string;
    resumes: {
        name: string;
    } | null;
}

export default async function AdminDashboard() {
    // Server-side final authorization check
    await verifyAdminServer();

    const stats = await getStats();

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 font-medium text-lg">Real-time performance and user engagement metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wider italic">System Live</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatsCard
                    title="Active Users"
                    value={stats.totalUsers}
                    icon="👥"
                    color="blue"
                />
                <StatsCard
                    title="Resumes Created"
                    value={stats.totalResumes}
                    icon="📄"
                    color="green"
                />
                <StatsCard
                    title="Export Volume"
                    value={stats.totalDownloads}
                    icon="📥"
                    color="purple"
                />
                <StatsCard
                    title="AI Operations"
                    value={stats.totalAiUses}
                    icon="✨"
                    color="orange"
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Resumes */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Recent Resumes</h2>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Latest 5</span>
                    </div>
                    <div className="p-6">
                        {stats.recentResumes.length === 0 ? (
                            <p className="text-slate-400 text-sm italic">No activity recorded yet</p>
                        ) : (
                            <div className="space-y-1">
                                {stats.recentResumes.map((resume: RecentResume) => (
                                    <div key={resume.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-sm tracking-tight">{resume.name}</p>
                                                <p className="text-slate-400 text-[12px] font-medium italic">
                                                    {new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[12px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 italic">
                                            ID: {resume.user_id?.slice(0, 8)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Downloads */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Recent Downloads</h2>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Latest 5</span>
                    </div>
                    <div className="p-6">
                        {stats.recentDownloads.length === 0 ? (
                            <p className="text-slate-400 text-sm italic">No downloads detected</p>
                        ) : (
                            <div className="space-y-1">
                                {stats.recentDownloads.map((download: AdminDownload) => (
                                    <div key={download.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-sm tracking-tight">{download.resumes?.name || "Deleted Resume"}</p>
                                                <p className="text-slate-400 text-[12px] font-medium italic">
                                                    {new Date(download.downloaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider">
                                            {download.format}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
