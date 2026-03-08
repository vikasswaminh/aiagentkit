import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    emerald: { primary: "text-emerald-900", accent: "text-emerald-600", border: "border-emerald-100", bg: "bg-emerald-50/50", banner: "bg-emerald-900" },
};

export const SleekTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.emerald;

    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex flex-col shadow-none print:shadow-none text-[10pt] flex-1">
            {/* Header - Modern */}
            {data.basics && (
                <header className={`px-10 pt-6 pb-4 flex justify-between items-end border-b-2 border-emerald-100`}>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{(data.basics.name || "").split(' ')[0]}</h1>
                        <h1 className={`text-3xl font-light uppercase tracking-tighter leading-none ${c.accent}`}>{(data.basics.name || "").split(' ').slice(1).join(' ')}</h1>
                    </div>
                    <div className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 space-y-0.5">
                        <div>{data.basics.location}</div>
                        <div>{data.basics.email}</div>
                        <div>{data.basics.phone}</div>
                    </div>
                </header>
            )}

            <div className="flex flex-1 gap-8">
                {/* Left Sidebar */}
                <aside className="w-[30%] border-r border-slate-100 px-6 py-4">
                    <div className="space-y-3">
                        {/* Skills - Tags */}
                        {data.skills && data.skills.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Skills</h2>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-600">
                                    {data.skills.map((skill, i) => (
                                        <span key={i} className="border-b border-slate-100 pb-0.5 shrink-0">#{skill.trim()}</span>
                                    ))}
                                </div>
                            </section>
                        )}
                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Certs</h2>
                                <ul className="space-y-2">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="text-xs font-medium text-slate-600 border-l-2 border-slate-100 pl-2">{cert}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="w-[65%] py-4 px-6">
                    <div className="space-y-3">
                        {/* Summary */}
                        {data.basics?.summary && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-1 font-black ${c.primary}`}>Profile</h2>
                                <p className="text-[10pt] text-slate-600 leading-relaxed italic text-justify">{data.basics.summary}</p>
                            </section>
                        )}

                        {/* Experience */}
                        {data.experience && data.experience.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Experience</h2>
                                <div className="space-y-3">
                                    {data.experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{exp.role}</h3>
                                                <span className={`text-[9px] font-semibold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                            </div>
                                            <div className={`text-[10pt] font-semibold uppercase tracking-wide mb-1 ${c.primary}`}>{exp.company}</div>
                                            <ul className="space-y-0.5 text-slate-600 text-[10pt] leading-tight flex flex-col">
                                                {(exp.bullets || []).map((bullet, j) => (
                                                    <li key={j} className="flex items-start gap-3 text-justify">
                                                        <span className={`text-emerald-600 mt-1.5 text-[8pt] shrink-0`}>•</span>
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
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Projects</h2>
                                <div className="space-y-3">
                                    {data.projects.map((proj, i) => (
                                        <div key={i}>
                                            <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{proj.name}</h3>
                                            <p className="text-[10pt] text-slate-600 leading-relaxed italic text-justify mb-1">{proj.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Education */}
                        {data.education && data.education.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Education</h2>
                                <div className="space-y-3">
                                    {data.education.map((edu, i) => (
                                        <div key={i} className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{edu.institution}</h3>
                                                <div className="text-slate-500 text-xs">{edu.degree}</div>
                                            </div>
                                            <span className={`text-[10px] font-semibold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Awards</h2>
                                <ul className="space-y-0.5 text-slate-600 text-[10px] leading-tight flex flex-col">
                                    {data.achievements.map((ach, i) => (
                                        <li key={i} className="flex items-start gap-3 italic">
                                            <span className={`text-emerald-600 mt-1 text-[8pt] shrink-0`}>•</span>
                                            <span>{ach}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
