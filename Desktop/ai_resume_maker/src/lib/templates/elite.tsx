import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    rose: { primary: "text-rose-900", accent: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50/50", banner: "bg-rose-900" },
};

export const EliteTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.rose;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-serif flex-1 leading-snug">
            {/* Header - Banner */}
            {data.basics && (
                <header className={`${c.banner} text-white px-10 py-6 mb-2`}>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{data.basics.name}</h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-white/90 text-[10pt] font-semibold">
                        <span>{data.basics.location}</span>
                        {data.basics.phone && <span>{data.basics.phone}</span>}
                        <span>{data.basics.email}</span>
                    </div>
                </header>
            )}

            <div className="flex flex-1 gap-8">
                {/* Main Content */}
                <main className="w-[65%] py-4 pl-10">
                    <div className="space-y-3">
                        {/* Summary */}
                        {data.basics?.summary && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Profile</h2>
                                <p className="text-[10pt] text-slate-600 font-medium leading-relaxed italic">
                                    {data.basics.summary}
                                </p>
                            </section>
                        )}

                        {/* Experience */}
                        {data.experience && data.experience.length > 0 && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Experience</h2>
                                <div className="space-y-3">
                                    {data.experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{exp.role}</h3>
                                                <span className={`text-[9.5pt] font-semibold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                            </div>
                                            <div className={`text-[10pt] font-semibold uppercase tracking-wide mb-1 ${c.primary}`}>{exp.company}</div>
                                            <ul className="space-y-0.5 text-slate-600 text-[10pt] leading-tight flex flex-col">
                                                {(exp.bullets || []).map((bullet, j) => (
                                                    <li key={j} className="flex items-start gap-3">
                                                        <span className={`${c.accent} mt-1.5 text-[8pt] shrink-0`}>•</span>
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
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Projects</h2>
                                <div className="space-y-3">
                                    {data.projects.map((proj, i) => (
                                        <div key={i}>
                                            <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{proj.name}</h3>
                                            <p className="text-[10pt] text-slate-600 font-medium leading-relaxed">
                                                {proj.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Education */}
                        {data.education && data.education.length > 0 && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Education</h2>
                                <div className="space-y-3">
                                    {data.education.map((edu, i) => (
                                        <div key={i} className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-[11pt]">{edu.institution}</h3>
                                                <div className="text-slate-500 text-[10pt] font-semibold italic">{edu.degree}</div>
                                            </div>
                                            <span className={`text-[10pt] font-semibold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-[30%] border-l border-slate-100 pl-10 pr-10 py-4">
                    <div className="space-y-6">
                        {/* Skills */}
                        {data.skills && data.skills.length > 0 && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((skill, i) => (
                                        <span key={i} className={`text-[9.5pt] font-semibold uppercase px-2 py-1 border border-rose-100 bg-white text-slate-600`}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Awards</h2>
                                <ul className="space-y-2">
                                    {data.achievements.map((ach, i) => (
                                        <li key={i} className="text-[10pt] font-semibold text-slate-600 border-l-2 border-slate-100 pl-3">{ach}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-[10pt] uppercase tracking-widest mb-3 font-black text-white ${c.banner} px-4 py-1.5`}>Certs</h2>
                                <ul className="space-y-2">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="text-[10pt] font-semibold text-slate-600 border-l-2 border-slate-100 pl-3">{cert}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};
