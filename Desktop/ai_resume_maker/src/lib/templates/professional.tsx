import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const ProfessionalTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 w-full flex shadow-none print:shadow-none font-sans text-[9.5pt] flex-1">
            {/* Left Sidebar */}
            <aside className="w-[30%] bg-slate-900 text-white px-6 pt-8 pb-8 flex flex-col">
                {/* Initials */}
                {data.basics && (
                    <div className="w-16 h-16 bg-slate-800 rounded-xl mb-6 flex items-center justify-center text-2xl font-black shadow-2xl border border-slate-700">
                        {(data.basics.name || "").split(" ").map(n => n[0]).join("")}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Contact */}
                    {data.basics && (
                        <section>
                            <h3 className="text-[8pt] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Connectivity</h3>
                            <div className="space-y-3 text-[8.5pt]">
                                {data.basics.location && (
                                    <p className="flex items-start gap-4 text-slate-200">
                                        <span className="text-slate-500 mt-1">📍</span> {data.basics.location}
                                    </p>
                                )}
                                {data.basics.phone && (
                                    <p className="flex items-start gap-4 text-slate-200">
                                        <span className="text-slate-500 mt-1">📞</span> {data.basics.phone}
                                    </p>
                                )}
                                {data.basics.email && (
                                    <p className="flex items-start gap-4 text-slate-200 break-all leading-snug">
                                        <span className="text-slate-500 mt-1">✉️</span> {data.basics.email}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h3 className="text-[9pt] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Education</h3>
                            <div className="space-y-4">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="group">
                                        <p className="font-black text-slate-100 text-[9pt] leading-tight mb-1 uppercase tracking-tight">{edu.degree}</p>
                                        <p className="text-[8pt] text-slate-400 font-bold mb-1">{edu.institution}</p>
                                        <p className="text-[7.5pt] text-primary font-black uppercase tracking-widest">{edu.startDate} — {edu.endDate || 'Present'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h3 className="text-[9pt] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Core Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 text-[7.5pt] font-black rounded border border-slate-700 uppercase tracking-wider">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 pt-8 pb-8 flex flex-col">
                {/* Header */}
                {data.basics && (
                    <header className="mb-8">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{data.basics.name}</h1>
                        <div className="h-1.5 w-16 bg-primary rounded-full mb-6" />
                        {data.basics.summary && (
                            <p className="text-[10pt] text-slate-600 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-4 py-1">
                                {data.basics.summary}
                            </p>
                        )}
                    </header>
                )}

                <div className="space-y-6">
                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                        <section>
                            <h2 className="text-[9.5pt] font-black uppercase tracking-[0.2em] text-slate-300 mb-4 border-b border-slate-100 pb-1">
                                Experience
                            </h2>
                            <div className="space-y-6">
                                {data.experience.map((exp, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="text-[12pt] font-black text-slate-900 tracking-tight uppercase leading-none">{exp.role}</h3>
                                            <span className="text-[9pt] font-black text-slate-400 tracking-widest uppercase">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                        </div>
                                        <p className="text-[10pt] text-primary font-black uppercase tracking-wider mb-2.5">{exp.company}</p>
                                        <ul className="space-y-1.5 text-[9.5pt] text-slate-600 font-medium leading-tight">
                                            {(exp.bullets || []).map((bullet, j) => (
                                                <li key={j} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-100 mt-1.5 shrink-0" />
                                                    <span>{bullet}</span>
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
                            <h2 className="text-[9.5pt] font-black uppercase tracking-[0.2em] text-slate-300 mb-4 border-b border-slate-100 pb-1">
                                Key Initiatives
                            </h2>
                            <div className="space-y-4">
                                {data.projects.map((proj, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                        <h3 className="text-[11pt] font-black text-slate-900 tracking-tight uppercase mb-1.5">{proj.name}</h3>
                                        <p className="text-[9.5pt] text-slate-600 font-medium leading-relaxed">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Achievements & Certifications */}
                    <div className="grid grid-cols-2 gap-8 pt-2">
                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-300 mb-3 border-b border-slate-100 pb-1">
                                    Awards
                                </h2>
                                <ul className="space-y-2 text-[9pt] text-slate-600 font-bold">
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
                                <h2 className="text-[9pt] font-black uppercase tracking-[0.2em] text-slate-300 mb-3 border-b border-slate-100 pb-1">
                                    Licensing
                                </h2>
                                <ul className="space-y-2 text-[9pt] text-slate-600 font-bold">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <span>{cert}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

