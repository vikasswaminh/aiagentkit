"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useResume } from "@/lib/context/ResumeContext";

export const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();
    const { resetData } = useResume();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        checkUser();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.reload();
    };

    return (

        <nav className="fixed w-full z-50 top-0 left-0 border-b border-neutral-200 bg-white/85 backdrop-blur-md transition-all">
            <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
                <div
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => {
                        router.push("/");
                    }}
                >
                    <Logo />
                </div>
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px] font-black uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    Free Forever
                </span>
                <div className="flex items-center gap-8">
                    <div
                        className="hidden md:block text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium cursor-pointer"
                        onClick={() => router.push("/blog")}
                    >
                        Blog
                    </div>
                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-6">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                        router.push("/dashboard");
                                    }}
                                >
                                    <Button size="sm" variant="secondary" className="border-neutral-300">Dashboard</Button>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-neutral-600 hover:text-neutral-900 font-medium text-sm transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div
                                    className="text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium cursor-pointer"
                                    onClick={() => {
                                        router.push("/auth/login");
                                    }}
                                >
                                    Login
                                </div>
                                <div
                                    className="cursor-pointer"
                                    onClick={() => {
                                        resetData();
                                        setTimeout(() => {
                                            router.push("/templates");
                                        }, 100);
                                    }}
                                >
                                    <Button variant="primary" size="sm" className="rounded-md px-5 h-9 font-medium">
                                        + Build Resume
                                    </Button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
};
