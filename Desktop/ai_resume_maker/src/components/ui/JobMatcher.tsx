"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { useResume } from "@/lib/context/ResumeContext";

export const JobMatcher: React.FC = () => {
    const { data } = useResume();
    const [isOpen, setIsOpen] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [isMatching, setIsMatching] = useState(false);
    const [result, setResult] = useState<{
        matchScore: number;
        matchedKeywords: string[];
        missingKeywords: string[];
        suggestions: string[];
    } | null>(null);

    const handleMatch = async () => {
        if (jobDescription.trim().length < 10) {
            alert("Please paste a job description (at least 10 characters).");
            return;
        }

        setIsMatching(true);
        try {
            const allBullets = data.experience.flatMap(e => e.bullets || []);
            const response = await fetch("/api/match-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resumeSkills: data.skills,
                    resumeBullets: allBullets,
                    jobDescription: jobDescription.trim(),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to match job");
            }

            setResult(await response.json());
        } catch (error: unknown) {
            console.error("Job match error:", error);
            alert((error instanceof Error ? error.message : "Failed to match job") || "Please try again.");
        } finally {
            setIsMatching(false);
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 75) return "text-emerald-600 bg-emerald-50";
        if (s >= 50) return "text-amber-600 bg-amber-50";
        return "text-rose-600 bg-rose-50";
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full h-14 rounded-2xl font-black border-2 border-violet-100 bg-violet-50/50 hover:bg-violet-100 hover:border-violet-200 transition-all text-violet-600 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
            >
                <span className="text-base">&#x1F3AF;</span>
                Match to Job Description
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Job Match Analysis</h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Paste a job description to see how well your resume matches.</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                                >
                                    &#x2715;
                                </button>
                            </div>

                            {!result ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="w-full min-h-[200px] p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-slate-700 text-sm"
                                        placeholder="Paste the full job description here..."
                                    />
                                    <Button
                                        onClick={handleMatch}
                                        isLoading={isMatching}
                                        className="w-full h-14 rounded-2xl font-black text-lg"
                                    >
                                        {isMatching ? "Analyzing..." : "Analyze Match"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-3xl ${getScoreColor(result.matchScore)}`}>
                                            {result.matchScore}%
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium mt-2">Job Match Score</p>
                                    </div>

                                    {result.matchedKeywords.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Matched Keywords</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {result.matchedKeywords.map((kw, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {result.missingKeywords.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Missing Keywords</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {result.missingKeywords.map((kw, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {result.suggestions.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Suggestions</p>
                                            {result.suggestions.map((tip, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <span className="text-primary font-black text-xs mt-0.5">&#x2192;</span>
                                                    <p className="text-sm text-slate-700 font-medium">{tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl"
                                            onClick={() => { setResult(null); setJobDescription(""); }}
                                        >
                                            Try Another
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 rounded-xl"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
