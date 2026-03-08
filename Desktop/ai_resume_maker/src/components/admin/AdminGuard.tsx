"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminGuardProps {
    children: React.ReactNode;
    requiredRole?: "admin" | "super_admin";
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, requiredRole = "admin" }) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setTimeout(() => {
                    router.push("/auth/login");
                }, 100);
                return;
            }

            const { data: adminUser } = await supabase
                .from("admin_users")
                .select("role")
                .eq("user_id", user.id)
                .single();

            if (!adminUser) {
                setIsAuthorized(false);
                setLoading(false);
                return;
            }

            // Strictly define allowed admin roles
            const allowedRoles = ["admin", "super_admin"];
            const isUserAdmin = allowedRoles.includes(adminUser.role);

            // If a specific role is required (e.g. super_admin for some pages)
            if (requiredRole === "super_admin") {
                setIsAuthorized(adminUser.role === "super_admin");
            } else {
                setIsAuthorized(isUserAdmin);
            }

            setLoading(false);
        };

        checkAdminStatus();
    }, [supabase, router, requiredRole]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Access Denied</h1>
                    <p className="text-slate-400">You don&apos;t have permission to access the admin panel.</p>
                    <button
                        onClick={() => {
                            setTimeout(() => {
                                router.push("/dashboard");
                            }, 100);
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
