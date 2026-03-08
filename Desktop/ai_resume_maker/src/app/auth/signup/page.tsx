"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (data.user) {
            if (data.session) {
                router.push("/dashboard");
            } else {
                setError("Please check your email to confirm your account before logging in.");
                setLoading(false);
            }
        }
    };


    return (
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-50 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-50 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 opacity-60 pointer-events-none" />

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
                        <h1 className="text-3xl font-extrabold text-[#2d3748] tracking-tight">Create account</h1>
                        <p className="text-slate-500 font-medium text-lg">Start building your professional resume</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-14 rounded-xl text-lg font-bold"
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-14 rounded-xl text-lg font-bold"
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-14 rounded-xl text-lg font-bold"
                        />
                        <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-sky-100" isLoading={loading}>
                            Create Account
                        </Button>
                    </form>


                    <p className="text-center font-bold text-slate-500">
                        Already have an account?{" "}
                        <span
                            className="text-primary hover:text-primary-dark transition-colors font-black cursor-pointer"
                            onClick={() => {
                                setTimeout(() => {
                                    router.push("/auth/login");
                                }, 100);
                            }}
                        >
                            Sign in
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
