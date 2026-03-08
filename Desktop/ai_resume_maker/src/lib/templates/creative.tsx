import React from "react";
import { ResumeData } from "@/lib/schemas/resume";

export const CreativeTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
    return (
        <div className="bg-slate-50 text-slate-800 w-full font-sans leading-snug flex flex-col shadow-none print:shadow-none text-[10pt] flex-1">
            {/* Header - Refined Creative Style */}
            {data.basics && (
                <div className="px-10 pt-8 pb-4">
                    <header className="relative py-6 px-8 bg-white rounded-[1.25rem] border border-slate-200 shadow-xl ring-1 ring-slate-100 overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -ml-12 -mb-12 opacity-30" />
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3 leading-none">
                                {data.basics.name}
                            </h1>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[9pt] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {data.basics.email}
                                </span>
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {data.basics.phone}
                                </span>
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {data.basics.location}
                                </span>
                            </div>
                        </div>
                    </header>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-8 flex-1 px-10 pb-10 mt-2">
                {/* Left Side: Skills & Info */}
                <div className="col-span-4 space-y-8">
                    {/* Summary in Sidebar for Creative look */}
                    {data.basics?.summary && (
                        <section>
                            <h2 className="text-[10pt] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-3">
                                Profile
                                <div className="h-1 w-6 bg-primary/10 rounded-full" />
                            </h2>
                            <p className="text-[9.5pt] text-slate-600 font-medium leading-relaxed italic">
                                {data.basics.summary}
                            </p>
                        </section>
                    )}

                    {data.skills && data.skills.length > 0 && (
                        <section>
                            <h2 className="text-[10pt] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-3">
                                Expertise
                                <div className="h-1 w-6 bg-primary/10 rounded-full" />
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1.5 bg-white border border-slate-100 text-slate-700 rounded-lg text-[8.5pt] font-bold uppercase tracking-wider shadow-sm hover:border-primary/30 transition-colors">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {data.education && data.education.length > 0 && (
                        <section>
                            <h2 className="text-[10pt] font-black uppercase tracking-[0.25em] text-primary mb-4 flex items-center gap-4">
                                Education
                                <div className="h-1 w-8 bg-primary/10 rounded-full" />
                            </h2>
                            <div className="space-y-4">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="group bg-white p-4 rounded-xl border border-slate-50 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="font-black text-slate-900 text-[10pt] uppercase leading-tight mb-2">{edu.degree}</div>
                                        <div className="text-[9pt] text-slate-400 font-bold uppercase mb-1">{edu.institution}</div>
                                        <div className="text-[8.5pt] text-primary font-black tracking-widest">{edu.startDate} — {edu.endDate || 'Present'}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Side: Experience & Projects */}
                <div className="col-span-8 space-y-8">
                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                        <section>
                            <h2 className="text-[11pt] font-black uppercase tracking-[0.25em] text-primary mb-6 flex items-center gap-4">
                                Career Path
                                <div className="h-px bg-slate-200 flex-1" />
                            </h2>
                            <div className="space-y-8">
                                {data.experience.map((exp, i) => (
                                    <div key={i} className="relative group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-[13pt] font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">{exp.role}</h3>
                                                <p className="text-[10.5pt] font-black text-primary uppercase tracking-[0.1em] mt-1 opacity-80">{exp.company}</p>
                                            </div>
                                            <span className="text-[9pt] font-black text-slate-400 border border-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest bg-white shadow-sm">{exp.startDate} — {exp.endDate || 'Present'}</span>
                                        </div>
                                        <ul className="space-y-2 text-[10pt] text-slate-600 font-medium leading-relaxed">
                                            {(exp.bullets || []).map((bullet, j) => (
                                                <li key={j} className="flex items-start gap-4">
                                                    <span className="w-2 h-2 rounded-full bg-slate-200 mt-2 flex-shrink-0 group-hover:bg-primary/30 transition-colors" />
                                                    <span className="text-justify">{bullet}</span>
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
                            <h2 className="text-[11pt] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-4">
                                Projects
                                <div className="h-px bg-slate-200 flex-1" />
                            </h2>
                            <div className="space-y-6">
                                {data.projects.map((proj, i) => (
                                    <div key={i} className="relative group p-4 bg-white/50 rounded-2xl border border-transparent hover:border-primary/10 hover:bg-white transition-all shadow-sm hover:shadow-md">
                                        <h3 className="text-[12pt] font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-primary transition-colors font-sans">{proj.name}</h3>
                                        <p className="text-[10pt] text-slate-600 font-medium leading-relaxed text-justify italic">{proj.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Achievements & Certifications */}
                    <div className="grid grid-cols-2 gap-6 pt-2">
                        {data.achievements && data.achievements.length > 0 && (
                            <section className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-[10pt] font-black uppercase tracking-[0.15em] text-primary mb-4">Milestones</h2>
                                <ul className="space-y-3 text-[9.5pt] text-slate-600 font-medium italic">
                                    {data.achievements.map((ach, i) => (
                                        <li key={i} className="flex items-start gap-3 group">
                                            <span className="text-primary font-black">★</span>
                                            <span>{ach}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {data.certifications && data.certifications.length > 0 && (
                            <section className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="text-[10pt] font-black uppercase tracking-[0.15em] text-primary mb-4">Accreditation</h2>
                                <ul className="space-y-3 text-[9.5pt] text-slate-600 font-medium">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i} className="flex items-start gap-3 group">
                                            <span className="text-primary font-black">✓</span>
                                            <span>{cert}</span>
                                        </li>
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
