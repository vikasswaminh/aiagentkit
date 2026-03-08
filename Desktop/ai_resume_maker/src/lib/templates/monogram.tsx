import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const MonogramTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const initials = (data.basics?.name || "")
        .split(" ")
        .map(n => n[0] || "")
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="bg-white text-slate-800 font-serif leading-snug w-full flex flex-col shadow-none print:shadow-none text-[10pt] min-h-full">
            {/* Header with Monogram */}
            {data.basics && (
                <header className="px-10 pt-8 pb-5 flex items-start gap-6 border-b border-slate-200">
                    {/* Monogram */}
                    <div className="w-20 h-20 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-3xl font-black text-white tracking-tight font-sans">{initials}</span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900 font-sans">{data.basics.name}</h1>
                        <div className="flex items-center gap-3 mt-2 text-[9px] font-medium text-slate-500 font-sans">
                            {data.basics.email && <span>{data.basics.email}</span>}
                            {data.basics.phone && <><span className="text-slate-300">&#x2022;</span><span>{data.basics.phone}</span></>}
                            {data.basics.location && <><span className="text-slate-300">&#x2022;</span><span>{data.basics.location}</span></>}
                        </div>
                        {data.basics.summary && (
                            <p className="text-[10px] text-slate-600 leading-relaxed mt-2 max-w-xl">{data.basics.summary}</p>
                        )}
                    </div>
                </header>
            )}

            <div className="flex flex-1">
                {/* Main Content */}
                <main className="w-[65%] px-10 py-5 space-y-5">
                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-3 pb-1 border-b border-slate-200">Experience</h2>
                            <div className="space-y-4">
                                {data.experience.map((exp, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-slate-900 text-[11pt] font-sans">{exp.role}</h3>
                                            <span className="text-[9px] font-semibold text-slate-400 font-sans">{exp.startDate} - {exp.endDate || "Present"}</span>
                                        </div>
                                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide font-sans mb-1">{exp.company}</div>
                                        <ul className="space-y-0.5">
                                            {(exp.bullets || []).map((bullet, j) => (
                                                <li key={j} className="flex items-start gap-2 text-[10pt] text-slate-600 leading-tight">
                                                    <span className="text-slate-400 mt-1 text-[8pt] shrink-0">&#x2014;</span>
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
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-3 pb-1 border-b border-slate-200">Projects</h2>
                            <div className="space-y-3">
                                {data.projects.map((proj, i) => (
                                    <div key={i}>
                                        <h3 className="font-bold text-slate-900 text-[11pt] font-sans">{proj.name}</h3>
                                        <p className="text-[10pt] text-slate-600 leading-relaxed italic">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Right Sidebar */}
                <aside className="w-[35%] px-6 py-5 bg-slate-50/60 border-l border-slate-100 space-y-5">
                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-2 pb-1 border-b border-slate-200">Skills</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white text-slate-700 text-[8px] font-bold rounded border border-slate-200 font-sans">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-2 pb-1 border-b border-slate-200">Education</h2>
                            <div className="space-y-2.5">
                                {data.education.map((edu, i) => (
                                    <div key={i}>
                                        <h3 className="text-[10px] font-bold text-slate-900 leading-tight font-sans">{edu.degree}</h3>
                                        <div className="text-[9px] text-slate-500 font-medium">{edu.institution}</div>
                                        <div className="text-[8px] text-slate-400 font-sans">{edu.startDate} - {edu.endDate || "Present"}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications */}
                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-2 pb-1 border-b border-slate-200">Certifications</h2>
                            <ul className="space-y-1">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="text-[9px] text-slate-600 font-medium">{cert}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Achievements */}
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900 font-sans mb-2 pb-1 border-b border-slate-200">Achievements</h2>
                            <ul className="space-y-1">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="text-[9px] text-slate-600 font-medium italic">{ach}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
};
