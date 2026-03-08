"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScaleWrapper } from "@/components/ui/ScaleWrapper";
import { useResume } from "@/lib/context/ResumeContext";
import { getTemplate } from "@/lib/templates/registry";
import { ResumeData } from "@/lib/schemas/resume";
import { Button } from "./Button";
import { ResumePrintLayout } from "@/components/resume/ResumePrintLayout";

const RenderTemplate = React.memo(({ template, data }: { template: string; data: ResumeData }) => {
    return React.createElement(getTemplate(template), { data });
});
RenderTemplate.displayName = "RenderTemplate";

export const QuickPeek: React.FC = () => {
    const { data } = useResume();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed bottom-10 right-10 z-[100]"
            >
                <Button
                    size="lg"
                    className="rounded-full shadow-2xl shadow-sky-200 px-8 h-16 flex items-center gap-4 border-4 border-white backdrop-blur-md text-lg font-black"
                    onClick={() => setIsOpen(true)}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Quick Preview</span>
                </Button>
            </motion.div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-slate-100 rounded-[3rem] w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 flex items-center justify-between border-b border-slate-100 bg-white rounded-t-[3rem]">
                                <div className="space-y-1 text-left">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Resume Draft</h2>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Real-time Generation</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-2xl h-12 w-12 p-0 text-2xl font-black bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                                >
                                    ×
                                </Button>
                            </div>

                            {/* Modal Content - The Template */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-16 bg-slate-50/50 custom-scrollbar">
                                <div className="w-full max-w-[794px] aspect-[1/1.4142] relative mx-auto shadow-2xl bg-white mb-12 rounded-sm overflow-hidden">
                                    <ScaleWrapper targetWidth={794}>
                                        <ResumePrintLayout className="w-[794px] min-h-[1123px] bg-white">
                                            <RenderTemplate template={data.template || "simple"} data={data} />
                                        </ResumePrintLayout>
                                    </ScaleWrapper>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 flex justify-center bg-white/80 backdrop-blur-md rounded-b-[3rem]">
                                <p className="text-slate-400 font-bold text-sm tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    Your data is synced and ready to download.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
