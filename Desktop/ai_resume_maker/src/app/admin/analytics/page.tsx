import { createClient } from "@/lib/supabase/server";

async function getAnalytics() {
    const supabase = await createClient();

    // Get resumes by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: resumes } = await supabase
        .from("resumes")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

    // Group by date
    const resumesByDate: Record<string, number> = {};
    resumes?.forEach((r: { created_at: string }) => {
        const date = new Date(r.created_at).toLocaleDateString();
        resumesByDate[date] = (resumesByDate[date] || 0) + 1;
    });

    // Get downloads by format
    const { data: downloads } = await supabase
        .from("download_history")
        .select("format");

    const downloadsByFormat: Record<string, number> = {};
    downloads?.forEach((d: { format: string }) => {
        downloadsByFormat[d.format] = (downloadsByFormat[d.format] || 0) + 1;
    });

    // Get top users by resume count
    const { data: allResumes } = await supabase
        .from("resumes")
        .select("user_id");

    const userResumeCounts: Record<string, number> = {};
    allResumes?.forEach((r: { user_id: string }) => {
        userResumeCounts[r.user_id] = (userResumeCounts[r.user_id] || 0) + 1;
    });

    const topUsers = Object.entries(userResumeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));

    return {
        resumesByDate: Object.entries(resumesByDate).map(([date, count]) => ({ date, count })),
        downloadsByFormat: Object.entries(downloadsByFormat).map(([format, count]) => ({ format, count })),
        topUsers,
    };
}

export default async function AnalyticsPage() {
    const analytics = await getAnalytics();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Analytics</h1>
                <p className="text-slate-500 font-medium mt-1">Platform usage and performance insights</p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resumes Over Time */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        📈 Resumes Created <span className="text-xs font-normal text-slate-400 font-mono">(Last 30 Days)</span>
                    </h2>
                    {analytics.resumesByDate.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-3">📊</div>
                            <p className="text-slate-400 font-medium text-sm">No data available for this period</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {analytics.resumesByDate.slice(-10).map((item) => (
                                <div key={item.date} className="group">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{item.date}</span>
                                        <span className="text-slate-900 font-bold text-xs">{item.count}</span>
                                    </div>
                                    <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-1000 group-hover:from-indigo-600 group-hover:to-indigo-500"
                                            style={{ width: `${Math.min(item.count * 20, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Downloads by Format */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        📥 Downloads by Format
                    </h2>
                    {analytics.downloadsByFormat.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-3">📭</div>
                            <p className="text-slate-400 font-medium text-sm">No downloads recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {analytics.downloadsByFormat.map((item) => (
                                <div key={item.format} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg ${item.format === "pdf" ? "bg-rose-500 shadow-rose-200" : "bg-emerald-500 shadow-emerald-200"}`}>
                                            {item.format.toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="text-slate-900 font-bold block uppercase tracking-tight">{item.format} Format</span>
                                            <span className="text-slate-400 text-xs font-medium">Standard Export</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-slate-900 leading-none">{item.count}</span>
                                        <span className="text-slate-400 text-[10px] block font-bold mt-1 uppercase">Total</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Users */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    👑 Top Consumers <span className="text-xs font-normal text-slate-400 font-mono">(By Activity)</span>
                </h2>
                {analytics.topUsers.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No user activity recorded</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.topUsers.map((user, index) => (
                            <div key={user.userId} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center font-black text-indigo-600">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <code className="text-slate-400 text-[10px] block truncate">{user.userId}</code>
                                    <span className="text-slate-900 font-bold block mt-0.5">{user.count} <span className="text-slate-400 font-medium text-xs">Resumes</span></span>
                                </div>
                                <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    →
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
