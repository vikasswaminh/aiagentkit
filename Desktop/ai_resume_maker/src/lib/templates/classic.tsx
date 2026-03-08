import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const ClassicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-serif leading-snug w-full flex flex-col gap-8 shadow-none print:shadow-none text-[10pt] flex-1 px-24 py-16" style={{ fontFamily: "Times New Roman, serif" }}>
            {/* Header - Centered Classic Style */}
            {data.basics && (
                <header className="text-center mb-2 border-b-2 border-slate-900 pt-1 pb-3">
                    <h1 className="text-3xl font-bold tracking-tight uppercase leading-none drop-shadow-sm">{data.basics.name}</h1>
                    <div className="mt-1 text-[10pt] space-x-3 font-medium text-slate-700">
                        <span>{data.basics.location}</span>
                        {data.basics.location && (data.basics.phone || data.basics.email) && <span className="text-slate-300">•</span>}
                        <span>{data.basics.phone}</span>
                        {(data.basics.phone && data.basics.email) && <span className="text-slate-300">•</span>}
                        <span>{data.basics.email}</span>
                    </div>
                </header>
            )}

            {data.basics?.summary && (
                <section className="mb-4">
                    <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-1 tracking-wide">Professional Summary</h2>
                    <p className="text-[10pt] leading-relaxed text-slate-800 text-left">
                        {data.basics.summary}
                    </p>
                </section>
            )}

            <div className="space-y-4 flex-1">
                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Professional Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-bold text-[10.5pt] uppercase tracking-tight text-slate-900">{exp.company}</span>
                                        <span className="italic text-[9pt] font-medium text-slate-600 uppercase tracking-widest">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <p className="italic text-[10pt] text-slate-800 mb-1">{exp.role}</p>
                                    <ul className="list-none space-y-2 text-[10pt] text-slate-800 mt-2">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="text-left flex items-start gap-2">
                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-900 flex-shrink-0" />
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
                        <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Education</h2>
                        <div className="space-y-3">
                            {data.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-bold text-[10.5pt] uppercase tracking-tight text-slate-900">{edu.institution}</span>
                                        <span className="italic text-[9pt] font-medium text-slate-600 uppercase tracking-widest">{edu.startDate} — {edu.endDate || 'Present'}</span>
                                    </div>
                                    <p className="italic text-[10pt] text-slate-800 font-medium">{edu.degree}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Selected Projects</h2>
                        <div className="space-y-3">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-[10.5pt] text-slate-900 mb-0.5">{proj.name}</h3>
                                    <p className="text-[10pt] text-slate-700 leading-relaxed text-left">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Technical Skills</h2>
                        <p className="text-[10pt] text-slate-800 leading-relaxed">
                            <span className="font-bold">Expertise:</span> {data.skills.join(", ")}
                        </p>
                    </section>
                )}

                {/* Achievements & Certifications */}
                <div className="grid grid-cols-2 gap-8 items-start">
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Honors</h2>
                            <ul className="list-none space-y-2 text-[9.5pt] text-slate-800 mt-2">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-900 flex-shrink-0" />
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[11pt] font-bold uppercase border-b border-slate-300 mb-2 pb-0.5 tracking-wide">Credentials</h2>
                            <ul className="list-none space-y-2 text-[9.5pt] text-slate-800 mt-2">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-900 flex-shrink-0" />
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

