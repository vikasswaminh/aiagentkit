"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResume } from "@/lib/context/ResumeContext";

interface CertificationsFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const CertificationsForm: React.FC<CertificationsFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();
    const [certifications, setCertifications] = useState<string[]>(data.certifications.length > 0 ? data.certifications : [""]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateData({
            certifications: certifications.filter((c: string) => c.trim() !== "")
        });
        onNext();
    };

    const addCertification = () => {
        setCertifications([...certifications, ""]);
    };

    const removeCertification = (index: number) => {
        const newCertifications = certifications.filter((_, i) => i !== index);
        setCertifications(newCertifications.length > 0 ? newCertifications : [""]);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Professional Certifications</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCertification}
                        className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-2"
                    >
                        + Add New
                    </Button>
                </div>

                <div className="space-y-4">
                    {certifications.map((certification, index) => (
                        <div key={index} className="flex gap-3 group items-start">
                            <div className="flex-1">
                                <Input
                                    className="h-12 rounded-xl"
                                    placeholder="e.g. AWS Certified Solutions Architect..."
                                    value={certification}
                                    onChange={(e) => {
                                        const newCertifications = [...certifications];
                                        newCertifications[index] = e.target.value;
                                        setCertifications(newCertifications);
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => removeCertification(index)}
                                className="h-12 w-12 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto">
                ADD RELEVANT INDUSTRY CERTIFICATIONS TO BOOST CREDIBILITY.
            </p>

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Preview Resume</Button>
            </div>
        </form>
    );
};
