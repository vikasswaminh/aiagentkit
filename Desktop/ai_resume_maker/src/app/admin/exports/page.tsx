"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface ExportUser {
    user_id: string;
    created_at: string;
}

interface ExportResume {
    id: string;
    name: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface ExportDownload {
    id: string;
    user_id: string;
    resume_id: string;
    format: string;
    downloaded_at: string;
}

interface ExportAiUsage {
    id: string;
    user_id: string;
    type: string;
    tokens_used: number;
    cost_usd: number;
    created_at: string;
}

export default function ExportsPage() {
    const supabase = createClient();
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExportUsers = async () => {
        setExporting("users");

        // Get all unique users from resumes
        const { data: resumes } = await supabase
            .from("resumes")
            .select("user_id, created_at");

        const userMap = new Map<string, { resumeCount: number; firstSeen: string }>();
        resumes?.forEach((resume: ExportUser) => {
            if (userMap.has(resume.user_id)) {
                userMap.get(resume.user_id)!.resumeCount++;
            } else {
                userMap.set(resume.user_id, {
                    resumeCount: 1,
                    firstSeen: resume.created_at,
                });
            }
        });

        // Convert to CSV
        let csv = "User ID,Resume Count,First Seen\n";
        userMap.forEach((data, userId) => {
            csv += `${userId},${data.resumeCount},${data.firstSeen}\n`;
        });

        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();

        setExporting(null);
    };

    const handleExportResumes = async () => {
        setExporting("resumes");

        const { data: resumes } = await supabase
            .from("resumes")
            .select("id, name, user_id, created_at, updated_at");

        // Convert to CSV
        let csv = "ID,Name,User ID,Created At,Updated At\n";
        resumes?.forEach((r: ExportResume) => {
            csv += `${r.id},"${r.name}",${r.user_id},${r.created_at},${r.updated_at}\n`;
        });

        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resumes_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();

        setExporting(null);
    };

    const handleExportDownloads = async () => {
        setExporting("downloads");

        const { data: downloads } = await supabase
            .from("download_history")
            .select("id, user_id, resume_id, format, downloaded_at");

        // Convert to CSV
        let csv = "ID,User ID,Resume ID,Format,Downloaded At\n";
        downloads?.forEach((d: ExportDownload) => {
            csv += `${d.id},${d.user_id},${d.resume_id},${d.format},${d.downloaded_at}\n`;
        });

        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `downloads_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();

        setExporting(null);
    };

    const handleExportAIUsage = async () => {
        setExporting("ai");

        const { data: usage } = await supabase
            .from("ai_usage")
            .select("*");

        // Convert to CSV
        let csv = "ID,User ID,Type,Tokens,Cost USD,Created At\n";
        usage?.forEach((u: ExportAiUsage) => {
            csv += `${u.id},${u.user_id},${u.type},${u.tokens_used},${u.cost_usd},${u.created_at}\n`;
        });

        // Download
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai_usage_export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();

        setExporting(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Data Exports</h1>
                <p className="text-slate-500 font-medium mt-1">Generate and download platform data as CSV for offline analysis</p>
            </div>

            {/* Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-blue-200 transition-all">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            👥
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Registry</h3>
                            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
                                Complete ledger of all registered users, including their aggregate resume contributions and activation dates.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportUsers}
                        disabled={exporting === "users"}
                        className="mt-8 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-50 font-bold shadow-lg flex items-center justify-center gap-2 group/btn"
                    >
                        {exporting === "users" ? "Processing..." : "Download CSV"}
                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-emerald-200 transition-all">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            📄
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Asset Inventory</h3>
                            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
                                Detailed catalog of all resume assets, including naming conventions, ownership, and last modification timestamps.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportResumes}
                        disabled={exporting === "resumes"}
                        className="mt-8 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 font-bold shadow-lg flex items-center justify-center gap-2 group/btn"
                    >
                        {exporting === "resumes" ? "Processing..." : "Download CSV"}
                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-violet-200 transition-all">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            📥
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Traffic Metrics</h3>
                            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
                                Granular history of all document downloads, segmented by format, user, and temporal data.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportDownloads}
                        disabled={exporting === "downloads"}
                        className="mt-8 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-violet-600 transition-all disabled:opacity-50 font-bold shadow-lg flex items-center justify-center gap-2 group/btn"
                    >
                        {exporting === "downloads" ? "Processing..." : "Download CSV"}
                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-orange-200 transition-all">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            🤖
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Usage</h3>
                            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
                                Complete audit trail of AI-powered document enhancements, including token consumption and cost metrics.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportAIUsage}
                        disabled={exporting === "ai"}
                        className="mt-8 w-full px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-50 font-bold shadow-lg flex items-center justify-center gap-2 group/btn"
                    >
                        {exporting === "ai" ? "Processing..." : "Download CSV"}
                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="text-5xl">💡</div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Export Guidelines</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 text-sm font-medium">
                        <li className="flex items-center gap-2"><span className="text-indigo-400 text-lg">•</span> Universal CSV format compatibility</li>
                        <li className="flex items-center gap-2"><span className="text-indigo-400 text-lg">•</span> Real-time data generation</li>
                        <li className="flex items-center gap-2"><span className="text-indigo-400 text-lg">•</span> Automatic temporal file naming</li>
                        <li className="flex items-center gap-2"><span className="text-indigo-400 text-lg">•</span> High-precision decimal cost tracking</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
