"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: "info" | "warning" | "success";
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

export default function AnnouncementsPage() {
    const supabase = createClient();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "info" as "info" | "warning" | "success",
    });
    const [saving, setSaving] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        const { data } = await supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });
        setAnnouncements(data || []);
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCreate = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("announcements").insert({
            title: formData.title,
            content: formData.content,
            type: formData.type,
            created_by: user?.id,
        });

        setFormData({ title: "", content: "", type: "info" });
        setShowForm(false);
        setSaving(false);
        fetchAnnouncements();
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        await supabase
            .from("announcements")
            .update({ is_active: !isActive })
            .eq("id", id);
        fetchAnnouncements();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this announcement?")) {
            await supabase.from("announcements").delete().eq("id", id);
            fetchAnnouncements();
        }
    };

    const typeColors = {
        info: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100",
        warning: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-indigo-600 shadow-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Announcements</h1>
                    <p className="text-slate-500 font-medium mt-1">Broadcast messages to all users</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold active:scale-95"
                >
                    {showForm ? "Cancel" : "+ New Announcement"}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-xl shadow-slate-200/50">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        📣 Create Announcement
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    placeholder="Enter subject..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notice Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "info" | "warning" | "success" })}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="info">Information (Blue)</option>
                                    <option value="warning">Critical Warning (Yellow)</option>
                                    <option value="success">System Update (Green)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all h-[132px] resize-none"
                                placeholder="Describe the announcement in detail..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !formData.title || !formData.content}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 font-bold shadow-lg"
                        >
                            {saving ? "Deploying..." : "Send Announcement"}
                        </button>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-6">
                {announcements.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📭</div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No notifications deployed</p>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className={`group border rounded-[2rem] p-8 transition-all hover:shadow-xl hover:-translate-y-1 ${typeColors[announcement.type]} ${!announcement.is_active ? "opacity-60 bg-slate-50 border-slate-200 shadow-none grayscale" : "shadow-lg"
                                }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="h-2 w-2 rounded-full bg-current animate-pulse"></div>
                                        <h3 className="text-xl font-black tracking-tight">{announcement.title}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border-2 ${typeColors[announcement.type]}`}>
                                            {announcement.type}
                                        </span>
                                        {!announcement.is_active && (
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase">Disabled</span>
                                        )}
                                    </div>
                                    <p className="text-lg leading-relaxed opacity-90 font-medium">{announcement.content}</p>
                                    <div className="flex items-center gap-2 mt-6">
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] shadow-sm">📅</div>
                                        <p className="text-[11px] font-bold opacity-60 uppercase tracking-widest">
                                            Deployed: {new Date(announcement.created_at).toLocaleDateString()} at {new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 self-end md:self-start">
                                    <button
                                        onClick={() => handleToggle(announcement.id, announcement.is_active)}
                                        className="px-5 py-2.5 bg-white/50 backdrop-blur-sm border-2 border-current/20 rounded-xl text-sm font-bold hover:bg-white transition-all active:scale-95"
                                    >
                                        {announcement.is_active ? "Pause Activity" : "Resume Activity"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement.id)}
                                        className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg active:scale-95"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
