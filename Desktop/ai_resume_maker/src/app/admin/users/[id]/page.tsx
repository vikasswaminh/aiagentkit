"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";


interface UserResume {
    id: string;
    name: string;
    created_at: string;
}

interface UserDownload {
    id: string;
    downloaded_at: string;
    format: string;
    resumes: {
        name: string;
    } | null;
}

interface UserAiUsage {
    id: string;
    created_at: string;
}

interface UserProfile {
    is_banned: boolean;
    ban_reason: string | null;
}

interface UserData {
    id: string;
    resumes: UserResume[];
    downloads: UserDownload[];
    aiUsage: UserAiUsage[];
    profile: UserProfile | null;
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const supabase = createClient();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            // Fetch resumes
            const { data: resumes } = await supabase
                .from("resumes")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            // Fetch downloads
            const { data: downloads } = await supabase
                .from("download_history")
                .select("*, resumes(name)")
                .eq("user_id", userId)
                .order("downloaded_at", { ascending: false })
                .limit(10);

            // Fetch AI usage
            const { data: aiUsage } = await supabase
                .from("ai_usage")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(10);

            // Fetch profile
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", userId)
                .single();

            setUserData({
                id: userId,
                resumes: resumes || [],
                downloads: downloads || [],
                aiUsage: aiUsage || [],
                profile: profile,
            });
            setLoading(false);
        };

        fetchUserData();
    }, [userId, supabase]);

    const handleBanUser = async () => {
        setActionLoading(true);
        const isBanned = userData?.profile?.is_banned;

        // Upsert profile
        await supabase
            .from("user_profiles")
            .upsert({
                user_id: userId,
                is_banned: !isBanned,
                ban_reason: !isBanned ? "Banned by admin" : null,
            });

        // Refresh data
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        setUserData((prev) => prev ? { ...prev, profile } : null);
        setActionLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!userData) {
        return <div className="text-white">User not found</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div 
                className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                onClick={() => {
                    setTimeout(() => {
                        router.push("/admin/users");
                    }, 100);
                }}
            >
                    <span className="text-lg">←</span> Back to Registry
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Profile Analysis</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-mono border border-slate-200">{userId}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Active Identity</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleBanUser}
                        disabled={actionLoading}
                        className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${userData.profile?.is_banned
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                            : "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200"
                            }`}
                    >
                        {actionLoading ? "Processing..." : userData.profile?.is_banned ? "Restore Access" : "Restrict Access"}
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            {userData.profile?.is_banned && (
                <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-8 flex items-start gap-6 shadow-xl shadow-rose-100/50">
                    <div className="text-4xl">⚠️</div>
                    <div>
                        <p className="text-rose-900 font-black text-lg tracking-tight">Identity Restrictive Mode Active</p>
                        {userData.profile.ban_reason && (
                            <p className="text-rose-600/80 font-medium mt-1 leading-relaxed italic">Reason for restriction: &quot;{userData.profile.ban_reason}&quot;</p>
                        )}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-indigo-200 transition-all">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Asset Volume</p>
                    <p className="text-4xl font-black text-slate-900">{userData.resumes.length} <span className="text-base text-slate-300 font-medium">Resumes</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-emerald-200 transition-all">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Export Activity</p>
                    <p className="text-4xl font-black text-slate-900">{userData.downloads.length} <span className="text-base text-slate-300 font-medium">Downloads</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-violet-200 transition-all">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Compute Usage</p>
                    <p className="text-4xl font-black text-slate-900">{userData.aiUsage.length} <span className="text-base text-slate-300 font-medium">AI Tasks</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resumes */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">📂 Digital Assets</h2>
                    {userData.resumes.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <p className="text-slate-400 font-medium">No assets recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userData.resumes.map((resume: UserResume) => (
                                <div key={resume.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">📄</div>
                                        <div>
                                            <p className="text-slate-900 font-bold">{resume.name}</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                                                Created {new Date(resume.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">→</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Downloads */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">📥 Export History</h2>
                    {userData.downloads.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <p className="text-slate-400 font-medium">No exports recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userData.downloads.map((download: UserDownload) => (
                                <div key={download.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xs">⬇️</div>
                                        <div>
                                            <p className="text-slate-900 font-bold leading-none">{download.resumes?.name || "Cleanup Resource"}</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-tighter">
                                                {new Date(download.downloaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 uppercase">
                                        {download.format}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
