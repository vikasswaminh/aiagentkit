import React from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: "blue" | "green" | "purple" | "orange" | "red";
}

const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-rose-50 text-rose-600",
};

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    trend,
    color = "blue",
}) => {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all group">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                        {trend && (
                            <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-md ${trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};
