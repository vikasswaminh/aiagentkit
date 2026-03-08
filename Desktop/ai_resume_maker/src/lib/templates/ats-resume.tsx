import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

// Export as ATSTemplate for registry
export { ATSResumeTemplate as ATSTemplate };

export const ATSResumeTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-white text-slate-800 font-sans leading-snug w-full flex flex-col gap-2 shadow-none print:shadow-none text-[10.5pt] overflow-hidden flex-1 px-10 py-8">
            {/* Header */}
            {data.basics && (
                <header className="text-center border-b-[1.5pt] border-black pb-2">
                    <h1 className="text-2xl font-bold uppercase tracking-wide mb-0.5 leading-none">{data.basics.name}</h1>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-[9.5pt] font-medium text-slate-700">
                        {data.basics.location && <span>{data.basics.location}</span>}
                        {data.basics.location && (data.basics.phone || data.basics.email) && <span className="text-slate-300">•</span>}
                        {data.basics.phone && <span>{data.basics.phone}</span>}
                        {(data.basics.phone && data.basics.email) && <span className="text-slate-300">•</span>}
                        {data.basics.email && <span>{data.basics.email}</span>}
                    </div>
                </header>
            )}

            <div className="space-y-4 flex-1 mt-2">
                {/* Summary */}
                {data.basics?.summary && (
                    <section className="space-y-1">
                        <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1">Professional Summary</h2>
                        <p className="text-[10pt] text-slate-800 text-justify leading-relaxed">{data.basics.summary}</p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section className="space-y-1">
                        <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Professional Experience</h2>
                        {data.experience.map((exp, i) => (
                            <div key={i} className="space-y-0.5 mb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-bold text-[10.5pt]">{exp.company}</div>
                                        <div className="italic text-[10pt]">{exp.role}</div>
                                    </div>
                                    <div className="text-right font-bold text-[10pt] uppercase">{exp.startDate} — {exp.endDate || 'Present'}</div>
                                </div>
                                {exp.bullets && exp.bullets.length > 0 && (
                                    <ul className="list-disc list-outside ml-5 space-y-0.5 text-[10pt] text-slate-800">
                                        {exp.bullets.map((bullet, j) => (
                                            <li key={j} className="pl-1 text-justify">{bullet}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <section className="space-y-1">
                        <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Key Projects</h2>
                        {data.projects.map((proj, i) => (
                            <div key={i} className="space-y-0.5 mb-2">
                                <div className="font-bold text-[10.5pt] mb-1">{proj.name}</div>
                                <p className="text-[10pt] text-slate-800 text-justify leading-relaxed">{proj.description}</p>
                            </div>
                        ))}
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section className="space-y-1">
                        <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Education</h2>
                        {data.education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-start mb-1">
                                <div>
                                    <div className="font-bold text-[10.5pt]">{edu.institution}</div>
                                    <div className="italic text-[10pt]">{edu.degree}</div>
                                </div>
                                <div className="text-right font-bold text-[10pt] uppercase">{edu.startDate} — {edu.endDate || 'Present'}</div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section className="space-y-1">
                        <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Technical Skills</h2>
                        <p className="text-[10pt] text-slate-800 leading-relaxed">
                            <span className="font-bold">Skills:</span> {data.skills.join(", ")}
                        </p>
                    </section>
                )}

                <div className="grid grid-cols-2 gap-8 items-start">
                    {/* Achievements */}
                    {data.achievements && data.achievements.length > 0 && (
                        <section className="space-y-1">
                            <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Achievements</h2>
                            <ul className="list-disc list-outside ml-5 space-y-0.5 text-[10pt] text-slate-800">
                                {data.achievements.map((ach, i) => (
                                    <li key={i} className="pl-1">{ach}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Certifications */}
                    {data.certifications && data.certifications.length > 0 && (
                        <section className="space-y-1">
                            <h2 className="text-[10.5pt] font-bold uppercase tracking-tight border-b-[1pt] border-black pb-1 mb-1">Certifications</h2>
                            <ul className="list-disc list-outside ml-5 space-y-0.5 text-[10pt] text-slate-800">
                                {data.certifications.map((cert, i) => (
                                    <li key={i} className="pl-1">{cert}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

