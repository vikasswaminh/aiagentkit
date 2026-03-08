import React from "react";

export const Logo = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="w-8 h-8 relative">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <path
                        d="M4 18L12 14L20 18V6L12 2L4 6V18Z"
                        fill="#111111"
                    />
                    <path
                        d="M12 2L4 6V18L12 14M12 2L20 6V18L12 14"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-neutral-900">
                FreeFreeCV
            </span>
        </div>
    );
};
