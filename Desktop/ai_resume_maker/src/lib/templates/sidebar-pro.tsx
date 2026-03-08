import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const SidebarProTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex shadow-none print:shadow-none text-[10pt] min-h-full">
            {/* Left Sidebar */}
            <aside className="w-[32%] bg-slate-900 text-white px-6 py-8 flex flex-col gap-5">
                {/* Name */}
                {data.basics && (
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{data.basics.name}</h1>
                        {data.basics.summary && (
                            <p className="text-[9px] text-slate-300 leading-relaxed mt-2">{data.basics.summary}</p>
                        )}
                    </div>
                )}

                {/* Contact */}
                {data.basics && (
                    <section className="space-y-1.5">
                        <h2 className="text-[9px] uppercase tracking-[0.25em] font-black text-sky-400 mb-1">Contact</h2>
                        <div className="text-[9px] text-slate-300 space-y-1 font-medium">
                            {data.basics.email && <div>{data.basics.email}</div>}
                            {data.basics.phone && <div>{data.basics.phone}</div>}
                            {data.basics.location && <div>{data.basics.location}</div>}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section className="space-y-1.5">
                        <h2 className="text-[9px] uppercase tracking-[0.25em] font-black text-sky-400 mb-1">Skills</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {data.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[8px] font-bold rounded border border-slate-700">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section className="space-y-2">
                        <h2 className="text-[9px] uppercase tracking-[0.25em] font-black text-sky-400 mb-1">Education</h2>
                        {data.education.map((edu, i) => (
                            <div key={i} className="space-y-0.5">
                                <h3 className="text-[10px] font-bold text-white leading-tight">{edu.degree}</h3>
                                <div className="text-[9px] text-slate-400 font-medium">{edu.institution}</div>
                                <div className="text-[8px] text-slate-500">{edu.startDate} - {edu.endDate || "Present"}</div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Certifications */}
                {data.certifications && data.certifications.length > 0 && (
                    <section className="space-y-1.5">
                        <h2 className="text-[9px] uppercase tracking-[0.25em] font-black text-sky-400 mb-1">Certifications</h2>
                        <ul className="space-y-1">
                            {data.certifications.map((cert, i) => (
                                <li key={i} className="text-[9px] text-slate-300 font-medium leading-tight">{cert}</li>
                            ))}
                        </ul>
                    </section>
                )}
            </aside>

            {/* Main Content */}
            <main className="w-[68%] px-8 py-8 space-y-5">
                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-xs uppercase tracking-[0.2em] font-black text-slate-900 border-b-2 border-sky-500 pb-1 mb-3">Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-slate-900 text-[11pt]">{exp.role}</h3>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase">{exp.startDate} - {exp.endDate || "Present"}</span>
                                    </div>
                                    <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider mb-1">{exp.company}</div>
                                    <ul className="space-y-0.5">
                                        {(exp.bullets || []).map((bullet, j) => (
                                            <li key={j} className="flex items-start gap-2 text-[10pt] text-slate-600 leading-tight">
                                                <span className="text-sky-500 mt-1 text-[8pt] shrink-0">&bull;</span>
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
                        <h2 className="text-xs uppercase tracking-[0.2em] font-black text-slate-900 border-b-2 border-sky-500 pb-1 mb-3">Projects</h2>
                        <div className="space-y-3">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-slate-900 text-[11pt]">{proj.name}</h3>
                                    <p className="text-[10pt] text-slate-600 leading-relaxed">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Achievements */}
                {data.achievements && data.achievements.length > 0 && (
                    <section>
                        <h2 className="text-xs uppercase tracking-[0.2em] font-black text-slate-900 border-b-2 border-sky-500 pb-1 mb-3">Achievements</h2>
                        <ul className="space-y-1">
                            {data.achievements.map((ach, i) => (
                                <li key={i} className="flex items-start gap-2 text-[10pt] text-slate-600">
                                    <span className="text-sky-500 mt-1 text-[8pt] shrink-0">&bull;</span>
                                    <span>{ach}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
};
