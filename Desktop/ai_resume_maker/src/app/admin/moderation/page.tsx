export default function ModerationPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Moderation</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    <p className="text-slate-500 font-medium">Review flagged content and manage moderation</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                    <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">All Clear!</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                    No content has been flagged for review. The moderation queue is empty and the system is healthy.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Moderation Guidelines */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        🛡️ Moderation Guidelines
                    </h2>
                    <div className="space-y-5">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs shadow-sm">✓</div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">Resume content is automatically scanned for inappropriate language using AI.</p>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs shadow-sm">✓</div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">Flagged content will appear here for manual review by the administration team.</p>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs shadow-sm">✓</div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">You can approve or reject flagged resumes to maintain platform quality.</p>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs shadow-sm">✓</div>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">Users with repeated violations can be banned from the platform permanently.</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between group hover:border-amber-200 transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Pending Review</p>
                            <p className="text-4xl font-black text-slate-900">0</p>
                        </div>
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-2xl shadow-inner group-hover:scale-110 transition-transform">⏳</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between group hover:border-emerald-200 transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Approved Today</p>
                            <p className="text-4xl font-black text-slate-900">0</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl shadow-inner group-hover:scale-110 transition-transform">✅</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 flex items-center justify-between group hover:border-rose-200 transition-all shadow-sm">
                        <div className="space-y-1">
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Rejected Today</p>
                            <p className="text-4xl font-black text-slate-900">0</p>
                        </div>
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl shadow-inner group-hover:scale-110 transition-transform">❌</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
