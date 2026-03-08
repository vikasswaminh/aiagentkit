import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    slate: { primary: "text-slate-900", accent: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50", banner: "bg-slate-900" },
};

export const StandardTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.slate;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-sans flex-1">
            {/* Header - Centered */}
            {data.basics && (
                <header className="px-10 pt-8 pb-4 text-center space-y-2">
                    <h1 className={`text-2xl font-serif font-bold ${c.primary}`}>{data.basics.name}</h1>
                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-slate-500">
                        <span>{data.basics.location}</span>
                        <span>&bull;</span>
                        <span>{data.basics.email}</span>
                        <span>&bull;</span>
                        <span>{data.basics.phone}</span>
                    </div>
                </header>
            )}

            <div className="px-10 pb-8">
                <div className="space-y-5">
                    {/* Summary */}
                    {data.basics?.summary && (
                        <section>
                            <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Profile</h2>
                            <p className="text-[10pt] text-slate-600 font-medium leading-relaxed italic">
                                {data.basics.summary}
                            </p>
                        </section>
                    )}

                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                        <section>
                            <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Experience</h2>
                            <div className="space-y-4">
                                {data.experience.map((exp, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{exp.role}</h3>
                                            <span className={`text-[9px] font-bold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                        </div>
                                        <div className={`text-[10pt] font-bold uppercase tracking-wide mb-1 ${c.primary}`}>{exp.company}</div>
                                        <ul className={`list-disc list-outside ml-3 space-y-0.5 text-slate-600 text-[10pt] leading-tight marker:text-slate-400`}>
                                            {(exp.bullets || []).map((bullet, j) => <li key={j}>{bullet}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Projects */}
                    {data.projects && data.projects.length > 0 && (
                        <section>
                            <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Projects</h2>
                            <div className="space-y-4">
                                {data.projects.map((proj, i) => (
                                    <div key={i}>
                                        <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{proj.name}</h3>
                                        <p className="text-[10pt] text-slate-600 font-medium leading-relaxed">
                                            {proj.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Education</h2>
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{edu.institution}</h3>
                                            <div className="text-slate-500 text-xs">{edu.degree}</div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills, Certs, Awards Row */}
                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        {/* Skills */}
                        {data.skills && data.skills.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Skills</h2>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
                                    {data.skills.map((skill, i) => (
                                        <span key={i} className="border-b border-slate-100 pb-0.5 shrink-0">#{skill}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Certs</h2>
                                <ul className="space-y-2">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="text-xs font-medium text-slate-600 border-l-2 border-slate-100 pl-2">{cert}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Achievements */}
                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Awards</h2>
                                <ul className={`list-disc list-outside ml-3 space-y-2 text-slate-600 text-[11px] leading-tight marker:text-slate-400`}>
                                    {data.achievements.map((ach, i) => (
                                        <li key={i}>{ach}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
