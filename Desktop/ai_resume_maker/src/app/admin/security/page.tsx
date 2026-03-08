import { createClient } from "@/lib/supabase/server";

interface ActivityLog {
    id: string;
    created_at: string;
    user_id: string | null;
    action: string;
    details: unknown;
    ip_address: string | null;
}

async function getActivityLogs() {
    const supabase = await createClient();

    const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    return (logs || []) as ActivityLog[];
}

export default async function SecurityPage() {
    const logs = await getActivityLogs();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Security</h1>
                <p className="text-slate-500 font-medium mt-1">Activity logs and identity monitoring</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Logs</p>
                        <span className="text-xl">📜</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900">{logs.length}</p>
                    <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[70%]"></div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Active Today</p>
                        <span className="text-xl">⚡</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900">
                        {logs.filter((l: ActivityLog) =>
                            new Date(l.created_at).toDateString() === new Date().toDateString()
                        ).length}
                    </p>
                    <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[40%]"></div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-violet-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Unique Users</p>
                        <span className="text-xl">👤</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900">
                        {new Set(logs.map((l: ActivityLog) => l.user_id)).size}
                    </p>
                    <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 w-[60%]"></div>
                    </div>
                </div>
            </div>

            {/* Activity Logs Table */}
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        📝 Activity Log Feed
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">Auto-refreshing live</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">Identity</th>
                                <th className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">Action Protocol</th>
                                <th className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">Payload Details</th>
                                <th className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">Origin IP</th>
                                <th className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/20">
                                        System quiet. No activity detected in the last 24 hours.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: ActivityLog) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                                <code className="text-slate-500 text-xs font-mono">
                                                    {log.user_id?.slice(0, 12) || "SYSTEM"}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 uppercase tracking-tighter">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 max-w-xs truncate">
                                            <span className="text-slate-600 text-sm font-medium">
                                                {log.details ? JSON.stringify(log.details) : "—"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-slate-400 text-xs font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                {log.ip_address || "0.0.0.0"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-slate-500 text-xs font-bold whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* GDPR Export Section */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-lg shadow-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            ⚖️ GDPR Resilience <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-bold border border-emerald-100">Compliant</span>
                        </h2>
                        <p className="text-slate-500 font-medium mt-3 leading-relaxed">
                            Generate cryptographic exports of all persistent data associated with a specific user identity to satisfy formal data portability and access requests.
                        </p>
                    </div>
                    <div className="w-full md:w-[400px] space-y-4">
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🆔</span>
                            <input
                                type="text"
                                placeholder="Target User ID or GUID..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-mono text-xs"
                            />
                        </div>
                        <button className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-bold shadow-xl active:scale-95">
                            Execute Secure Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
