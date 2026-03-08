import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const ExecutiveTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex flex-col gap-3 shadow-none print:shadow-none text-[10pt] flex-1">
            {/* Header - Professional Executive Identity */}
            {data.basics && (
                <header className="border-b-2 border-slate-900 px-10 pt-8 pb-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">
                        {data.basics.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5pt] font-semibold text-slate-600">
                        {data.basics.email}
                        {data.basics.phone && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span>{data.basics.phone}</span>
                            </>
                        )}
                        {data.basics.location && (
                            <>
                                <span className="text-slate-300">•</span>
                                <span>{data.basics.location}</span>
                            </>
                        )}
                    </div>
                </header>
            )}

            <div className="space-y-3 flex-1 px-10 pb-8 mt-1">
                {/* 0. Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                            Executive Profile
                        </h2>
                        <p className="text-[10pt] text-slate-700 font-medium leading-relaxed">
                            {data.basics.summary}
                        </p>
                    </section>
                )}

                {/* 1. Experience - The Core of Executive Resume */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                            Executive Experience
                        </h2>
                        <div className="space-y-3">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-[12pt] font-bold text-slate-900 tracking-tight uppercase">
                                            {exp.role}
                                        </h3>
                                        <span className="text-[10pt] font-semibold text-slate-500 uppercase tracking-wider">
                                            {exp.startDate} — {exp.endDate || 'Present'}
                                        </span>
                                    </div>
                                    <p className="text-primary font-semibold uppercase tracking-widest text-[9.5pt]">
                                        {exp.company}
                                    </p>
                                    <ul className="space-y-0.5 text-[10pt] text-slate-700 font-medium leading-tight">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-4">
                                                <span className="text-slate-400 mt-1.5 text-[8pt] shrink-0">•</span>
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Key Projects / Strategic Initiatives */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                            Strategic Initiatives
                        </h2>
                        <div className="space-y-3">
                            {data.projects.map((proj, i) => (
                                <div key={i} className="space-y-1">
                                    <h3 className="text-[11.5pt] font-bold text-slate-900 tracking-tight uppercase">
                                        {proj.name}
                                    </h3>
                                    <p className="text-[10pt] text-slate-700 font-medium leading-relaxed">
                                        {proj.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Core Expertise */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                            Core Expertise
                        </h2>
                        <div className="flex flex-wrap gap-2 text-[9.5pt]">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-700 font-semibold rounded uppercase tracking-wider">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Bottom Row - Education & Certifications */}
                <div className="grid grid-cols-1 gap-6 pt-2">
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                                Education
                            </h2>
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="flex justify-between items-baseline">
                                        <div className="space-y-0.5">
                                            <h3 className="text-[11pt] font-bold text-slate-900 uppercase tracking-tight">
                                                {edu.degree}
                                            </h3>
                                            <p className="text-[10pt] text-slate-600 font-semibold italic uppercase tracking-wide">
                                                {edu.institution}
                                            </p>
                                        </div>
                                        <span className="text-[9.5pt] font-semibold text-slate-500 uppercase tracking-widest">
                                            {edu.startDate} — {edu.endDate || 'Present'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {(data.certifications && data.certifications.length > 0 || data.achievements && data.achievements.length > 0) && (
                        <div className="grid grid-cols-2 gap-8">
                            {data.certifications && data.certifications.length > 0 && (
                                <section>
                                    <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                                        Certifications
                                    </h2>
                                    <ul className="space-y-1 text-[9.5pt] text-slate-600 font-medium list-none">
                                        {data.certifications.map((cert, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-primary font-bold">✓</span>
                                                <span>{cert}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                            {data.achievements && data.achievements.length > 0 && (
                                <section>
                                    <h2 className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 pb-1 mb-2">
                                        Honors
                                    </h2>
                                    <ul className="space-y-1 text-[9.5pt] text-slate-600 font-medium list-none">
                                        {data.achievements.map((ach, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-primary font-bold">★</span>
                                                <span>{ach}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
