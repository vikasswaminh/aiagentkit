import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const CompactTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-900 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-sans flex-1 leading-snug">
            {/* Header - Ultra High Density */}
            {data.basics && (
                <header className="px-8 pt-6 pb-2 border-b border-slate-200 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tighter uppercase">{data.basics.name}</h1>
                    <div className="flex gap-4 text-[8.5pt] font-bold text-slate-400 uppercase">
                        <span>{data.basics.location}</span>
                        <span>{data.basics.phone}</span>
                        <span>{data.basics.email}</span>
                    </div>
                </header>
            )}

            <div className="px-8 py-6 space-y-7 flex-1">
                {/* Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2">Profile</h2>
                        <p className="text-slate-600 text-[9.5pt] leading-relaxed text-justify">{data.basics.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Experience</h2>
                        <div className="space-y-5">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="font-black text-slate-900 text-[10.5pt] tracking-tight">{exp.role}</h3>
                                        <span className="text-[9pt] font-bold text-slate-400 uppercase">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <div className="text-primary font-bold text-[9.5pt] uppercase mb-1.5">{exp.company}</div>
                                    <ul className="space-y-1.5 text-slate-600">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-2">
                                                <span className="text-slate-300 mt-1 text-[7pt] shrink-0">■</span>
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
                        <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Key Work</h2>
                        <div className="space-y-3">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-black text-slate-900 text-[10.5pt] tracking-tight">{proj.name}</h3>
                                    <p className="text-slate-600 italic text-[9.5pt] leading-snug text-justify">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education & Skills Grid */}
                <div className="grid grid-cols-2 gap-8 pt-1">
                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Education</h2>
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-slate-900 text-[9.5pt]">{edu.degree}</h3>
                                            <span className="text-[8pt] font-bold text-slate-400 uppercase">{edu.startDate} — {edu.endDate || 'Present'}</span>
                                        </div>
                                        <div className="text-slate-500 text-[8pt] font-medium leading-none">{edu.institution}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Expertise */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Skills</h2>
                            <div className="flex flex-wrap gap-1">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="text-[8.5pt] text-slate-600 font-bold bg-slate-50 border border-slate-100 px-2 py-1 rounded-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Achievements & Certifications */}
                <div className="grid grid-cols-2 gap-8 pt-1">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Achievements</h2>
                            <ul className="space-y-1.5 text-[9pt] text-slate-600 font-medium italic">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[9.5pt] font-black text-slate-900 border-l-2 border-primary pl-2 uppercase tracking-widest mb-2.5">Certs</h2>
                            <ul className="space-y-1.5 text-[9pt] text-slate-600 font-medium">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary">✓</span>
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
