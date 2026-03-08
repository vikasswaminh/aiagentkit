"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/analytics", label: "Analytics", icon: "📈" },
    { href: "/admin/ai-usage", label: "AI Usage", icon: "🤖" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
    { href: "/admin/announcements", label: "Announcements", icon: "📢" },
    { href: "/admin/moderation", label: "Moderation", icon: "🛡️" },
    { href: "/admin/security", label: "Security", icon: "🔐" },
    { href: "/admin/exports", label: "Exports", icon: "📤" },
];

export const AdminSidebar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-950 flex flex-col h-screen fixed left-0 top-0 z-[60] border-r border-slate-900">
            {/* Logo */}
            <div className="p-6">
                <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                        setTimeout(() => {
                            router.push("/admin");
                        }, 100);
                    }}
                >
                    <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-900/20">R</div>
                    <div>
                        <h1 className="text-white font-bold tracking-tight">Admin.ai</h1>
                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest leading-none mt-1">Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <div
                            key={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group cursor-pointer ${isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                            onClick={() => {
                                setTimeout(() => {
                                    router.push(item.href);
                                }, 100);
                            }}
                        >
                            <span className={`text-[17px] transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</span>
                            <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-900 mt-auto">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all group"
                >
                    <span className="text-[17px] group-hover:scale-110 transition-transform">🏠</span>
                    <span className="text-[14px] font-bold tracking-tight">Return to App</span>
                </Link>
            </div>
        </aside>
    );
};
