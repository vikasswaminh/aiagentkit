"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useResume } from "@/lib/context/ResumeContext";

const FormSchema = z.object({
    skills_text: z.string().min(1, "At least one skill is required"),
});

interface SkillsFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            skills_text: data.skills.join(", "),
        },
    });

    const handleSuggestSkills = async () => {
        if (data.experience.length === 0) {
            alert("Please add some experience first so AI can suggest relevant skills.");
            return;
        }
        setIsSuggesting(true);
        setSuggestions([]);
        try {
            const currentSkills = getValues("skills_text")
                .split(",").map(s => s.trim()).filter(s => s !== "");
            const response = await fetch("/api/suggest-skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    experience: data.experience.map(e => ({ role: e.role, company: e.company, bullets: e.bullets })),
                    currentSkills,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to suggest skills");
            }
            const result = await response.json();
            if (result.suggestions?.length > 0) {
                setSuggestions(result.suggestions);
            }
        } catch (error: unknown) {
            console.error("Skill suggestion error:", error);
            alert((error instanceof Error ? error.message : "Failed to suggest skills") || "Please try again.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const addSuggestion = (skill: string) => {
        const current = getValues("skills_text");
        const currentArr = current.split(",").map(s => s.trim()).filter(s => s !== "");
        if (!currentArr.some(s => s.toLowerCase() === skill.toLowerCase())) {
            const updated = current.trim() ? `${current.trim()}, ${skill}` : skill;
            setValue("skills_text", updated);
            updateData({ skills: [...currentArr, skill] });
        }
        setSuggestions(prev => prev.filter(s => s !== skill));
    };

    const onSubmit = (formData: z.infer<typeof FormSchema>) => {
        const skillsArray = formData.skills_text
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
        updateData({ skills: skillsArray });
        onNext();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Technical & Soft Skills</label>
                        <button
                            type="button"
                            onClick={handleSuggestSkills}
                            disabled={isSuggesting}
                            className="flex items-center gap-2 px-4 h-9 bg-sky-50/50 border border-sky-100 text-primary font-bold text-sm hover:bg-sky-100 hover:border-primary/30 transition-all rounded-xl disabled:opacity-50"
                        >
                            {isSuggesting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Suggesting...
                                </>
                            ) : (
                                <>
                                    <span className="text-sm opacity-80">&#x2728;</span>
                                    AI Suggest
                                </>
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <Textarea
                            className="min-h-[200px] rounded-[1.5rem] p-6 text-lg leading-relaxed shadow-inner"
                            placeholder="e.g. React, TypeScript, Node.js, Python, AWS, Docker, Git, Agile Methodology..."
                            error={errors.skills_text?.message as string}
                            {...register("skills_text")}
                        />
                        <div className="absolute top-4 right-4 text-xs font-black text-slate-300 uppercase tracking-tighter">
                            COMMA SEPARATED
                        </div>
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100">
                        <p className="text-xs text-primary font-black uppercase tracking-widest mb-3">AI Suggested Skills — Click to Add</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((skill, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => addSuggestion(skill)}
                                    className="px-3 py-1.5 bg-white text-primary text-xs font-black rounded-lg uppercase tracking-wider border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
                                >
                                    + {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white/60 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Live Preview Tags</p>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-lg uppercase tracking-wider border border-primary/20">
                                {skill}
                            </span>
                        ))}
                        {data.skills.length === 0 && <span className="text-slate-300 text-xs italic">Start typing to see tags...</span>}
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-md mx-auto">
                TIP: MIX TECHNICAL TOOLS WITH CORE COMPETENCIES FOR BEST ATS RESULTS.
            </p>

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Save & Next</Button>
            </div>
        </form>
    );
};
