"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { Logo } from "@/components/ui/Logo";
import { ImportResumeModal } from "@/components/dashboard/ImportResumeModal";
import { useResume } from "@/lib/context/ResumeContext";
import { ResumeData } from "@/lib/schemas/resume";

interface Resume {
    id: string;
    name: string;
    data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

interface Download {
    id: string;
    format: string;
    downloaded_at: string;
    resumes: { name: string } | null;
}

interface DashboardClientProps {
    user: User;
    resumes: Resume[];
    downloads: Download[];
}

export default function DashboardClient({ user, resumes: initialResumes }: DashboardClientProps) {
    const [resumes, setResumes] = useState(initialResumes);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { setFullData, resumeId: currentResumeId, resetData } = useResume();

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data } = await supabase
                .from("admin_users")
                .select("role")
                .eq("user_id", user.id)
                .single();

            setIsAdmin(!!data);
        };
        checkAdminStatus();
    }, [supabase, user.id]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setTimeout(() => {
            router.push("/");
        }, 100);
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resume?")) return;

        setDeletingId(id);
        const { error } = await supabase.from("resumes").delete().eq("id", id);

        if (!error) {
            setResumes(resumes.filter(r => r.id !== id));
        }
        setDeletingId(null);
    };

    const handleEdit = (resume: Resume) => {
        // Set both localStorage (for refresh persistence) and Context (for immediate state)
        localStorage.setItem("editResumeId", resume.id);
        localStorage.setItem("resumeData", JSON.stringify(resume.data));
        localStorage.setItem("editResumeName", resume.name);

        // Update context immediately
        console.log("Dashboard: Setting context data for editing", resume.name);
        setFullData(resume.data as unknown as ResumeData);

        setTimeout(() => {
            try {
                router.push("/builder?edit=true");
            } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/builder?edit=true";
            }
        }, 100);
    };

    const handlePreview = (resume: Resume) => {
        // Set both localStorage (for refresh persistence) and Context (for immediate state)
        localStorage.setItem("editResumeId", resume.id);
        localStorage.setItem("resumeData", JSON.stringify(resume.data));
        localStorage.setItem("editResumeName", resume.name);

        // Update context immediately
        console.log("Dashboard: Setting context data for preview", resume.name);
        setFullData(resume.data as unknown as ResumeData);

        setTimeout(() => {
            try {
                router.push("/preview");
            } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/preview";
            }
        }, 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <main className="min-h-screen bg-slate-50/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-[1800px] mx-auto px-6 h-[76px] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={() => {
                                setTimeout(() => {
                                    router.push("/");
                                }, 100);
                            }}
                        >
                            <Logo />
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Workspace</span>
                            <span className="text-sm font-black text-slate-900 tracking-tight">RESUME DESIGN STUDIO</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div
                            className="cursor-pointer"
                            onClick={() => {
                                setTimeout(() => {
                                    router.push("/");
                                }, 100);
                            }}
                        >
                            <Button variant="ghost" size="sm" className="font-black text-slate-500 hover:text-slate-900 rounded-xl px-5 uppercase tracking-widest text-[10px] hidden md:flex gap-2">
                                Home
                            </Button>
                        </div>
                        {isAdmin && (
                            <div
                                className="cursor-pointer"
                                onClick={() => {
                                    setTimeout(() => {
                                        router.push("/admin");
                                    }, 100);
                                }}
                            >
                                <Button variant="ghost" size="sm" className="font-black text-primary hover:bg-sky-50 rounded-xl px-5 uppercase tracking-widest text-[10px] hidden md:flex">
                                    🛡️ Admin Space
                                </Button>
                            </div>
                        )}
                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[11px] font-black text-slate-900 leading-none">{user.email?.split('@')[0]}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{user.email}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="h-10 font-black rounded-xl px-6 border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1800px] mx-auto px-6 py-16 space-y-16 relative">
                {/* Background Grid Decoration */}
                <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                {/* Welcome Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10"
                >
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Your <span className="text-primary">Portfolio</span></h1>
                        <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">Refine your professional identity. Launch new designs or edit existing masterpieces.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div
                            className="cursor-pointer"
                            onClick={() => setIsImportModalOpen(true)}
                        >
                            <Button
                                variant="ghost"
                                className="h-14 font-black text-slate-600 hover:bg-white hover:shadow-sm px-8 rounded-[1.5rem] border border-transparent hover:border-slate-200 transition-all flex items-center gap-3"
                            >
                                <span>📤</span> IMPORT EXISTING RESUME
                            </Button>
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
                            <Button size="md" className="h-14 bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-200 font-black px-10 rounded-[1.5rem] transition-all hover:-translate-y-1">
                                + NEW RESUME
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Resumes Grid */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4 pb-2 border-b border-slate-100">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Resumes ({resumes.length})</h2>
                    </div>

                    {resumes.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-inner">
                                📄
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to start?</h3>
                            <p className="text-slate-500 font-medium mb-10 max-w-xs text-lg">
                                Create your first professional resume in minutes with our AI tools.
                            </p>
                            <div
                                className="cursor-pointer"
                                onClick={() => {
                                    setTimeout(() => {
                                        router.push("/templates");
                                    }, 100);
                                }}
                            >
                                <Button size="lg" className="h-16 px-12 rounded-[2rem] text-xl">Create My First Resume</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {resumes.map((resume, index) => (
                                <motion.div
                                    key={resume.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-sky-100 transition-all group"
                                >
                                    <div className="flex flex-col h-full space-y-8">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-extrabold text-slate-800 line-clamp-1">{resume.name}</h3>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <span className="w-2 h-2 rounded-full bg-accent" />
                                                    Updated {formatDate(resume.updated_at)}
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 bg-slate-50 group-hover:bg-primary/10 group-hover:text-primary rounded-2xl flex items-center justify-center text-slate-300 transition-all duration-300 shadow-inner">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1 h-12 rounded-2xl font-black text-sm shadow-lg shadow-sky-50"
                                                onClick={() => handlePreview(resume)}
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-12 rounded-2xl font-black text-sm"
                                                onClick={() => handleEdit(resume)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-12 h-12 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex-shrink-0"
                                                onClick={() => handleDelete(resume.id)}
                                                isLoading={deletingId === resume.id}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div >
            <ImportResumeModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </main >
    );
}
