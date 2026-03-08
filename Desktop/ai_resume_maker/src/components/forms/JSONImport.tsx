"use client";

import React, { useState } from "react";
import { z } from "zod";
import { ResumeSchema } from "@/lib/schemas/resume";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useResume } from "@/lib/context/ResumeContext";

interface JSONImportProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const JSONImport: React.FC<JSONImportProps> = ({ onSuccess, onCancel }) => {
    const { updateData } = useResume();
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const validated = ResumeSchema.parse(parsed);
            updateData(validated);
            onSuccess();
        } catch (err: unknown) {
            if (err instanceof z.ZodError) {
                setError("Invalid JSON structure: " + err.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", "));
            } else {
                setError("Invalid JSON format: " + (err instanceof Error ? err.message : String(err)));
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Paste Resume JSON</label>
                <Textarea
                    placeholder='{ "header": { "name": "John Doe", ... }, ... }'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    error={error}
                />
                <p className="text-[10px] text-neutral-400">Ensure the JSON matches the required schema perfectly.</p>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleImport} disabled={!jsonInput.trim()}>Import & Start</Button>
            </div>
        </div>
    );
};
