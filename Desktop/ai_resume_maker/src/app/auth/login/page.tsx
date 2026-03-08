"use client";

import React, { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

// Inner component that uses useSearchParams
function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Get redirect URL from query params, default to dashboard
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setTimeout(() => {
                router.push(redirectTo);
            }, 100);
        }
    };

    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sky-50 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-50 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 opacity-60 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md space-y-10 relative z-10"
            >
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="cursor-pointer"
                        onClick={() => {
                            setTimeout(() => {
                                router.push("/");
                            }, 100);
                        }}
                    >
                        <Logo />
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-sky-100 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold text-[#2d3748] tracking-tight">Welcome back</h1>
                        <p className="text-slate-500 font-medium text-lg">Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-14 rounded-xl text-lg font-bold"
                        />
                        <div className="space-y-2">
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-14 rounded-xl text-lg font-bold"
                            />
                            <div className="flex justify-end pr-1">
                                <Link href="#" className="text-sm font-bold text-primary hover:text-primary-dark">Forgot password?</Link>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-sky-100" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>


                    <p className="text-center font-bold text-slate-500">
                        Don&apos;t have an account?{" "}
                        <span
                            className="text-primary hover:text-primary-dark transition-colors font-black cursor-pointer"
                            onClick={() => {
                                setTimeout(() => {
                                    router.push("/auth/signup");
                                }, 100);
                            }}
                        >
                            Sign up
                        </span>
                    </p>
                </div>

                <div className="text-center font-black">
                    <div
                        className="text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
                        onClick={() => {
                            setTimeout(() => {
                                router.push("/");
                            }, 100);
                        }}
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

// Loading fallback for Suspense
function LoginFallback() {
    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="animate-pulse">
                    <div className="h-12 w-48 bg-slate-200 rounded-xl mx-auto mb-8" />
                    <div className="h-96 bg-slate-100 rounded-[3rem]" />
                </div>
            </div>
        </main>
    );
}

// Main export wrapped in Suspense
export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
