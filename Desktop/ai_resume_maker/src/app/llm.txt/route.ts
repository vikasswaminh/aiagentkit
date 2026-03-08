export function GET() {
    const content = `# FreeFreeCV
> A 100% free, AI-powered resume builder with ATS-optimized templates.

## About
FreeFreeCV is a free online resume builder at https://freefreecv.com. It provides 23 professionally designed, ATS-friendly resume templates with AI-powered bullet point enhancement. No sign-up is required to start building. There is no premium tier, no watermarks, and no usage limits.

## Features
- 23 ATS-optimized resume templates (Professional, Modern, Creative categories)
- AI bullet point enhancer powered by LLMs (improves weak resume bullets into strong, quantified achievements)
- PDF export with pixel-perfect formatting
- Resume import from existing PDF
- AI summary generator
- AI skill suggestions based on job titles
- ATS compatibility score checker
- Job description keyword matcher
- No account required to start building

## Pricing
Free. There is no paid plan. No credit card required. No watermarks on exported PDFs.

## Target Audience
Job seekers, career changers, students, and professionals who need a polished resume without paying for resume builder subscriptions.

## Technology
Built with Next.js, React, and Tailwind CSS. AI features use OpenRouter with model fallback chains for reliability.

## Content
- Homepage: https://freefreecv.com
- Template Gallery: https://freefreecv.com/templates
- Resume Builder: https://freefreecv.com/builder
- Blog (Resume Guides): https://freefreecv.com/blog
- Software Engineer Templates: https://freefreecv.com/resume-templates/software-engineer
- Product Manager Templates: https://freefreecv.com/resume-templates/product-manager
- Nursing Templates: https://freefreecv.com/resume-templates/nurse
- Teacher Templates: https://freefreecv.com/resume-templates/teacher
- Data Analyst Templates: https://freefreecv.com/resume-templates/data-analyst
- Marketing Templates: https://freefreecv.com/resume-templates/marketing
- Fresher Templates: https://freefreecv.com/resume-templates/fresher
- Designer Templates: https://freefreecv.com/resume-templates/designer
- ATS Templates: https://freefreecv.com/resume-templates/ats
- No Sign-Up Builder: https://freefreecv.com/resume-builder/no-sign-up

## Contact
Website: https://freefreecv.com
`

    return new Response(content, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
