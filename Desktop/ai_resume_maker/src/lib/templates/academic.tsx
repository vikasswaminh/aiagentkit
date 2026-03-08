import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const AcademicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-gray-800 font-serif w-full shadow-none print:shadow-none flex flex-col gap-4 text-[11pt] flex-1" style={{ fontFamily: "Georgia, serif" }}>
            {/* Header - Refined Academic Style */}
            {data.basics && (
                <header className="text-center mb-4 border-b-[1px] border-slate-200 px-12 pt-14 pb-8">
                    <h1 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{data.basics.name}</h1>
                    <div className="text-[11pt] text-slate-500 flex justify-center flex-wrap gap-x-6 gap-y-2 items-center italic">
                        <span>{data.basics.location}</span>
                        {data.basics.location && (data.basics.phone || data.basics.email) && <span className="text-slate-200">•</span>}
                        <span>{data.basics.phone}</span>
                        {(data.basics.phone && data.basics.email) && <span className="text-slate-200">•</span>}
                        <span>{data.basics.email}</span>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <div className="space-y-8 px-12 pb-12 pt-6">
                {/* 0. Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className="text-[11pt] font-black text-slate-900 border-b border-slate-900 pb-1 mb-3 tracking-[0.2em] uppercase">
                            Research Interest & Profile
                        </h2>
                        <p className="text-[11pt] leading-relaxed text-slate-700 text-justify italic">
                            {data.basics.summary}
                        </p>
                    </section>
                )}

                {/* 1. Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-900 pb-1 mb-2 tracking-[0.2em] uppercase">
                            Education
                        </h2>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-[12.5pt] font-bold text-slate-900">{edu.degree}</span>
                                        <span className="text-[10.5pt] text-slate-500 font-bold italic tracking-tight">{edu.startDate} — {edu.endDate || 'Present'}</span>
                                    </div>
                                    <div className="text-[11.5pt] text-slate-600 font-bold">{edu.institution}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Research & Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-900 pb-1 mb-2 tracking-[0.2em] uppercase">
                            Research & Experience
                        </h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1.5">
                                        <span className="text-[12.5pt] font-bold text-slate-900 uppercase tracking-tight">{exp.role}</span>
                                        <span className="text-[10.5pt] text-slate-500 font-bold italic tracking-tight">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <div className="text-[11pt] text-slate-600 font-bold italic mb-3">{exp.company}</div>
                                    <ul className="space-y-2 text-[10.5pt] text-slate-600 flex flex-col">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-3">
                                                <span className="text-slate-300 mt-2 text-[5pt] shrink-0">●</span>
                                                <span className="text-justify flex-1">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Key Projects & Publications */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-900 pb-1 mb-2 tracking-[0.2em] uppercase">
                            Projects & Publications
                        </h2>
                        <div className="space-y-4">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="text-[12pt] font-bold text-slate-900 tracking-tight mb-2">{proj.name}</h3>
                                    <p className="text-[10.5pt] text-slate-600 leading-relaxed text-justify italic">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. Technical Proficiencies */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-900 pb-1 mb-2 tracking-[0.2em] uppercase">
                            Proficiencies
                        </h2>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="text-[9.5pt] text-slate-700 font-medium italic px-3 py-1 bg-slate-50 border border-slate-200 rounded">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. Honors & Certifications */}
                <div className="grid grid-cols-2 gap-x-12 pt-4">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-200 pb-1 mb-3 tracking-widest uppercase">Awards</h2>
                            <ul className="space-y-2.5 text-[10pt] text-slate-600 font-medium leading-relaxed">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-3 italic">
                                        <span className="text-slate-300 shrink-0 mt-1">●</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[10pt] font-black text-slate-900 border-b border-slate-200 pb-1 mb-3 tracking-widest uppercase">Certs</h2>
                            <ul className="space-y-2.5 text-[10pt] text-slate-600 font-medium leading-relaxed">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 font-bold">
                                        <span className="text-slate-300 shrink-0 mt-1">✓</span>
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
