"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useResume } from "@/lib/context/ResumeContext";

const FormSchema = z.object({
    experience: z.array(z.object({
        role: z.string().min(1, "Role is required"),
        company: z.string().min(1, "Company is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().optional().or(z.literal("")),
        bullets_text: z.string().optional(),
        bullets: z.array(z.string()).optional(),
    })),
});

interface ExperienceFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            experience: data.experience.length > 0
                ? data.experience.map(exp => ({
                    role: exp.role || "",
                    company: exp.company || "",
                    startDate: exp.startDate || "",
                    endDate: exp.endDate || "",
                    bullets: exp.bullets || [],
                    bullets_text: (exp.bullets || []).join("\n")
                }))
                : [{ role: "", company: "", startDate: "", endDate: "", bullets: [], bullets_text: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "experience",
    });

    const watchedExperience = useWatch({ control, name: "experience" });

    const onSubmit = (formData: z.infer<typeof FormSchema>) => {
        const transformedExperience = formData.experience.map((exp) => ({
            role: exp.role,
            company: exp.company,
            startDate: exp.startDate,
            endDate: exp.endDate || "",
            bullets: exp.bullets_text ? exp.bullets_text.split("\n").filter((b) => b.trim() !== "").map((b) => b.replace(/^[•\s*-]+/, "").trim()) : []
        }));
        updateData({ experience: transformedExperience });
        onNext();
    };

    const handleEnhanceExperience = (index: number, enhanced: string[]) => {
        setValue(`experience.${index}.bullets_text`, enhanced.join("\n"));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
                {fields.map((field, index) => (
                    <div key={field.id} className="relative p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Experience Entry #{index + 1}</h3>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
                            >
                                Remove
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Role / Title"
                                placeholder="e.g. Senior Software Engineer"
                                error={errors.experience?.[index]?.role?.message}
                                {...register(`experience.${index}.role` as const)}
                            />
                            <Input
                                label="Company / Organization"
                                placeholder="e.g. Acme Corp"
                                error={errors.experience?.[index]?.company?.message}
                                {...register(`experience.${index}.company` as const)}
                            />
                            <Input
                                label="Start Date"
                                placeholder="e.g. Jan 2022"
                                error={errors.experience?.[index]?.startDate?.message}
                                {...register(`experience.${index}.startDate` as const)}
                            />
                            <Input
                                label="End Date"
                                placeholder="e.g. Present"
                                error={errors.experience?.[index]?.endDate?.message}
                                {...register(`experience.${index}.endDate` as const)}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Key Achievements & Responsibilities</label>
                                <EnhanceButton
                                    type="experience"
                                    content={watchedExperience?.[index]?.bullets_text?.split("\n").filter((b: string) => b.trim()) || []}
                                    context={{
                                        role: watchedExperience?.[index]?.role,
                                        organization: watchedExperience?.[index]?.company,
                                    }}
                                    onEnhanced={(enhanced) => handleEnhanceExperience(index, enhanced)}
                                />
                            </div>
                            <Textarea
                                className="min-h-[150px] rounded-[1.5rem]"
                                placeholder="• Led development of a scalable microservices architecture...&#10;• Reduced infrastructure costs by 30% through optimization..."
                                error={errors.experience?.[index]?.bullets_text?.message}
                                {...register(`experience.${index}.bullets_text` as const)}
                            />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Separate each point with a new line. STAR method recommended.</p>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full h-16 border-dashed border-2 rounded-[2rem] hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-xs"
                onClick={() => append({ role: "", company: "", startDate: "", endDate: "", bullets: [], bullets_text: "" })}
            >
                + Add Experience
            </Button>

            {fields.length === 0 && (
                <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30">
                    No experience added yet. It&apos;s okay to skip for entry-level roles!
                </div>
            )}

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Save & Next</Button>
            </div>
        </form>
    );
};
