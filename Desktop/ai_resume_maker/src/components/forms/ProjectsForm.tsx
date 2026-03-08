"use client";

import React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useResume } from "@/lib/context/ResumeContext";

const ProjectEntrySchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(1, "Project description is required"),
});

const FormSchema = z.object({
    projects: z.array(ProjectEntrySchema),
});

interface ProjectsFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();
    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            projects: data.projects.length > 0
                ? data.projects.map(proj => ({
                    name: proj.name || "",
                    description: proj.description || "",
                }))
                : [{ name: "", description: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "projects",
    });

    const watchedProjects = useWatch({ control, name: "projects" });

    const handleEnhanceProject = (index: number, enhanced: string[]) => {
        if (enhanced.length > 0) {
            setValue(`projects.${index}.description`, enhanced[0]);
        }
    };

    const onSubmit = (formData: z.infer<typeof FormSchema>) => {
        const transformedProjects = formData.projects.map(proj => ({
            name: proj.name,
            description: proj.description,
        }));
        updateData({ projects: transformedProjects });
        onNext();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
                {fields.map((field, index) => (
                    <div key={field.id} className="relative p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Project #{index + 1}</h3>
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

                        <div className="space-y-6">
                            <Input
                                label="Project Name"
                                placeholder="e.g. AI-Powered Resume Builder"
                                error={errors.projects?.[index]?.name?.message}
                                {...register(`projects.${index}.name` as const)}
                            />
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Project Description</label>
                                    <EnhanceButton
                                        type="project"
                                        content={[watchedProjects?.[index]?.description || ""]}
                                        context={{
                                            projectName: watchedProjects?.[index]?.name,
                                        }}
                                        onEnhanced={(enhanced) => handleEnhanceProject(index, enhanced)}
                                    />
                                </div>
                                <Textarea
                                    className="min-h-[120px] rounded-[1.5rem]"
                                    placeholder="e.g. Developed a full-stack web application that uses GPT-4 to generate resumes..."
                                    error={errors.projects?.[index]?.description?.message}
                                    {...register(`projects.${index}.description` as const)}
                                />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Provide a concise overview of what you built and the impact it had.</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full h-16 border-dashed border-2 rounded-[2rem] hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-xs"
                onClick={() => append({ name: "", description: "" })}
            >
                + Add Project
            </Button>

            {fields.length === 0 && (
                <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30">
                    No projects added yet. Showcase your work!
                </div>
            )}

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Save & Next</Button>
            </div>
        </form>
    );
};
