import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    slate: { primary: "text-slate-900", accent: "text-slate-500", border: "border-slate-200", bg: "bg-slate-50", banner: "bg-slate-900" },
};

export const BasicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.slate;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-mono flex-1">
            {/* Header - Simple */}
            {data.basics && (
                <header className="px-10 pt-8 pb-4 border-b border-slate-100">
                    <h1 className={`text-3xl font-bold tracking-tight ${c.primary}`}>{data.basics.name}</h1>
                    <div className={`mt-1.5 flex flex-wrap gap-4 text-xs ${c.accent}`}>
                        <span>{data.basics.location}</span>
                        <span>{data.basics.email}</span>
                        <span>{data.basics.phone}</span>
                    </div>
                </header>
            )}

            <div className="px-10 py-6 space-y-6">
                {/* Summary */}
                {data.basics?.summary && (
                    <section>
                        <h2 className={`text-xs uppercase tracking-widest mb-2 font-black ${c.primary}`}>Profile</h2>
                        <p className="text-[10pt] text-slate-600 leading-relaxed font-medium italic">{data.basics.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Experience</h2>
                        <div className="space-y-5">
                            {data.experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900 text-[12pt] leading-none">{exp.role}</h3>
                                        <span className={`text-[9px] font-bold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                    </div>
                                    <div className={`text-[10pt] font-bold uppercase tracking-wide mb-2 ${c.primary}`}>{exp.company}</div>
                                    <ul className={`list-disc list-outside ml-4 space-y-1 text-slate-600 text-[10pt] leading-tight marker:text-slate-400`}>
                                        {(exp.bullets || []).map((bullet, j) => <li key={j} className="text-justify">{bullet}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section>
                        <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Key Projects</h2>
                        <div className="space-y-4">
                            {data.projects.map((proj, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-slate-900 text-[11.5pt] leading-none mb-1.5">{proj.name}</h3>
                                    <p className="text-slate-600 text-[10pt] leading-relaxed italic">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Education</h2>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-[10pt] uppercase tracking-wide">{edu.institution}</h3>
                                        <div className="text-slate-500 text-[9pt] italic">{edu.degree}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase ${c.accent}`}>{edu.startDate} — {edu.endDate || 'Present'}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-10">
                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="text-[9pt] text-slate-600 font-bold border border-slate-100 px-2 py-0.5 rounded">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="space-y-6">
                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Awards</h2>
                                <ul className="list-disc list-outside ml-4 space-y-1 text-slate-600 text-[9pt] leading-tight marker:text-slate-300">
                                    {data.achievements.map((ach, i) => (
                                        <li key={i}>{ach}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-xs uppercase tracking-widest mb-3 font-black ${c.primary}`}>Certs</h2>
                                <ul className="list-disc list-outside ml-4 space-y-1 text-slate-600 text-[9pt] leading-tight marker:text-slate-300">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i}>{cert}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
