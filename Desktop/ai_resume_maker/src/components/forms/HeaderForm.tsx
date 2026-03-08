"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BasicsSchema } from "@/lib/schemas/resume";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResume } from "@/lib/context/ResumeContext";
import { z } from "zod";

interface HeaderFormProps {
    onNext: () => void;
}

export const HeaderForm: React.FC<HeaderFormProps> = ({ onNext }) => {
    const { data, updateData } = useResume();
    const [isGenerating, setIsGenerating] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(BasicsSchema),
        defaultValues: data.basics,
    });

    const handleGenerateSummary = async () => {
        if (data.experience.length === 0 && data.skills.length === 0) {
            alert("Please add some experience or skills first (you can come back to generate a summary later).");
            return;
        }
        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    experience: data.experience.map(e => ({ role: e.role, company: e.company, bullets: e.bullets })),
                    skills: data.skills,
                    education: data.education.map(e => ({ degree: e.degree, institution: e.institution })),
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate summary");
            }
            const result = await response.json();
            if (result.summary) {
                setValue("summary", result.summary);
            }
        } catch (error: unknown) {
            console.error("Summary generation error:", error);
            alert((error instanceof Error ? error.message : "Failed to generate summary") || "Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = (formData: z.infer<typeof BasicsSchema>) => {
        updateData({ basics: formData });
        onNext();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    error={errors.name?.message as string}
                    {...register("name")}
                />
                <Input
                    label="Email Address"
                    placeholder="e.g. john@example.com"
                    error={errors.email?.message as string}
                    {...register("email")}
                />
                <Input
                    label="Phone Number"
                    placeholder="e.g. +1 234 567 890"
                    error={errors.phone?.message as string}
                    {...register("phone")}
                />
                <Input
                    label="Location"
                    placeholder="e.g. New York, NY"
                    error={errors.location?.message as string}
                    {...register("location")}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Professional Summary</label>
                    <button
                        type="button"
                        onClick={handleGenerateSummary}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 h-9 bg-sky-50/50 border border-sky-100 text-primary font-bold text-sm hover:bg-sky-100 hover:border-primary/30 transition-all rounded-xl disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="text-sm opacity-80">&#x2728;</span>
                                AI Generate
                            </>
                        )}
                    </button>
                </div>
                <textarea
                    className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-slate-700"
                    placeholder="e.g. Innovative Software Engineer with a passion for building scalable web applications..."
                    {...register("summary")}
                />
                {errors.summary && <p className="text-xs text-rose-500 font-bold">{errors.summary.message as string}</p>}
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="rounded-2xl px-12">Save & Next</Button>
            </div>
        </form>
    );
};
