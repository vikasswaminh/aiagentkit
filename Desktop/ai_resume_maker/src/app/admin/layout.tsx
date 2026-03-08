"use client";

import React from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-slate-50/50">
                <AdminSidebar />
                <main className="flex-1 pl-64 overflow-auto min-h-screen">
                    <div className="p-12 max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
