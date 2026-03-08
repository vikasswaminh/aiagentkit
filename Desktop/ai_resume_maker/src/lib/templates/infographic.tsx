import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const InfographicTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex flex-col shadow-none print:shadow-none text-[10pt] min-h-full">
            {/* Header - Full Width Banner */}
            {data.basics && (
                <header className="bg-gradient-to-r from-violet-600 to-indigo-600 px-10 pt-8 pb-6 text-white">
                    <h1 className="text-4xl font-black tracking-tight leading-none">{data.basics.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-[10px] font-medium text-violet-200">
                        {data.basics.email && <span>{data.basics.email}</span>}
                        {data.basics.phone && <><span className="text-violet-400">|</span><span>{data.basics.phone}</span></>}
                        {data.basics.location && <><span className="text-violet-400">|</span><span>{data.basics.location}</span></>}
                    </div>
                    {data.basics.summary && (
                        <p className="text-[10px] text-violet-100 leading-relaxed mt-3 max-w-2xl">{data.basics.summary}</p>
                    )}
                </header>
            )}

            <div className="flex flex-1">
                {/* Left Column */}
                <div className="w-[38%] px-6 py-5 space-y-5 bg-slate-50/80 border-r border-slate-100">
                    {/* Skills with Visual Bars */}
                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Skills
                            </h2>
                            <div className="space-y-1.5">
                                {data.skills.map((skill, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-[9px] font-semibold text-slate-700 w-[55%] truncate">{skill}</span>
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                style={{ width: `${Math.max(60, 100 - i * 5)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Education
                            </h2>
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="relative pl-4 border-l-2 border-violet-200">
                                        <div className="absolute left-[-5px] top-0.5 w-2 h-2 bg-violet-500 rounded-full" />
                                        <h3 className="text-[10px] font-bold text-slate-900 leading-tight">{edu.degree}</h3>
                                        <div className="text-[9px] text-slate-500 font-medium">{edu.institution}</div>
                                        <div className="text-[8px] text-violet-500 font-semibold">{edu.startDate} - {edu.endDate || "Present"}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certifications */}
                    {data.certifications && data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Certifications
                            </h2>
                            <ul className="space-y-1.5">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="text-[9px] text-slate-600 font-medium flex items-start gap-2">
                                        <span className="text-violet-500 font-black text-[10px]">&#x2713;</span>
                                        <span>{cert}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Achievements */}
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Achievements
                            </h2>
                            <ul className="space-y-1.5">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="text-[9px] text-slate-600 font-medium flex items-start gap-2">
                                        <span className="text-amber-500 font-black text-[10px]">&#x2605;</span>
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* Right Column - Main Content */}
                <div className="w-[62%] px-7 py-5 space-y-5">
                    {/* Experience - Timeline Style */}
                    {data.experience && data.experience.length > 0 && (
                        <section>
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Experience
                            </h2>
                            <div className="space-y-4">
                                {data.experience.map((exp, i) => (
                                    <div key={i} className="relative pl-5 border-l-2 border-indigo-100">
                                        <div className="absolute left-[-6px] top-0 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-indigo-100" />
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="font-bold text-slate-900 text-[11pt] leading-tight">{exp.role}</h3>
                                            <span className="text-[8px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded">{exp.startDate} - {exp.endDate || "Present"}</span>
                                        </div>
                                        <div className="text-[10px] font-semibold text-violet-600 mb-1">{exp.company}</div>
                                        <ul className="space-y-0.5">
                                            {(exp.bullets || []).map((bullet, j) => (
                                                <li key={j} className="flex items-start gap-2 text-[10pt] text-slate-600 leading-tight">
                                                    <span className="text-indigo-400 mt-1 text-[7pt] shrink-0">&#x25B8;</span>
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
                            <h2 className="text-[9px] uppercase tracking-[0.2em] font-black text-violet-700 mb-3 flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-sm" />
                                Projects
                            </h2>
                            <div className="space-y-3">
                                {data.projects.map((proj, i) => (
                                    <div key={i} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                                        <h3 className="font-bold text-slate-900 text-[11pt]">{proj.name}</h3>
                                        <p className="text-[10pt] text-slate-600 leading-relaxed mt-0.5">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};
