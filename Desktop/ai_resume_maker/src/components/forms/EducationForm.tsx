"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EducationSchema } from "@/lib/schemas/resume";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResume } from "@/lib/context/ResumeContext";

const EducationEntrySchema = z.object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
});

const FormSchema = z.object({
    education: z.array(EducationEntrySchema),
});

interface EducationFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            education: data.education.length > 0
                ? data.education.map(edu => ({
                    institution: edu.institution || "",
                    degree: edu.degree || "",
                    startDate: edu.startDate || "",
                    endDate: edu.endDate || "",
                }))
                : [{ degree: "", institution: "", startDate: "", endDate: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "education",
    });

    const onSubmit = (formData: z.infer<typeof FormSchema>) => {
        const transformedEducation = formData.education.map(edu => ({
            institution: edu.institution,
            degree: edu.degree,
            startDate: edu.startDate,
            endDate: edu.endDate || "",
        }));
        updateData({ education: transformedEducation });
        onNext();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
                {fields.map((field, index) => (
                    <div key={field.id} className="relative p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Education Entry #{index + 1}</h3>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Degree / Course"
                                placeholder="e.g. B.S. in Computer Science"
                                error={errors.education?.[index]?.degree?.message}
                                {...register(`education.${index}.degree` as const)}
                            />
                            <Input
                                label="Institution"
                                placeholder="e.g. Stanford University"
                                error={errors.education?.[index]?.institution?.message}
                                {...register(`education.${index}.institution` as const)}
                            />
                            <Input
                                label="Start Date"
                                placeholder="e.g. 2020"
                                error={errors.education?.[index]?.startDate?.message}
                                {...register(`education.${index}.startDate` as const)}
                            />
                            <Input
                                label="End Date"
                                placeholder="e.g. 2024"
                                error={errors.education?.[index]?.endDate?.message}
                                {...register(`education.${index}.endDate` as const)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full h-16 border-dashed border-2 rounded-[2rem] hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-xs"
                onClick={() => append({ degree: "", institution: "", startDate: "", endDate: "" })}
            >
                + Add Another Education
            </Button>

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Save & Next</Button>
            </div>
        </form>
    );
};
