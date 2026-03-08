import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
        const variants = {
            primary: "bg-neutral-950 text-white hover:bg-black shadow-sm border border-neutral-900",
            secondary: "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 shadow-sm",
            outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-100",
            ghost: "bg-transparent hover:bg-neutral-100 text-neutral-700",
            destructive: "bg-destructive text-white hover:bg-destructive-dark shadow-sm",
        };

        const sizes = {
            sm: "h-7 px-2 text-xs font-medium", // Compact
            md: "h-9 px-3 text-sm font-medium", // Standard Enterprise
            lg: "h-11 px-6 text-sm font-semibold", // Broad
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none gap-2 whitespace-nowrap",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
