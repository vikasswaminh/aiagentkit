import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

const COLORS = {
    purple: { primary: "text-purple-900", accent: "text-purple-600", border: "border-purple-100", bg: "bg-purple-50/50", banner: "bg-purple-900" },
};

export const PremiumTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    const c = COLORS.purple;

    return (
        <div className="bg-white text-slate-800 w-full shadow-none print:shadow-none flex flex-col text-[9.5pt] font-serif flex-1">
            {/* Header - Modern */}
            {data.basics && (
                <header className={`px-10 pt-6 pb-4 flex justify-between items-end border-b-2 border-purple-100`}>
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
                {/* Main Content */}
                <main className="w-[65%] py-4 pl-10">
                    <div className="space-y-4">
                        {/* Summary */}
                        {data.basics?.summary && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Profile</h2>
                                <p className="text-[10pt] text-slate-600 font-medium leading-relaxed italic">
                                    {data.basics.summary}
                                </p>
                            </section>
                        )}

                        {/* Experience */}
                        {data.experience && data.experience.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Experience</h2>
                                <div className="space-y-3">
                                    {data.experience.map((exp, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-slate-900 text-[12.5pt] leading-none mb-1">{exp.role}</h3>
                                                <span className={`text-[9px] font-bold uppercase ${c.accent}`}>{exp.startDate} — {exp.endDate || 'Present'}</span>
                                            </div>
                                            <div className={`text-[10pt] font-bold uppercase tracking-wide mb-1 ${c.primary}`}>{exp.company}</div>
                                            <ul className={`list-disc list-outside ml-3 space-y-0.5 text-slate-600 text-[10pt] leading-tight marker:text-purple-600`}>
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
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Projects</h2>
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
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Education</h2>
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
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-[30%] border-l border-slate-100 pl-10 pr-10 py-4">
                    <div className="space-y-6">
                        {/* Skills */}
                        {data.skills && data.skills.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map((skill, i) => (
                                        <span key={i} className={`text-[9px] font-bold uppercase px-3 py-1 rounded-sm ${c.bg} ${c.primary}`}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {data.achievements && data.achievements.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Awards</h2>
                                <ul className={`list-disc list-outside ml-3 space-y-2 text-slate-600 text-[11px] leading-tight marker:text-purple-600`}>
                                    {data.achievements.map((ach, i) => (
                                        <li key={i}>{ach}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {data.certifications && data.certifications.length > 0 && (
                            <section>
                                <h2 className={`text-[10px] uppercase tracking-widest mb-2 font-black ${c.primary} border-b border-purple-100 pb-1.5`}>Certs</h2>
                                <ul className="space-y-2">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="text-xs font-medium text-slate-600 border-l-2 border-slate-100 pl-2">{cert}</li>
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
