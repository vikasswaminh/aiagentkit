"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useResume } from "@/lib/context/ResumeContext";
import { useRouter } from "next/navigation";
import { templateList, TemplateInfo } from "@/lib/templates";
import { ResumeData } from "@/lib/schemas/resume";

interface ImportResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalStep = "upload" | "parsing" | "template" | "success";

export const ImportResumeModal: React.FC<ImportResumeModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<ModalStep>("upload");
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ResumeData | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setFullData } = useResume();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/pdf") {
                setError("Please select a valid PDF file.");
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit.");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setStep("parsing");
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/import-resume", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.details
                    ? `${data.error}: ${data.details}`
                    : (data.error || "Failed to process resume");
                throw new Error(errorMessage);
            }

            // Success! Store parsed data and move to template selection
            setParsedData(data);
            setStep("template");

        } catch (err: any) {
            setStep("upload");
            setError(err.message || "An unexpected error occurred.");
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
    };

    const handleContinue = () => {
        if (!parsedData) return;

        // Add selected template to the data
        const finalData: ResumeData = {
            ...parsedData,
            template: selectedTemplate,
        };

        setFullData(finalData);
        setStep("success");

        // Navigate to builder after brief success animation
        setTimeout(() => {
            onClose();
            router.push("/builder?import=true");
        }, 800);
    };

    const handleReset = () => {
        setFile(null);
        setStep("upload");
        setError(null);
        setParsedData(null);
        setSelectedTemplate("modern");
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Group templates by category
    const groupedTemplates = templateList.reduce((acc, template) => {
        if (!acc[template.category]) {
            acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
    }, {} as Record<string, TemplateInfo[]>);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative bg-white w-full rounded-[2.5rem] shadow-2xl overflow-hidden ${step === "template" ? "max-w-4xl max-h-[90vh]" : "max-w-xl"
                            }`}
                    >
                        <div className="p-10 space-y-6">
                            {/* Header */}
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {step === "upload" && "Import Resume"}
                                    {step === "parsing" && "Processing..."}
                                    {step === "template" && "Choose Template"}
                                    {step === "success" && "Ready!"}
                                </h3>
                                <p className="text-slate-500 font-medium">
                                    {step === "upload" && "Upload your existing PDF to auto-fill the builder using AI."}
                                    {step === "parsing" && "AI is extracting your resume data..."}
                                    {step === "template" && "Select a template for your imported resume."}
                                    {step === "success" && "Redirecting to the builder..."}
                                </p>
                            </div>

                            {/* Step: Upload */}
                            {step === "upload" && (
                                <>
                                    <div
                                        className={`border-3 border-dashed rounded-[2rem] p-12 transition-all flex flex-col items-center gap-4 cursor-pointer ${file ? "border-primary bg-sky-50/30" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                                            }`}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl">
                                            {file ? "📄" : "📤"}
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-900">{file ? file.name : "Click to select PDF"}</p>
                                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">PDF ONLY • MAX 5MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3"
                                        >
                                            <span className="text-lg">⚠️</span>
                                            <p className="text-sm text-rose-600 font-bold leading-tight">{error}</p>
                                        </motion.div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            disabled={!file}
                                            onClick={handleUpload}
                                            className="flex-2 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-100"
                                        >
                                            Start Import
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Step: Parsing */}
                            {step === "parsing" && (
                                <div className="py-12 flex flex-col items-center gap-6">
                                    <div className="relative w-16 h-16">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-4 border-slate-100 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-2xl">
                                            🧠
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-sm">
                                            AI Extracting & Structuring...
                                        </p>
                                        <p className="text-slate-500 font-medium text-sm">This may take up to 15 seconds.</p>
                                    </div>
                                </div>
                            )}

                            {/* Step: Template Selection */}
                            {step === "template" && (
                                <>
                                    <div className="overflow-y-auto max-h-[50vh] space-y-6 pr-2">
                                        {Object.entries(groupedTemplates).map(([category, templates]) => (
                                            <div key={category}>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                                    {category}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {templates.map((template) => (
                                                        <motion.div
                                                            key={template.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleTemplateSelect(template.id)}
                                                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedTemplate === template.id
                                                                ? "border-primary bg-sky-50 shadow-lg shadow-sky-100"
                                                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedTemplate === template.id
                                                                    ? "bg-primary text-white"
                                                                    : "bg-white text-slate-400 shadow-sm"
                                                                    }`}>
                                                                    {selectedTemplate === template.id ? "✓" : "📋"}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-900 text-sm truncate">
                                                                        {template.name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 truncate">
                                                                        {template.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                                        <Button
                                            variant="ghost"
                                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                                            onClick={handleReset}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleContinue}
                                            className="flex-2 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-100"
                                        >
                                            Continue to Builder
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Step: Success */}
                            {step === "success" && (
                                <div className="py-12 flex flex-col items-center gap-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 10 }}
                                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl"
                                    >
                                        ✅
                                    </motion.div>
                                    <div className="text-center space-y-1">
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-sm">
                                            Import Complete!
                                        </p>
                                        <p className="text-slate-500 font-medium text-sm">Redirecting to builder...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
