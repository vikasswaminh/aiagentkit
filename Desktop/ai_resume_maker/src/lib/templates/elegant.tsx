import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const ElegantTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-serif leading-relaxed w-full flex flex-col shadow-none print:shadow-none text-[11pt] flex-1" style={{ fontFamily: "Merriweather, serif" }}>
            {/* Header - Truly Elegant & Balanced */}
            {data.basics && (
                <header className="text-center pt-16 pb-8">
                    <h1 className="text-4xl font-normal text-slate-900 tracking-[0.25em] uppercase leading-tight mb-4">{data.basics.name}</h1>
                    <div className="flex justify-center flex-wrap gap-x-10 gap-y-2 text-[10pt] font-medium uppercase tracking-widest text-slate-500 max-w-2xl mx-auto">
                        {data.basics.location && <span>{data.basics.location}</span>}
                        {data.basics.phone && <span className="text-slate-200">|</span>}
                        {data.basics.phone && <span>{data.basics.phone}</span>}
                        {data.basics.email && <span className="text-slate-200">|</span>}
                        {data.basics.email && <span className="lowercase italic tracking-normal">{data.basics.email}</span>}
                    </div>
                    <div className="w-12 h-[1px] bg-slate-900 mt-6 mx-auto opacity-20" />
                </header>
            )}

            {/* Main Content */}
            <div className="space-y-10 px-12 pb-12 pt-4">
                {/* 0. Professional Summary */}
                {data.basics?.summary && (
                    <section className="max-w-3xl mx-auto text-center">
                        <p className="text-[11pt] text-slate-600 leading-relaxed italic">
                            {data.basics.summary}
                        </p>
                    </section>
                )}

                {/* 1. Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-black uppercase tracking-[0.4em] text-slate-900 mb-8 text-center flex items-center justify-center gap-8 opacity-90">
                            <span className="h-px w-20 bg-slate-100" />
                            Experience
                            <span className="h-px w-20 bg-slate-100" />
                        </h2>
                        <div className="space-y-10">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <div className="max-w-[75%]">
                                            <h3 className="text-[12pt] font-bold text-slate-900 uppercase tracking-tight leading-snug">{exp.role}</h3>
                                            <p className="text-[10.5pt] text-primary font-bold uppercase mt-1 tracking-wider opacity-80">{exp.company}</p>
                                        </div>
                                        <span className="text-[9pt] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <ul className="space-y-2.5 text-[10.5pt] text-slate-600 leading-relaxed font-sans font-medium flex flex-col">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-4">
                                                <span className="text-slate-200 mt-2 text-[6pt] shrink-0">■</span>
                                                <span className="text-justify">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.4em] text-slate-900 mb-6 text-center flex items-center justify-center gap-6 opacity-90">
                            <span className="h-px w-16 bg-slate-100" />
                            Education
                            <span className="h-px w-16 bg-slate-100" />
                        </h2>
                        <div className="space-y-6">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-start text-center max-w-2xl mx-auto">
                                    <div className="flex-1 text-right pr-6 pt-1">
                                        <h3 className="text-[10.5pt] font-bold text-slate-900 uppercase tracking-tight">{edu.degree}</h3>
                                    </div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200 mt-2.5 shrink-0" />
                                    <div className="flex-1 text-left pl-6">
                                        <p className="text-[10pt] text-slate-500 font-bold uppercase tracking-wide leading-none mb-1.5">{edu.institution}</p>
                                        <p className="text-[9pt] text-slate-300 font-black uppercase tracking-[0.15em]">{edu.startDate} — {edu.endDate || 'Present'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Key Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.4em] text-slate-900 mb-6 text-center flex items-center justify-center gap-6 opacity-90">
                            <span className="h-px w-16 bg-slate-100" />
                            Key Projects
                            <span className="h-px w-16 bg-slate-100" />
                        </h2>
                        <div className="space-y-6">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="text-[13pt] font-bold text-slate-900 uppercase tracking-tight leading-snug mb-2.5">{proj.name}</h3>
                                    <p className="text-[10.5pt] text-slate-600 leading-relaxed text-justify italic">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. Skills - Compact & Organized */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-[9pt] font-black uppercase tracking-[0.4em] text-slate-900 mb-6 text-center flex items-center justify-center gap-6 opacity-90">
                            <span className="h-px w-16 bg-slate-100" />
                            Capabilities
                            <span className="h-px w-16 bg-slate-100" />
                        </h2>
                        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto font-sans">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="text-[9pt] text-slate-600 font-bold border border-slate-100 px-3 py-1 rounded-full uppercase tracking-widest italic">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. Achievements & Certifications */}
                <div className="grid grid-cols-2 gap-12 pt-4">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-4">
                                Awards
                                <div className="h-px bg-slate-100 flex-1" />
                            </h2>
                            <ul className="space-y-3 text-[10.5pt] text-slate-600 leading-relaxed font-sans font-medium italic">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="text-primary text-[10pt] mt-1">◆</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-4">
                                Credentials
                                <div className="h-px bg-slate-100 flex-1" />
                            </h2>
                            <ul className="space-y-3 text-[10.5pt] text-slate-600 leading-relaxed font-sans font-medium">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="text-primary text-[10pt] mt-1">✓</span>
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
