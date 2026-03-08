import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const ModernTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex flex-col gap-3 shadow-none print:shadow-none text-[10pt] flex-1">
            {/* Header - Modern slate accent */}
            {data.basics && (
                <header className="mb-1.5 px-10 pt-6">
                    <div className="flex items-end justify-between border-b-2 border-slate-900 pb-1.5">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{data.basics.name || ''}</h1>
                            {data.basics.location && <p className="text-slate-500 font-bold mt-0.5 uppercase tracking-[0.2em] text-[8pt]">{data.basics.location}</p>}
                        </div>
                        <div className="text-right text-[9pt] text-slate-500 space-y-1 font-bold">
                            {data.basics.phone && <p>{data.basics.phone}</p>}
                            {data.basics.email && <p>{data.basics.email}</p>}
                        </div>
                    </div>
                    {data.basics.summary && (
                        <div className="mt-4 text-[9.5pt] text-slate-600 leading-relaxed font-medium italic">
                            {data.basics.summary}
                        </div>
                    )}
                </header>
            )}

            <div className="space-y-4 flex-1 px-10 pb-4">
                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Professional Experience</h2>
                        <div className="space-y-3">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="text-[12pt] font-extrabold text-slate-900 uppercase tracking-tight">{exp.role}</h3>
                                        <span className="text-[9pt] font-black text-slate-400 uppercase tracking-wider">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <p className="text-primary text-[10pt] font-black uppercase tracking-wide mb-1.5">{exp.company}</p>
                                    <ul className="space-y-1 text-[9.5pt] text-slate-600 font-medium leading-tight">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-3">
                                                <span className="text-slate-300 mt-1.5 text-[7pt]">•</span>
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Education</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex flex-col bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                                    <h3 className="text-[10pt] font-extrabold text-slate-900 uppercase tracking-tight">{edu.degree}</h3>
                                    <p className="text-[9pt] text-slate-500 font-bold uppercase mt-0.5">{edu.institution}</p>
                                    <span className="text-[8pt] font-black text-slate-400 uppercase tracking-wider mt-1">{edu.startDate} — {edu.endDate || 'Present'}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Projects</h2>
                        <div className="space-y-3">
                            {data.projects.map((proj, i) => (
                                <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl">
                                    <h3 className="text-[11pt] font-extrabold text-slate-900 uppercase tracking-tight mb-1">{proj.name}</h3>
                                    <p className="text-[9.5pt] text-slate-600 font-medium leading-relaxed">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Expertise</h2>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-900 text-white text-[8pt] font-black rounded uppercase tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Achievements & Certifications */}
                <div className="grid grid-cols-2 gap-6">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Achievements</h2>
                            <ul className="space-y-1 text-[9pt] text-slate-600 font-medium">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-l-4 border-slate-100 pl-4">Certifications</h2>
                            <ul className="space-y-1 text-[9pt] text-slate-600 font-medium">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
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

