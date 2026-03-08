import { z } from "zod";

export const BasicsSchema = z.object({
  name: z.string().nullable().transform(v => v ?? "").default(""),
  email: z.string().nullable().transform(v => v ?? "").default(""),
  phone: z.string().nullable().transform(v => v ?? "").default(""),
  location: z.string().nullable().transform(v => v ?? "").default(""),
  summary: z.string().nullable().transform(v => v ?? "").default(""),
});

export const ExperienceSchema = z.object({
  company: z.string().nullable().transform(v => v ?? "").default(""),
  role: z.string().nullable().transform(v => v ?? "").default(""),
  startDate: z.string().nullable().transform(v => v ?? "").default(""),
  endDate: z.string().nullable().transform(v => v ?? "").default(""),
  bullets: z.array(z.string()).nullable().transform(v => v ?? []).default([]),
});

export const EducationSchema = z.object({
  institution: z.string().nullable().transform(v => v ?? "").default(""),
  degree: z.string().nullable().transform(v => v ?? "").default(""),
  startDate: z.string().nullable().transform(v => v ?? "").default(""),
  endDate: z.string().nullable().transform(v => v ?? "").default(""),
});

export const ProjectSchema = z.object({
  name: z.string().nullable().transform(v => v ?? "").default(""),
  description: z.string().nullable().transform(v => v ?? "").default(""),
});

export const ResumeSchema = z.object({
  basics: BasicsSchema.nullable().transform(v => v ?? {
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  }),
  experience: z.array(ExperienceSchema).nullable().transform(v => v ?? []).default([]),
  education: z.array(EducationSchema).nullable().transform(v => v ?? []).default([]),
  projects: z.array(ProjectSchema).nullable().transform(v => v ?? []).default([]),
  skills: z.array(z.string()).nullable().transform(v => v ?? []).default([]),
  achievements: z.array(z.string()).nullable().transform(v => v ?? []).optional().default([]),
  certifications: z.array(z.string()).nullable().transform(v => v ?? []).optional().default([]),
  template: z.string().nullable().transform(v => v ?? "simple").optional().default("simple"),
});

export type ResumeData = z.infer<typeof ResumeSchema>;
