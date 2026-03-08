"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ResumeData, ResumeSchema } from "@/lib/schemas/resume";
import { createClient } from "@/lib/supabase/client";

interface ResumeContextType {
    data: ResumeData;
    resumeId: string | null;
    resumeName: string;
    loading: boolean;
    validationError: string | null;
    updateData: (newData: Partial<ResumeData>) => void;
    setFullData: (newData: ResumeData) => void;
    resetData: () => void;
    saveResume: (customName?: string) => Promise<boolean>;
    loadResume: (id: string) => Promise<void>;
    setResumeName: (name: string) => void;
    loadEditFromStorage: () => void;
    clearValidationError: () => void;
}

const initialData: ResumeData = {
    basics: {
        name: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: [],
    certifications: [],
    template: "simple",
};

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<ResumeData>(initialData);
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string>("My Resume");
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);
    const supabase = createClient();

    // Function to load edit data from localStorage
    const clearValidationError = useCallback(() => {
        setValidationError(null);
    }, []);

    const loadEditFromStorage = useCallback(() => {
        const editId = localStorage.getItem("editResumeId");
        const savedData = localStorage.getItem("resumeData");
        const savedName = localStorage.getItem("editResumeName");

        if (editId && savedData) {
            try {
                const parsed = JSON.parse(savedData);
                console.log("ResumeContext: Found stored data, validating...", { id: editId, name: savedName });
                const result = ResumeSchema.safeParse(parsed);

                if (result.success) {
                    console.log("ResumeContext: Storage data validated successfully");
                    setData(result.data);
                    setResumeId(editId);
                    if (savedName) {
                        setResumeName(savedName);
                    }
                    setValidationError(null);

                    // Clear edit mode keys after successful load to prevent stale data
                    localStorage.removeItem("editResumeId");
                    localStorage.removeItem("resumeData");
                    localStorage.removeItem("editResumeName");
                } else {
                    console.error("ResumeContext: Validation failed for stored data. Issues:", JSON.stringify(result.error.issues, null, 2));
                    console.warn("ResumeContext: Attempting to recover by clearing corrupted storage.");

                    // Self-healing: Clear corrupted data so user isn't stuck
                    localStorage.removeItem("editResumeId");
                    localStorage.removeItem("resumeData");
                    localStorage.removeItem("editResumeName");

                    setValidationError("The saved resume data was in an incompatible format and has been cleared. Please try editing from the dashboard again.");
                }
            } catch (e) {
                console.error("ResumeContext: Failed to parse edit resume data", e);
                localStorage.removeItem("editResumeId");
                localStorage.removeItem("resumeData");
                localStorage.removeItem("editResumeName");
                setValidationError("Failed to load resume data. The session has been reset.");
            }
        }
        setLoading(false);
    }, []);

    // Check for edit mode on mount
    useEffect(() => {
        // eslint-disable-next-line
        loadEditFromStorage();
    }, [loadEditFromStorage]);

    const updateData = useCallback((newData: Partial<ResumeData>) => {
        setData((prev) => ({ ...prev, ...newData }));
    }, []);

    const setFullData = useCallback((newData: ResumeData) => {
        setData(newData);
    }, []);

    const resetData = () => {
        setData(initialData);
        setResumeId(null);
        setResumeName("My Resume");
    };

    const saveResume = useCallback(async (customName?: string): Promise<boolean> => {
        try {
            console.log("Save process initiated via API...");

            const nameToSave = customName || resumeName;
            const url = resumeId ? `/api/resumes/${resumeId}` : "/api/resumes";
            const method = resumeId ? "PUT" : "POST";

            console.log(`Calling ${method} ${url}`);

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: nameToSave,
                    data,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("API Save Failure:", result);
                throw new Error(result.error || result.details?.join(", ") || "Failed to save resume");
            }

            if (result.id) {
                setResumeId(result.id);
            }

            setValidationError(null);
            return true;
        } catch (error: any) {
            console.error("Error in saveResume:", error);

            let errorMessage = "Failed to save resume. Please try again.";

            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            setValidationError(errorMessage);
            return false;
        }
    }, [resumeId, resumeName, data]);

    const loadResume = useCallback(async (id: string) => {
        setLoading(true);
        const { data: resume } = await supabase
            .from("resumes")
            .select("*")
            .eq("id", id)
            .single();

        if (resume) {
            const result = ResumeSchema.safeParse(resume.data);
            if (result.success) {
                setData(result.data);
                setResumeId(resume.id);
                setResumeName(resume.name);
                setValidationError(null);
            } else {
                console.error("Resume validation failed:", result.error.issues);
                setValidationError("Invalid resume data format. Please check your data and try again.");
            }
        } else {
            setValidationError("Resume not found.");
        }
        setLoading(false);
    }, [supabase]);

    const contextValue = React.useMemo(() => ({
        data,
        resumeId,
        resumeName,
        loading,
        validationError,
        updateData,
        setFullData,
        resetData,
        saveResume,
        loadResume,
        setResumeName,
        loadEditFromStorage,
        clearValidationError,
    }), [
        data,
        resumeId,
        resumeName,
        loading,
        validationError,
        updateData,
        setFullData,
        saveResume,
        loadResume,
        loadEditFromStorage,
        clearValidationError,
    ]);

    return (
        <ResumeContext.Provider value={contextValue}>
            {children}
        </ResumeContext.Provider>
    );
};


export const useResume = () => {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error("useResume must be used within a ResumeProvider");
    }
    return context;
};
