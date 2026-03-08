"use client";

import React, { useState } from "react";
import { Button } from "./Button";

interface EnhanceButtonProps {
    type: "experience" | "project" | "achievement";
    content: string[];
    context?: {
        role?: string;
        organization?: string;
        projectName?: string;
        techStack?: string;
        jobDescription?: string;
    };
    onEnhanced: (enhanced: string[]) => void;
    disabled?: boolean;
}

export const EnhanceButton: React.FC<EnhanceButtonProps> = ({
    type,
    content,
    context,
    onEnhanced,
    disabled = false,
}) => {
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async () => {
        if (content.every(c => !c.trim())) {
            alert("Please add some content before enhancing.");
            return;
        }

        setIsEnhancing(true);
        try {
            const response = await fetch("/api/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, content, context }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Enhancement failed");
            }

            const data = await response.json();
            onEnhanced(data.enhanced);
        } catch (error: unknown) {
            console.error("Enhancement error:", error);
            alert((error instanceof Error ? error.message : "Enhancement failed") || "Failed to enhance content. Please try again.");
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEnhance}
            disabled={disabled || isEnhancing}
            className="bg-sky-50/50 border-sky-100 text-primary font-bold hover:bg-sky-100 hover:border-primary/30 transition-all rounded-xl h-10 px-4"
        >
            {isEnhancing ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Optimizing...
                </>
            ) : (
                <>
                    <span className="text-sm mr-2 opacity-80">✨</span>
                    AI Enhance
                </>
            )}
        </Button>
    );
};
