import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    blue: { primary: "text-blue-900", accent: "text-blue-600", border: "border-blue-100", bg: "bg-blue-50/50", banner: "bg-blue-900" },
};

export const FunctionalTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.blue;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-mono flex-1">
            {/* Header - Simple */}
            {data.basics && (
                <header className="px-10 pt-6 pb-4 border-b border-slate-100">
                    <h1 className={`text-3xl font-bold tracking-tight ${c.primary}`}>{data.basics.name}</h1>
                    <div className={`mt-1.5 flex flex-wrap gap-4 text-xs ${c.accent}`}>
                        <span>{data.basics.location}</span>
                        <span>{data.basics.email}</span>
                        <span>{data.basics.phone}</span>
                    </div>
                </header>
            )}

            <div className="flex flex-1 gap-8">
                {/* Left Sidebar */}
                <aside className="w-[30%] border-r border-slate-100 pr-10 pl-10 py-4">
                    <div className="space-y-6">
                        {/* Skills */}
                        {data.skills && data.skills.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((skill, i) => (
                                        <span key={i} className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border border-blue-100 bg-white text-slate-600`}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-3 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Certs</h2>
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
                <main className="w-[65%] py-4 pr-10">
                    <div className="space-y-5">
                        {/* Summary */}
                        {data.basics?.summary && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Summary</h2>
                                <p className="text-[10pt] text-slate-600 font-medium leading-relaxed italic">
                                    {data.basics.summary}
                                </p>
                            </section>
                        )}

                        {/* Experience */}
                        {data.experience && data.experience.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Experience</h2>
                                <div className="space-y-3">
                                    {data.experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{exp.role}</h3>
                                                <span className={`text-[9px] font-bold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                            </div>
                                            <div className={`text-[10pt] font-bold uppercase tracking-wide mb-1 ${c.primary}`}>{exp.company}</div>
                                            <ul className={`list-disc list-outside ml-3 space-y-0.5 text-slate-600 text-[10pt] leading-tight marker:text-blue-600`}>
                                                {(exp.bullets || []).map((bullet, j) => <li key={j}>{bullet}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Projects */}
                        {data.projects && data.projects.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Projects</h2>
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
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Education</h2>
                                <div className="space-y-3">
                                    {data.education.map((edu, i) => (
                                        <div key={i} className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{edu.institution}</h3>
                                                <div className="text-slate-500 text-xs">{edu.degree}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-l-4 border-blue-100 pl-3`}>Awards</h2>
                                <ul className={`list-disc list-outside ml-3 space-y-0.5 text-slate-600 text-[11px] leading-tight marker:text-blue-600`}>
                                    {data.achievements.map((ach, i) => (
                                        <li key={i}>{ach}</li>
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
