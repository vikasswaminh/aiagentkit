"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScaleWrapperProps {
    children: React.ReactNode;
    targetWidth: number; // The width of the content to be scaled (e.g., 794 for A4)
    className?: string; // Optional wrapper class
}

/**
 * ScaleWrapper
 * Responsibly scales a fixed-width element (like an A4 resume) to fit its container.
 * Uses CSS transforms at the container level to maintain high-quality rendering.
 */
export const ScaleWrapper: React.FC<ScaleWrapperProps> = ({
    children,
    targetWidth,
    className = ""
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;

        const calculateScale = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;

            // Aspect ratio for A4
            const targetHeight = (targetWidth * 297) / 210;

            // Calculate scale to fit both width and height with a small margin
            const scaleX = (containerWidth * 0.98) / targetWidth;
            const scaleY = (containerHeight * 0.98) / targetHeight;

            const newScale = Math.min(scaleX, scaleY);

            // Prevent excessive scaling
            setScale(newScale);
        };

        const observer = new ResizeObserver(calculateScale);
        observer.observe(containerRef.current);
        calculateScale();

        return () => observer.disconnect();
    }, [targetWidth]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center relative overflow-hidden ${className}`}
        >
            <div
                ref={contentRef}
                style={{
                    width: targetWidth,
                    minWidth: targetWidth,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    flexShrink: 0,
                    transition: "transform 0.1s ease-out"
                }}
            >
                {children}
            </div>
        </div>
    );
};
