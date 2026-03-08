"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface Settings {
    signups_enabled: boolean;
    ai_enabled: boolean;
    max_resumes_per_user: number;
    max_ai_uses_per_day: number;
    site_name: string;
}

interface SettingRow {
    key: string;
    value: string;
}

export default function SettingsPage() {
    const supabase = createClient();
    const [settings, setSettings] = useState<Settings>({
        signups_enabled: true,
        ai_enabled: true,
        max_resumes_per_user: 10,
        max_ai_uses_per_day: 20,
        site_name: "Resume Builder",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from("system_settings")
                .select("*");

            if (data) {
                const settingsObj: Record<string, unknown> = {};
                data.forEach((row: SettingRow) => {
                    try {
                        settingsObj[row.key] = JSON.parse(row.value);
                    } catch {
                        settingsObj[row.key] = row.value;
                    }
                });
                setSettings({
                    signups_enabled: typeof settingsObj.signups_enabled === 'boolean' ? settingsObj.signups_enabled : true,
                    ai_enabled: typeof settingsObj.ai_enabled === 'boolean' ? settingsObj.ai_enabled : true,
                    max_resumes_per_user: typeof settingsObj.max_resumes_per_user === 'number' ? settingsObj.max_resumes_per_user : 10,
                    max_ai_uses_per_day: typeof settingsObj.max_ai_uses_per_day === 'number' ? settingsObj.max_ai_uses_per_day : 20,
                    site_name: typeof settingsObj.site_name === 'string' ? settingsObj.site_name : "Resume Builder",
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [supabase]);

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage(null);

        const updates = [
            { key: "signups_enabled", value: JSON.stringify(settings.signups_enabled) },
            { key: "ai_enabled", value: JSON.stringify(settings.ai_enabled) },
            { key: "max_resumes_per_user", value: JSON.stringify(settings.max_resumes_per_user) },
            { key: "max_ai_uses_per_day", value: JSON.stringify(settings.max_ai_uses_per_day) },
            { key: "site_name", value: JSON.stringify(settings.site_name) },
        ];

        for (const update of updates) {
            await supabase
                .from("system_settings")
                .upsert({ key: update.key, value: update.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }

        setSaving(false);
        setSaveMessage("Settings saved successfully!");
        setTimeout(() => setSaveMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
                    <p className="text-slate-500 font-medium text-lg">Manage platform-wide behavior, limits, and core features</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </div>
                        ) : "Deploy Changes"}
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm">{saveMessage}</span>
                </div>
            )}

            {/* Settings Sections */}
            <div className="grid grid-cols-1 gap-8">
                {/* General Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">General Branding</h2>
                        <p className="text-slate-400 text-[13px] font-medium mt-0.5 italic">Update the visible name and identity of your platform</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">Desktop Portal Name</label>
                            <input
                                type="text"
                                value={settings.site_name}
                                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Controls</h2>
                        <p className="text-slate-400 text-[13px] font-medium mt-0.5 italic">Toggle core functionalities and access routes</p>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100/50 rounded-2xl group transition-all hover:bg-white hover:border-indigo-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all">🔑</div>
                                <div>
                                    <p className="text-slate-900 font-bold tracking-tight">Public Registrations</p>
                                    <p className="text-slate-400 text-[13px] font-medium italic">Allow new accounts to be created on the landing page</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, signups_enabled: !settings.signups_enabled })}
                                className={`w-14 h-8 rounded-full transition-all relative p-1 ${settings.signups_enabled ? "bg-indigo-600" : "bg-slate-300"}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${settings.signups_enabled ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100/50 rounded-2xl group transition-all hover:bg-white hover:border-indigo-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all">🤖</div>
                                <div>
                                    <p className="text-slate-900 font-bold tracking-tight">AI Capability</p>
                                    <p className="text-slate-400 text-[13px] font-medium italic">Allow users to utilize OpenAI-powered enhancement tools</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, ai_enabled: !settings.ai_enabled })}
                                className={`w-14 h-8 rounded-full transition-all relative p-1 ${settings.ai_enabled ? "bg-indigo-600" : "bg-slate-300"}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${settings.ai_enabled ? "translate-x-6" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resource Limits */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Resource Guardrails</h2>
                        <p className="text-slate-400 text-[13px] font-medium mt-0.5 italic">Enforce usage thresholds to preserve system integrity and budget</p>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Document Capacity</label>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        value={settings.max_resumes_per_user}
                                        onChange={(e) => setSettings({ ...settings, max_resumes_per_user: parseInt(e.target.value) || 10 })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                    <p className="text-[11px] text-slate-400 italic">Total resumes a single user can maintain</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Daily AI Quota</label>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        value={settings.max_ai_uses_per_day}
                                        onChange={(e) => setSettings({ ...settings, max_ai_uses_per_day: parseInt(e.target.value) || 20 })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                    />
                                    <p className="text-[11px] text-slate-400 italic">OpenAI requests permitted per user per 24h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
