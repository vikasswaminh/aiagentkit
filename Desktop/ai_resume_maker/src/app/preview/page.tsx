"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ScaleWrapper } from "@/components/ui/ScaleWrapper";
import { Input } from "@/components/ui/Input";
import { useResume } from "@/lib/context/ResumeContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getTemplate } from "@/lib/templates/registry";
import { Logo } from "@/components/ui/Logo";
import { ResumePrintLayout } from "@/components/resume/ResumePrintLayout";
import { ResumeScore } from "@/components/ui/ResumeScore";
import { JobMatcher } from "@/components/ui/JobMatcher";

import "@/styles/print.css";

export default function PreviewPage() {
    const { data, saveResume, resumeName, setResumeName, resumeId, validationError, clearValidationError, loadEditFromStorage } = useResume();
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [tempName, setTempName] = useState(resumeName);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const resumeRef = useRef<HTMLDivElement>(null);

    // Validate data before rendering
    const [isDataValid, setIsDataValid] = useState(false);

    useEffect(() => {
        // Force load from storage when landing on preview
        loadEditFromStorage();
    }, [loadEditFromStorage]);

    useEffect(() => {
        // Check if we have valid data
        if (!data || !data.basics) {
            console.warn("Invalid or missing resume data");
            setIsDataValid(false);
            return;
        }

        // Validate required fields
        const requiredFields = [
            { field: data.basics.name, name: "Name" },
            { field: data.basics.location, name: "Location" },
            { field: data.basics.phone, name: "Phone" },
            { field: data.basics.email, name: "Email" }
        ];

        const missingFields = requiredFields.filter(f => !f.field || f.field.trim() === "");

        if (missingFields.length > 0) {
            console.warn("Missing required fields:", missingFields.map(f => f.name).join(", "));
            setIsDataValid(false);
            return;
        }

        setIsDataValid(true);
    }, [data, router]);

    const TemplateComponent = getTemplate(data.template || "simple") || getTemplate("simple");

    const handleDownload = async () => {
        setIsExporting(true);

        // Validate data before export
        if (!data.basics?.name) {
            alert("Please fill in your name before exporting.");
            setIsExporting(false);
            return;
        }

        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Resume_${data.basics.name.replace(/\s+/g, "_")}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                if (resumeId) {
                    await fetch("/api/downloads", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ resume_id: resumeId, format: "pdf" }),
                    });
                }
            } else {
                const errorData = await response.json();
                alert(`PDF generation failed: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Export error:", error);
            alert("Error exporting PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setResumeName(tempName);
        const success = await saveResume(tempName);
        setIsSaving(false);

        if (success) {
            setShowSaveModal(false);
            setSaveSuccess(true);
            router.refresh(); // Refresh to sync dashboard data
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50/30">
            {/* Step Progress Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-[76px] flex items-center justify-between">
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

                    {/* Progress Steps */}
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-emerald-100 italic">✓</div>
                            <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest leading-none">Design</span>
                        </div>
                        <div className="w-8 h-px bg-slate-100" />
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-emerald-100 italic">✓</div>
                            <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest leading-none">Content</span>
                        </div>
                        <div className="w-12 h-px bg-primary/20" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-[0_8px_16px_rgba(56,189,248,0.25)] ring-4 ring-primary/10">3</div>
                            <span className="font-black text-[11px] text-slate-900 uppercase tracking-widest leading-none">Export</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="font-black text-slate-600 hover:bg-slate-50 rounded-xl px-5"
                            onClick={() => {
                                setTimeout(() => {
                                    router.push("/dashboard");
                                }, 100);
                            }}
                        >
                            Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-16 relative">
                {/* Background Grid Decoration */}
                <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                {/* Validation Error Display */}
                {validationError && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                                <p className="text-red-700 font-medium">{validationError}</p>
                            </div>
                            <button
                                onClick={clearValidationError}
                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-start relative z-10">

                    <div className="bg-white p-2 sm:p-4 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.12)] border border-slate-200/60 overflow-hidden w-full max-w-[850px] ring-1 ring-slate-950/5">
                        <div className="w-full aspect-[1/1.4142] relative bg-slate-50/50 rounded-[2rem] overflow-hidden flex items-center justify-center">
                            {!isDataValid ? (
                                <div className="text-center space-y-4 p-8">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-red-600 font-bold text-xl">!</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-slate-700 font-medium">Invalid resume data</p>
                                        <p className="text-slate-500 text-sm">Please fill in all required fields before previewing</p>
                                        <Button
                                            onClick={() => {
                                                try {
                                                    router.push("/builder");
                                                } catch (error) {
                                                    console.error("Navigation error:", error);
                                                    window.location.href = "/builder";
                                                }
                                            }}
                                            className="mt-4"
                                        >
                                            Go to Builder
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <ScaleWrapper targetWidth={794}>
                                    <ResumePrintLayout className="shadow-2xl shadow-slate-900/20">
                                        <TemplateComponent data={data} />
                                    </ResumePrintLayout>
                                </ScaleWrapper>
                            )}
                        </div>
                    </div>

                    {/* Download & Actions Sidebar */}
                    <aside className="lg:sticky lg:top-32 space-y-10">
                        <div className="bg-white rounded-[3rem] p-10 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)] border border-slate-200/60 space-y-10 ring-1 ring-slate-950/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="space-y-4 relative z-10">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Success! <br />Your Resume is Ready</h1>
                                <p className="text-slate-500 font-medium leading-relaxed">You&apos;re one step closer to your next career milestone. Export your polished resume below.</p>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <Button
                                    onClick={handleDownload}
                                    isLoading={isExporting}
                                    className="w-full h-16 text-xl font-black rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-200 flex items-center justify-between px-8 group transition-all hover:-translate-y-1"
                                >
                                    <span>Download PDF</span>
                                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                                </Button>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-600 uppercase tracking-widest text-[10px]"
                                        onClick={() => {
                                            setTempName(resumeName || data.basics.name || "My Resume");
                                            setShowSaveModal(true);
                                        }}
                                    >
                                        Save to Cloud
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all text-slate-600 uppercase tracking-widest text-[10px]"
                                        onClick={() => {
                                            setTimeout(() => {
                                                try {
                                                    router.push("/builder?edit=true");
                                                } catch (error) {
                                                    console.error("Navigation error:", error);
                                                    window.location.href = "/builder?edit=true";
                                                }
                                            }, 100);
                                        }}
                                    >
                                        Edit Details
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-50 space-y-4 text-center relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none mb-2">
                                    <span className="animate-pulse">★</span> Recruiter Tip
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">
                                    &quot;PDF is the gold standard for resumes. It ensures your layout, fonts, and formatting remain identical on every recruiter&apos;s screen.&quot;
                                </p>
                            </div>
                        </div>

                        {/* AI Tools */}
                        <div className="bg-white rounded-3xl p-6 space-y-4 border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">AI Tools</h3>
                            <ResumeScore />
                            <JobMatcher />
                        </div>

                        {/* Additional Options */}
                        <div className="bg-slate-50/50 rounded-3xl p-6 space-y-4 border border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Other Formats</h3>
                            <div className="flex gap-4">
                                <button onClick={() => { }} className="flex-1 bg-white h-12 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-primary transition-colors flex items-center justify-center gap-2">
                                    DOCX
                                </button>
                                <button onClick={() => { }} className="flex-1 bg-white h-12 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-primary transition-colors flex items-center justify-center gap-2">
                                    TXT
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Save Modal */}
            <AnimatePresence>
                {showSaveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowSaveModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Almost there!</h2>
                            <p className="text-slate-500 font-medium mb-8">Give your resume a name so you can find it later.</p>

                            <Input
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder="e.g., Senior Developer Resume"
                                className="h-14 rounded-xl text-lg font-bold"
                            />

                            <div className="flex gap-4 mt-8">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-14 rounded-xl"
                                    onClick={() => setShowSaveModal(false)}
                                >
                                    Wait, Not Yet
                                </Button>
                                <Button
                                    className="flex-1 h-14 rounded-xl"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                >
                                    Save Now
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Success Toast */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 50, x: "-50%" }}
                        className="fixed bottom-10 left-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl z-[100] font-bold flex items-center gap-3"
                    >
                        <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs">✓</span>
                        Saved to your dashboard successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    );
}
