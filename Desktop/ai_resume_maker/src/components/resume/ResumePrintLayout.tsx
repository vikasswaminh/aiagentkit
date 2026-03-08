import React from "react";

interface ResumePrintLayoutProps {
    children?: React.ReactNode;
    className?: string;
}

/**
 * ResumePrintLayout
 * Authoritative wrapper for all resume templates.
 * Enforces A4 dimensions and applies the shared print stylesheet.
 */
export const ResumePrintLayout: React.FC<ResumePrintLayoutProps> = ({ children, className = "" }) => {
    return (
        <div className={`resume-container ${className}`}>
            {children}
        </div>
    );
};
