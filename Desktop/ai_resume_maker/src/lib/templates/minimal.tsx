import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const MinimalTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9pt] font-sans flex-1">
            {/* Header - Truly Minimal & High Density */}
            {data.basics && (
                <header className="px-10 pt-8 pb-4 border-b-[0.5px] border-slate-100 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{data.basics.name}</h1>
                        <div className="mt-2 flex flex-wrap gap-x-4 text-[8pt] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{data.basics.location}</span>
                            <span>{data.basics.phone}</span>
                            <span>{data.basics.email}</span>
                        </div>
                    </div>
                </header>
            )}

            <div className="px-10 py-6 space-y-6 flex-1">
                {/* Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Technical Profile</h2>
                        <p className="text-slate-600 leading-snug text-justify text-[9pt] font-medium">{data.basics.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Professional Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="font-black text-slate-900 text-[10pt] uppercase tracking-tight">{exp.role}</h3>
                                            <span className="text-slate-200 text-xs font-light">|</span>
                                            <span className="text-primary font-bold text-[9.5pt] uppercase tracking-wide">{exp.company}</span>
                                        </div>
                                        <span className="text-[8.5pt] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <ul className="space-y-1 text-slate-600 leading-tight">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-3">
                                                <span className="text-slate-200 mt-1.5 text-[3pt] shrink-0">●</span>
                                                <span className="text-justify">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Key Projects</h2>
                        <div className="space-y-4">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-black text-slate-900 text-[10pt] uppercase tracking-tight mb-1">{proj.name}</h3>
                                    <p className="text-slate-600 text-[9pt] leading-snug text-justify italic">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Grid for Bottom Sections */}
                <div className="grid grid-cols-12 gap-8 pt-2">
                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <div className="col-span-7">
                            <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Academic Foundation</h2>
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-slate-900 text-[9pt] uppercase">{edu.degree}</h3>
                                            <span className="text-[8pt] font-black text-slate-300 uppercase tracking-tighter whitespace-nowrap">{edu.startDate} — {edu.endDate || 'Present'}</span>
                                        </div>
                                        <p className="text-slate-500 font-bold text-[8.5pt] uppercase tracking-wide">{edu.institution}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expertise */}
                    {data.skills && data.skills.length > 0 && (
                        <div className="col-span-5">
                            <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Expertise</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="text-[7.5pt] text-slate-500 font-black border-[0.5px] border-slate-100 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter bg-slate-50/50">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Achievements & Certifications */}
                <div className="grid grid-cols-2 gap-8 pt-2">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Key Achievements</h2>
                            <ul className="space-y-1.5 text-[8.5pt] text-slate-600 font-medium italic">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-primary text-[8pt]">›</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[8pt] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">Accreditations</h2>
                            <ul className="space-y-1.5 text-[8.5pt] text-slate-600 font-medium">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-primary text-[8pt]">✓</span>
                                        <span>{cert}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

