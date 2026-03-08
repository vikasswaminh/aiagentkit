"use client";

import React, { useState } from "react";
import { useResume } from "@/lib/context/ResumeContext";

export const ResumeScore: React.FC = () => {
    const { data } = useResume();
    const [isScoring, setIsScoring] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [tips, setTips] = useState<string[]>([]);
    const [expanded, setExpanded] = useState(false);

    const handleScore = async () => {
        setIsScoring(true);
        try {
            const response = await fetch("/api/score-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    basics: data.basics,
                    experience: data.experience,
                    education: data.education,
                    skills: data.skills,
                    achievements: data.achievements,
                    certifications: data.certifications,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to score resume");
            }

            const result = await response.json();
            setScore(result.score);
            setTips(result.tips || []);
            setExpanded(true);
        } catch (error: unknown) {
            console.error("Score error:", error);
            alert((error instanceof Error ? error.message : "Failed to score resume") || "Please try again.");
        } finally {
            setIsScoring(false);
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 80) return "text-emerald-600";
        if (s >= 60) return "text-amber-600";
        return "text-rose-600";
    };

    const getScoreBg = (s: number) => {
        if (s >= 80) return "bg-emerald-50 border-emerald-200";
        if (s >= 60) return "bg-amber-50 border-amber-200";
        return "bg-rose-50 border-rose-200";
    };

    const getScoreRing = (s: number) => {
        if (s >= 80) return "stroke-emerald-500";
        if (s >= 60) return "stroke-amber-500";
        return "stroke-rose-500";
    };

    const getScoreLabel = (s: number) => {
        if (s >= 80) return "Excellent";
        if (s >= 60) return "Good";
        if (s >= 40) return "Needs Work";
        return "Low";
    };

    return (
        <div className="space-y-4">
            {score === null ? (
                <button
                    onClick={handleScore}
                    disabled={isScoring}
                    className="w-full h-14 rounded-2xl font-black border-2 border-sky-100 bg-sky-50/50 hover:bg-sky-100 hover:border-primary/30 transition-all text-primary uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isScoring ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <span className="text-base">&#x2728;</span>
                            AI ATS Score Check
                        </>
                    )}
                </button>
            ) : (
                <div className={`rounded-2xl border p-6 space-y-4 ${getScoreBg(score)}`}>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="stroke-slate-200"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                />
                                <path
                                    className={getScoreRing(score)}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    strokeWidth="3"
                                    strokeDasharray={`${score}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${getScoreColor(score)}`}>
                                {score}
                            </span>
                        </div>
                        <div>
                            <p className={`text-lg font-black ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
                            <p className="text-xs text-slate-500 font-medium">ATS Compatibility Score</p>
                        </div>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {expanded ? "Hide Tips" : "Show Tips"}
                        </button>
                    </div>

                    {expanded && tips.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                            {tips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-primary font-black text-xs mt-0.5">&#x2192;</span>
                                    <p className="text-sm text-slate-700 font-medium">{tip}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => { setScore(null); setTips([]); setExpanded(false); }}
                        className="text-xs font-bold text-slate-400 hover:text-primary transition-colors"
                    >
                        Re-analyze
                    </button>
                </div>
            )}
        </div>
    );
};
