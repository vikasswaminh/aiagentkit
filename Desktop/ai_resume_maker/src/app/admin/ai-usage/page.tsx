import { createClient } from "@/lib/supabase/server";
import { verifyAdminServer } from "@/lib/auth/admin-server";

interface AiUsage {
    id: string;
    type: string;
    cost_usd: string;
    user_id: string;
    created_at: string;
    tokens_used: number;
}

async function getAIUsage() {
    const supabase = await createClient();

    // Get all AI usage
    const { data: usage, count: totalCount } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(50);

    // Get usage by type
    const typeCount: Record<string, number> = {};
    usage?.forEach((u: AiUsage) => {
        typeCount[u.type] = (typeCount[u.type] || 0) + 1;
    });

    // Get total cost
    const totalCost = usage?.reduce((sum: number, u: AiUsage) => sum + (parseFloat(u.cost_usd) || 0), 0) || 0;

    // Get usage by user
    const userUsage: Record<string, number> = {};
    usage?.forEach((u: AiUsage) => {
        userUsage[u.user_id] = (userUsage[u.user_id] || 0) + 1;
    });

    const topUsersByAI = Object.entries(userUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));

    return {
        recentUsage: usage || [],
        totalCount: totalCount || 0,
        byType: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
        totalCost,
        topUsers: topUsersByAI,
    };
}

export default async function AIUsagePage() {
    // Server-side final authorization check
    await verifyAdminServer();

    const data = await getAIUsage();

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">AI Intelligence</h1>
                    <p className="text-slate-500 font-medium text-lg">Monitor OpenAI integration, token consumption and costs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wider">Models Active</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">🤖</div>
                    <div>
                        <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">Total Requests</p>
                        <p className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{data.totalCount}</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">💰</div>
                    <div>
                        <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">Total Burn</p>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-slate-400 font-bold text-lg">$</span>
                            <p className="text-3xl font-bold text-emerald-600 tracking-tight">{data.totalCost.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">🔥</div>
                    <div>
                        <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">Active Users</p>
                        <p className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{data.topUsers.length}</p>
                    </div>
                </div>
            </div>

            {/* Usage Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Usage Distribution</h2>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-indigo-500">By Service</span>
                    </div>
                    <div className="p-6">
                        {data.byType.length === 0 ? (
                            <p className="text-slate-400 text-center py-10 font-medium italic">No usage recorded yet</p>
                        ) : (
                            <div className="space-y-4">
                                {data.byType.map((item) => (
                                    <div key={item.type} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100/50 rounded-xl group hover:border-indigo-100 hover:bg-white transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                            <span className="text-sm font-bold text-slate-700 capitalize tracking-tight">{item.type}</span>
                                        </div>
                                        <span className="text-xl font-bold text-indigo-600">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Heavy Consumers</h2>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-amber-500">Top 5 Members</span>
                    </div>
                    <div className="p-6">
                        {data.topUsers.length === 0 ? (
                            <p className="text-slate-400 text-center py-10 font-medium italic">No consumers detected</p>
                        ) : (
                            <div className="space-y-4">
                                {data.topUsers.map((user, index) => (
                                    <div key={user.userId} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100/50 rounded-xl hover:bg-white transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[13px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <code className="text-slate-600 text-[13px] font-bold tracking-tight">{user.userId.slice(0, 16)}...</code>
                                            <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(user.count / data.totalCount) * 100}%` }} />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{user.count} ops</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Usage Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900">Request Logs</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">User ID</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Operation</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Tokens</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost (USD)</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.recentUsage.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                                        No request logs available
                                    </td>
                                </tr>
                            ) : (
                                data.recentUsage.map((usage: AiUsage) => (
                                    <tr key={usage.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <code className="text-[12px] text-slate-400 font-bold group-hover:text-slate-600 transition-colors">{usage.user_id?.slice(0, 12)}...</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider capitalize">
                                                {usage.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                                            {usage.tokens_used?.toLocaleString() || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-[12px] font-bold text-slate-400 italic font-mono">$</span>
                                                <span className="text-sm font-bold text-emerald-600 font-mono">{(parseFloat(usage.cost_usd) || 0).toFixed(6)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-[13px] font-medium text-slate-400 italic">
                                            {new Date(usage.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
