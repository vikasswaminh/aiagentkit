"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScaleWrapper } from "@/components/ui/ScaleWrapper";
import { templateList, sampleResumeData } from "@/lib/templates";
import { getTemplate } from "@/lib/templates/registry";
import { useResume } from "@/lib/context/ResumeContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function TemplatesPage() {
    const { setFullData, resetData } = useResume();
    const [selectedCategory, setSelectedCategory] = useState("All Templates");
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
    const router = useRouter();

    const categories = [
        { name: "All Templates", icon: "📁" },
        { name: "Professional", icon: "💼" },
        { name: "Modern", icon: "🎨" },
        { name: "ATS-Friendly", icon: "🤖" },
    ];

    const handleSelectTemplate = (templateId: string) => {
        resetData();
        localStorage.setItem("selectedTemplate", templateId);
        setFullData({ ...sampleResumeData, template: templateId });
        // Add a small delay to ensure the context update is processed before navigation
        setTimeout(() => {
            try {
                router.push("/builder");
            } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/builder";
            }
        }, 100);
    };

    return (
        <main className="min-h-screen bg-white">
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
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-[0_8px_16px_rgba(56,189,248,0.25)] ring-4 ring-primary/10">1</div>
                            <span className="font-black text-[11px] text-slate-900 uppercase tracking-widest leading-none">Design</span>
                        </div>
                        <div className="w-12 h-px bg-slate-100" />
                        <div className="flex items-center gap-3 opacity-40 grayscale">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-[10px]">2</div>
                            <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest leading-none">Content</span>
                        </div>
                        <div className="w-8 h-px bg-slate-100" />
                        <div className="flex items-center gap-3 opacity-40 grayscale">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-[10px]">3</div>
                            <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest leading-none">Export</span>
                        </div>
                    </div>

                    <div className="w-24" /> {/* Spacer for symmetry */}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-20 space-y-16 relative">
                {/* Background Grid Decoration */}
                <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                {/* Title Section */}
                <div className="text-center space-y-6 relative z-10">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Curated <span className="text-primary italic">Blueprints</span></h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Industry-standard aesthetics engineered for performance and impact.
                        <br />
                        <span className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-[0.2em] inline-block bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-inner">Choose your launchpad</span>
                    </p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-sm tracking-tight ${selectedCategory === cat.name
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {templateList
                        .filter(t => selectedCategory === "All Templates" || t.category.toLowerCase() === selectedCategory.toLowerCase().replace("-friendly", ""))
                        .map((template) => {
                            const ThumbnailTemplateComponent = getTemplate(template.id);
                            return (
                                <motion.div
                                    key={template.id}
                                    className="group relative"
                                    onMouseEnter={() => setHoveredTemplate(template.id)}
                                    onMouseLeave={() => setHoveredTemplate(null)}
                                >
                                    <div className={`aspect-[1/1.4142] bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden relative ${hoveredTemplate === template.id ? "border-primary shadow-2xl shadow-sky-100 -translate-y-2" : "border-slate-50 shadow-slate-200/50"
                                        }`}>
                                        {/* Thumbnail Rendering - Clipped to A4 aspect ratio */}
                                        <div className="absolute inset-0 overflow-hidden">
                                            <ScaleWrapper targetWidth={794}>
                                                <div className="w-[794px] h-[1123px] bg-white overflow-hidden">
                                                    <ThumbnailTemplateComponent data={{ ...sampleResumeData, template: template.id }} />
                                                </div>
                                            </ScaleWrapper>
                                        </div>

                                        {/* Overlay on hover */}
                                        <AnimatePresence>
                                            {hoveredTemplate === template.id && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8 z-20"
                                                >
                                                    <Button
                                                        onClick={() => handleSelectTemplate(template.id)}
                                                        className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl"
                                                    >
                                                        Use This Template
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h3 className="text-lg font-bold text-slate-800">{template.name}</h3>
                                        <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">{template.category || "Professional"}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                </div>
            </div>

            {/* Sticky Bottom Bar for Mobile (Optional) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:hidden z-50 w-[90%] lg:w-auto">
                <Button className="w-full h-14 rounded-full shadow-2xl shadow-sky-400/40 text-lg font-black">
                    Next: Enter Details
                </Button>
            </div>
        </main>
    );
}
