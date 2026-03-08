import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    slate: { primary: "text-slate-900", accent: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50", banner: "bg-slate-900" },
};

export const CorporateTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.slate;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-serif flex-1">
            {/* Header - Banner */}
            {data.basics && (
                <header className={`${c.banner} text-white px-10 pt-8 pb-4 shadow-sm text-center`}>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{data.basics.name}</h1>
                    <div className="flex justify-center flex-wrap gap-4 text-white/80 text-[10px] font-medium">
                        <span>{data.basics.location}</span>
                        <span>{data.basics.phone}</span>
                        <span>{data.basics.email}</span>
                    </div>
                </header>
            )}

            <div className="px-10 py-6 space-y-6 flex-1">
                {/* Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Professional Summary</h2>
                        <p className="text-[10pt] text-slate-600 leading-relaxed text-justify italic">{data.basics.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900 text-[12pt] leading-none">{exp.role}</h3>
                                        <span className={`text-[9.5pt] font-bold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <div className={`text-[10.5pt] font-bold uppercase tracking-wide mb-2 ${c.primary}`}>{exp.company}</div>
                                    <ul className={`list-disc list-outside ml-4 space-y-1 text-slate-600 text-[9.5pt] leading-tight marker:text-slate-400`}>
                                        {(exp.bullets || []).map((bullet, j) => <li key={j} className="text-justify">{bullet}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Key Projects</h2>
                        <div className="space-y-4">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-slate-900 text-[11.5pt] leading-none mb-1.5">{proj.name}</h3>
                                    <p className="text-slate-600 text-[9.5pt] leading-relaxed text-justify italic">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Education</h2>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-[10pt] uppercase tracking-wide">{edu.institution}</h3>
                                        <div className="text-slate-500 text-[9pt] italic">{edu.degree}</div>
                                    </div>
                                    <span className={`text-[9.5pt] font-bold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-10 pt-2">
                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Core Competencies</h2>
                            <div className="flex flex-wrap gap-2 pt-1 font-sans">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="text-[8.5pt] text-slate-600 font-bold border border-slate-100 px-2 py-0.5 rounded-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications & Achievements */}
                    <div className="space-y-6">
                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Certs</h2>
                                <ul className="space-y-2">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="text-[9pt] font-medium text-slate-600 border-l-2 border-slate-100 pl-2">{cert}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-b ${c.border} pb-1.5`}>Awards</h2>
                                <ul className={`list-disc list-outside ml-4 space-y-1.5 text-slate-600 text-[9pt] font-medium leading-tight marker:text-slate-300`}>
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
