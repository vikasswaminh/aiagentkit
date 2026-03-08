import { z } from "zod";

export const EnhanceRequestSchema = z.object({
    type: z.enum(["experience", "project", "achievement"]),
    content: z.array(z.string().min(1).max(2000)).min(1).max(10), // Max 2000 chars per bullet, max 10 bullets
    context: z.object({
        role: z.string().max(100).optional(),
        organization: z.string().max(100).optional(),
        projectName: z.string().max(100).optional(),
        techStack: z.string().max(200).optional(),
        jobDescription: z.string().max(2000).optional(),
    }).optional(),
});

export type EnhanceRequest = z.infer<typeof EnhanceRequestSchema>;

// AI Summary Generator
export const GenerateSummarySchema = z.object({
    experience: z.array(z.object({
        role: z.string().max(200),
        company: z.string().max(200),
        bullets: z.array(z.string().max(2000)).optional(),
    })).max(10),
    skills: z.array(z.string().max(100)).max(30),
    education: z.array(z.object({
        degree: z.string().max(300),
        institution: z.string().max(200),
    })).max(5),
});

export type GenerateSummaryRequest = z.infer<typeof GenerateSummarySchema>;

// AI Skill Suggestions
export const SuggestSkillsSchema = z.object({
    experience: z.array(z.object({
        role: z.string().max(200),
        company: z.string().max(200),
        bullets: z.array(z.string().max(2000)).optional(),
    })).max(10),
    currentSkills: z.array(z.string().max(100)).max(30),
});

export type SuggestSkillsRequest = z.infer<typeof SuggestSkillsSchema>;

// Resume Score / ATS Check
export const ScoreResumeSchema = z.object({
    basics: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        location: z.string(),
        summary: z.string(),
    }),
    experience: z.array(z.object({
        role: z.string(),
        company: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        bullets: z.array(z.string()),
    })),
    education: z.array(z.object({
        degree: z.string(),
        institution: z.string(),
    })),
    skills: z.array(z.string()),
    achievements: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
});

export type ScoreResumeRequest = z.infer<typeof ScoreResumeSchema>;

// Job Description Matcher
export const MatchJobSchema = z.object({
    resumeSkills: z.array(z.string().max(100)).max(50),
    resumeBullets: z.array(z.string().max(2000)).max(30),
    jobDescription: z.string().min(10).max(5000),
});

export type MatchJobRequest = z.infer<typeof MatchJobSchema>;
