import { ResumeData } from "../schemas/resume";

// Sample data for template previews
export const sampleResumeData: ResumeData = {
    basics: {
        name: "Alex Johnson",
        email: "alex.johnson@email.com",
        phone: "(555) 123-4567",
        location: "San Francisco, CA",
        summary: "Senior Software Engineer with 8+ years of experience in distributed systems and AI integration. Expert in React, Go, and AWS.",
    },
    education: [
        {
            degree: "Master of Science in Artificial Intelligence",
            institution: "Stanford University",
            startDate: "2022",
            endDate: "2024",
        },
        {
            degree: "Bachelor of Science in Computer Science",
            institution: "UC Berkeley",
            startDate: "2018",
            endDate: "2022",
        },
    ],
    experience: [
        {
            role: "Senior Software Engineer",
            company: "Tech Corp Inc.",
            startDate: "2024",
            endDate: "Present",
            bullets: [
                "Architected distributed microservices handling 50k+ requests per second with 99.99% uptime",
                "Reduced infrastructure costs by 45% through aggressive containerization and resource tagging",
                "Established engineering-wide best practices for TypeScript and automated integration testing",
            ],
        },
        {
            role: "Software Engineer II",
            company: "InnovateSoft",
            startDate: "2022",
            endDate: "2024",
            bullets: [
                "Full-stack development of enterprise-grade SaaS products using React and Golang",
                "Optimized database performance by 60% using advanced indexing and query restructuring",
            ],
        },
    ],
    projects: [
        {
            name: "AI-Powered Portfolio",
            description: "Developed a dynamic portfolio that generates personalized case studies using LLMs with Next.js and OpenAI.",
        },
        {
            name: "Cloud Resource Manager",
            description: "Automated the decommissioning of idle resources, saving $5k/month for research teams using Go and AWS.",
        },
    ],
    skills: ["TypeScript", "Python", "Go", "React", "Next.js", "AWS", "Docker", "Kubernetes", "SQL"],
    achievements: [],
    certifications: [],
    template: "modern",
};

// Template metadata type
export interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    category: "Professional" | "Modern" | "ATS";
}

// All available templates
export const templateList: TemplateInfo[] = [
    {
        id: "modern",
        name: "Modern Minimal",
        description: "Clean typography with subtle dividers for a contemporary look.",
        category: "Modern",
    },
    {
        id: "executive",
        name: "Management",
        description: "Authoritative design for leadership and management roles.",
        category: "Professional",
    },
    {
        id: "simple",
        name: "Standard ATS",
        description: "Classic black and white layout with perfect parsing compatibility.",
        category: "ATS",
    },
    {
        id: "creative",
        name: "Creative Designer",
        description: "Modern, visually striking layout for creative professionals.",
        category: "Modern",
    },
    {
        id: "corporate",
        name: "Corporate Standard",
        description: "Professional banner header with classic serif font for banking and law.",
        category: "Professional",
    },
    {
        id: "sleek",
        name: "Sleek Modern",
        description: "Contemporary left-sidebar design with emerald accents and modern headers.",
        category: "Modern",
    },
    {
        id: "classic",
        name: "Traditional",
        description: "Elegant serif fonts and a formal structure for established careers.",
        category: "Professional",
    },
    {
        id: "tech",
        name: "Developer Pro",
        description: "Technical layout optimized for software engineers and architects.",
        category: "Modern",
    },
    {
        id: "functional",
        name: "Competency Focus",
        description: "Left-sidebar layout highlighting skills and competencies first.",
        category: "Modern",
    },
    {
        id: "professional",
        name: "Executive",
        description: "Rich two-column layout designed for senior-level professionals.",
        category: "Professional",
    },
    {
        id: "clean",
        name: "Clean Slate",
        description: "Minimalist layout with clear sans-serif typography and tag-style skills.",
        category: "Modern",
    },
    {
        id: "premium",
        name: "Premium Elite",
        description: "Elegant right-sidebar layout with serif typography for top-tier roles.",
        category: "Professional",
    },
    {
        id: "compact",
        name: "High-Density",
        description: "Fits maximum information while maintaining high readability.",
        category: "ATS",
    },
    {
        id: "bold",
        name: "Strong Content",
        description: "Higher contrast typography to make your experience pop.",
        category: "Modern",
    },
    {
        id: "elegant",
        name: "Sleek Professional",
        description: "Sophisticated balance of style and professionalism.",
        category: "Professional",
    },
    {
        id: "prime",
        name: "Modern Prime",
        description: "Vibrant left-sidebar design with amber accents for creative industries.",
        category: "Modern",
    },
    {
        id: "academic",
        name: "Scholar",
        description: "Specifically structured for researchers and academic resumes.",
        category: "Professional",
    },
    {
        id: "minimal",
        name: "Minimalist",
        description: "Ultra-lean design focusing purely on content and white space.",
        category: "Modern",
    },
    {
        id: "elite",
        name: "Elite Executive",
        description: "Commanding right-sidebar layout with rose accents and banner header.",
        category: "Professional",
    },
    {
        id: "basic",
        name: "Essential",
        description: "Back to basics with highly effective professional styling.",
        category: "ATS",
    },
    {
        id: "sidebar-pro",
        name: "Sidebar Pro",
        description: "Dark left sidebar with contact and skills, clean main content area.",
        category: "Modern",
    },
    {
        id: "infographic",
        name: "Infographic",
        description: "Visual skill bars, timeline experience, and icon-driven sections.",
        category: "Modern",
    },
    {
        id: "monogram",
        name: "Monogram",
        description: "Bold initial monogram header with elegant right-sidebar layout.",
        category: "Professional",
    },
];

// Get template by ID
export const getTemplateInfo = (id: string): TemplateInfo | undefined => {
    return templateList.find(t => t.id === id);
};
