"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useResume } from "@/lib/context/ResumeContext";

interface AchievementsFormProps {
    onNext: () => void;
    onBack: () => void;
}

export const AchievementsForm: React.FC<AchievementsFormProps> = ({ onNext, onBack }) => {
    const { data, updateData } = useResume();
    const [achievements, setAchievements] = useState<string[]>(data.achievements.length > 0 ? data.achievements : [""]);

    const onSubmit = () => {
        updateData({
            achievements: achievements.filter((a: string) => a.trim() !== ""),
        });
        onNext();
    };

    const handleEnhanceAchievement = (index: number, enhanced: string[]) => {
        if (enhanced.length > 0) {
            const newAchievements = [...achievements];
            newAchievements[index] = enhanced[0];
            setAchievements(newAchievements);
        }
    };

    const addAchievement = () => {
        setAchievements([...achievements, ""]);
    };

    const removeAchievement = (index: number) => {
        const newAchievements = achievements.filter((_, i) => i !== index);
        setAchievements(newAchievements.length > 0 ? newAchievements : [""]);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border border-slate-200 rounded-[2rem] bg-slate-50/50 space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Honors & Achievements</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAchievement}
                        className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-2"
                    >
                        + Add New
                    </Button>
                </div>

                <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                        <div key={index} className="flex gap-3 group items-start">
                            <div className="flex-1">
                                <Input
                                    className="h-12 rounded-xl"
                                    placeholder="e.g. Secured Rank 1 in National Mathematics Olympiad..."
                                    value={achievement}
                                    onChange={(e) => {
                                        const newAchievements = [...achievements];
                                        newAchievements[index] = e.target.value;
                                        setAchievements(newAchievements);
                                    }}
                                />
                            </div>
                            <div className="flex gap-2 shrink-0 pt-0.5">
                                <EnhanceButton
                                    type="achievement"
                                    content={[achievement]}
                                    onEnhanced={(enhanced) => handleEnhanceAchievement(index, enhanced)}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => removeAchievement(index)}
                                    className="h-11 w-11 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto">
                HIGHLIGHT QUANTIFIABLE ACHIEVEMENTS (RANKS, PERCENTAGES, AWARDS).
            </p>

            <div className="flex justify-between pt-8">
                <Button type="button" variant="ghost" className="h-12 rounded-2xl px-8 font-bold" onClick={onBack}>Back</Button>
                <Button type="submit" className="h-12 rounded-2xl px-12 font-bold shadow-xl shadow-primary/20">Save & Next</Button>
            </div>
        </form>
    );
};
