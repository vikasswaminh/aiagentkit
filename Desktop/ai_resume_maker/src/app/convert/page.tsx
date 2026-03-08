"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ScaleWrapper } from "@/components/ui/ScaleWrapper";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ResumeData } from "@/lib/schemas/resume";
import { getTemplate } from "@/lib/templates/registry";

import { useResume } from "@/lib/context/ResumeContext";
import { templateList } from "@/lib/templates";

const sampleJSON: ResumeData = {
    basics: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1 234 567 8900",
        location: "San Francisco, CA",
        summary: "Senior Software Engineer with 8+ years of experience in building scalable distributed systems and AI-powered applications. Expert in architectural design and cross-functional leadership."
    },
    education: [
        {
            institution: "Stanford University",
            degree: "M.S. in Computer Science",
            startDate: "2022",
            endDate: "2024"
        },
        {
            institution: "UC Berkeley",
            degree: "B.S. in Electrical Engineering",
            startDate: "2018",
            endDate: "2022"
        }
    ],
    experience: [
        {
            company: "Meta",
            role: "Senior Software Engineer",
            startDate: "2024",
            endDate: "Present",
            bullets: [
                "Leading infrastructure optimization for global messaging systems serving 2B+ users",
                "Reduced end-to-end latency by 15% using advanced caching strategies in distributed systems",
                "Mentored 10+ junior engineers and established new CI/CD standards across the platform team"
            ]
        },
        {
            company: "Google",
            role: "Software Engineering Intern",
            startDate: "2023",
            endDate: "2023",
            bullets: [
                "Developed scalable microservices using Node.js and Go for the Cloud Platform team",
                "Implemented real-time monitoring dashboard using React and D3.js",
                "Optimized database queries resulting in 30% faster data retrieval for analytics pipelines"
            ]
        }
    ],
    projects: [
        {
            name: "AI Resume Optimization Engine",
            description: "Built an intelligent parser for complex PDF structures using LLMs, achieving 95% accuracy in parsing multi-column resume layouts."
        },
        {
            name: "Distributed Task Scheduler",
            description: "Engineered a high-throughput task processing system capable of 100k+ ops/sec with fault-tolerant architecture."
        }
    ],
    skills: ["JavaScript", "TypeScript", "Python", "Go", "React", "Next.js", "Node.js", "Docker", "AWS"],
    achievements: [
        "First Place - International Collegiate Programming Contest (ICPC) Regionals",
        "Recipient of the National Merit Scholarship for Engineering Excellence"
    ],
    certifications: [
        "AWS Solutions Architect Professional",
        "Google Professional Cloud Architect"
    ],
    template: "compact"
};

import { Logo } from "@/components/ui/Logo";

export default function ConvertPage() {
    const router = useRouter();
    const { setFullData } = useResume();
    const [jsonInput, setJsonInput] = useState(JSON.stringify(sampleJSON, null, 2));
    const [selectedTemplate, setSelectedTemplate] = useState("compact");
    const [copied, setCopied] = useState(false);

    // Derived state for resume data
    const { resumeData, parseError } = React.useMemo(() => {
        try {
            const parsed = JSON.parse(jsonInput);
            parsed.template = selectedTemplate;
            return { resumeData: parsed as ResumeData, parseError: null };
        } catch (e: unknown) {
            let msg = "Invalid JSON";
            if (e instanceof Error) msg = e.message;
            return { resumeData: sampleJSON, parseError: msg };
        }
    }, [jsonInput, selectedTemplate]);

    const handleImportToBuilder = () => {
        setFullData(resumeData);
        // Persist to localStorage as well for insurance
        localStorage.setItem("resumeData", JSON.stringify(resumeData));
        setTimeout(() => {
            try {
                router.push("/preview");
            } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/preview";
            }
        }, 100);
    };

    const handleCopyJSON = () => {
        navigator.clipboard.writeText(jsonInput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadJSON = () => {
        const blob = new Blob([jsonInput], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadSample = () => {
        setJsonInput(JSON.stringify(sampleJSON, null, 2));
    };

    return (
        <main className="h-screen flex flex-col bg-white overflow-hidden font-outfit">
            {/* Header - SaaS Style */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl transition-all">
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Product</span>
                            <span className="text-sm font-black text-slate-900 tracking-tight">JSON EDITOR ARC</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-4 focus-within:ring-primary/10 transition-all group">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Template</span>
                            <div className="w-px h-4 bg-slate-200" />
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="bg-transparent text-sm font-black text-slate-900 focus:outline-none cursor-pointer appearance-none pr-6 relative"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2364748b\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                            >
                                {templateList.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-8 w-px bg-slate-200 mx-2" />

                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
                            <Button variant="ghost" size="sm" onClick={handleLoadSample} title="Reset to Sample" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500">
                                ↺
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCopyJSON} title="Copy JSON" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500">
                                {copied ? "✓" : "❐"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleDownloadJSON} title="Download File" className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500">
                                ⤓
                            </Button>
                        </div>

                        <Button onClick={handleImportToBuilder} className="h-11 font-black rounded-2xl px-8 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0 tracking-tight">
                            Finalize Resume →
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content - Split View */}
            <div className="flex-1 flex pt-[72px] overflow-hidden">
                {/* Left Panel - JSON Editor */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[45%] border-r border-slate-200/60 flex flex-col bg-[#0f172a]"
                >
                    <div className="h-14 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                SOURCE_CODE.json
                            </span>
                        </div>
                        {parseError && (
                            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                ⚠ {parseError}
                            </span>
                        )}
                    </div>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="flex-1 p-10 font-mono text-[13px] resize-none focus:outline-none bg-transparent text-sky-400/90 selection:bg-sky-500/20 leading-[1.8] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent transistion-colors"
                        placeholder="Paste your resume JSON here..."
                        spellCheck={false}
                    />
                    <div className="h-8 px-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>UTF-8</span>
                            <span>JSON</span>
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            Ready
                        </div>
                    </div>
                </motion.div>

                {/* Right Panel - Live Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden"
                >
                    {/* Background Grid Decoration */}
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
                    <div className="absolute inset-0 z-0 bg-white/40" />

                    <div className="h-14 px-8 border-b border-slate-200/60 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                Live_Preview.pdf
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                60 FPS
                            </div>
                            <div className="h-4 w-px bg-slate-200" />
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-2">
                                Layout: <span className="text-primary">{selectedTemplate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-16 flex justify-center relative z-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {parseError ? (
                            <div className="text-center text-slate-400 mt-40 max-w-sm">
                                <div className="text-7xl mb-8 grayscale opacity-20 drop-shadow-2xl">⚡</div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sync Interrupted</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed px-6">Your JSON blueprint has structural flaws. Stabilize the syntax to re-engage the preview.</p>
                                <Button onClick={handleLoadSample} variant="outline" className="mt-8 rounded-2xl border-slate-200 font-bold hover:bg-white">
                                    Restore Blueprint
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full max-w-[900px]">
                                <ScaleWrapper targetWidth={794}>
                                    <div className="bg-white shadow-[0_50px_100px_-20px_rgba(15,23,42,0.15)] ring-1 ring-slate-950/5 rounded-sm overflow-hidden transform-gpu">
                                        {React.createElement(getTemplate(resumeData.template || "simple"), { data: resumeData })}
                                    </div>
                                </ScaleWrapper>
                                <div className="h-20" /> {/* Extra space at bottom */}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
