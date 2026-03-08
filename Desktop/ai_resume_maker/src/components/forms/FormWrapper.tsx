"use client";

import React from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import { useRouter } from "next/navigation";
import { Logo } from "../ui/Logo";

interface FormWrapperProps {
    currentStep: number;
    totalSteps: number;
    title: string;
    description: string;
    children: React.ReactNode;
    steps: string[];
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
    currentStep,
    title,
    description,
    children,
    steps,
}) => {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-white">
            {/* Standard Step Progress Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div
                        className="cursor-pointer"
                        onClick={() => {
                            setTimeout(() => {
                                router.push("/");
                            }, 100);
                        }}
                    >
                        <Logo />
                    </div>

                    {/* Progress Steps */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">✓</div>
                            <span className="font-bold text-slate-800">Select Design</span>
                        </div>
                        <div className="w-8 h-px bg-primary" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-sky-100">2</div>
                            <span className="font-bold text-slate-800">Craft Content</span>
                        </div>
                        <div className="w-8 h-px bg-slate-200" />
                        <div className="flex items-center gap-3 opacity-40">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">3</div>
                            <span className="font-bold text-slate-800">Finalize & Export</span>
                        </div>
                    </div>

                    <div className="w-24" /> {/* Spacer for symmetry */}
                </div>
            </header>

            <div className="max-w-5xl mx-auto py-12 px-6">
                <div className="space-y-12">
                    {/* Sub-Step Indicator (The vertical/horizontal list of form sections) */}
                    <div className="relative px-2 overflow-x-auto pb-4 custom-scrollbar lg:overflow-visible lg:pb-0">
                        <div className="absolute top-[1.25rem] left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 hidden lg:block" />
                        <div className="relative flex justify-between items-center gap-8 lg:gap-0">
                            {steps.map((step, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;

                                return (
                                    <div key={step} className="flex flex-col items-center gap-3 relative z-10 flex-shrink-0">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                                backgroundColor: isActive ? "#00A3FF" : isCompleted ? "#00D084" : "#fff",
                                                borderColor: isActive ? "#00A3FF" : isCompleted ? "#00D084" : "#e2e8f0",
                                                color: isActive || isCompleted ? "#fff" : "#94a3b8",
                                            }}
                                            className={clsx(
                                                "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black border-2 transition-all duration-300",
                                                isActive && "shadow-lg shadow-sky-100 ring-4 ring-sky-50"
                                            )}
                                        >
                                            {isCompleted ? "✓" : index + 1}
                                        </motion.div>
                                        <motion.span
                                            animate={{
                                                color: isActive ? "#2d3748" : "#94a3b8",
                                                fontWeight: isActive ? 800 : 600,
                                            }}
                                            className="text-[10px] uppercase tracking-widest text-center whitespace-nowrap"
                                        >
                                            {step}
                                        </motion.span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Header */}
                    <div className="space-y-3 text-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className="text-4xl font-extrabold text-[#2d3748] tracking-tight">
                                    {title}
                                </h1>
                                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                                    {description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Form Content */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 sm:p-12"
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
