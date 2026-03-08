import type { Metadata } from "next";
import { notFound } from "next/navigation";

type RoleConfig = {
  slug: string;
  keyword: string;
  title: string;
  description: string;
  intro: string;
  h1: string;
};

const ROLES: Record<string, RoleConfig> = {
  "software-engineer": {
    slug: "software-engineer",
    keyword: "free resume template software engineer",
    title: "Free Software Engineer Resume Template | FreeFreeCV",
    description:
      "Download a free software engineer resume template. ATS-optimized, AI-assisted, and ready to customize. Highlight your tech stack, projects, and contributions — no credit card.",
    h1: "Free Resume Template for Software Engineers",
    intro: `Landing a software engineering role starts with a resume that clears ATS filters and impresses hiring managers at the same time. FreeFreeCV's free software engineer resume template is built for exactly that. Each template uses a clean, semantic structure that ATS systems love — no tables, no text boxes, no fancy graphics that break parsing. You get a dedicated section for your tech stack, a project showcase area to highlight GitHub contributions and side projects, and a professional summary section where our AI can auto-generate a compelling opener from your experience in seconds. Whether you're a fresher applying for your first developer role or a senior engineer targeting FAANG companies, our templates are calibrated for the level of detail that gets callbacks. All 23 templates are free to use — pick one, fill it with AI help, and download a pixel-perfect PDF. No subscription, no hidden fees, no credit card required.`,
  },
  "product-manager": {
    slug: "product-manager",
    keyword: "free resume template product manager",
    title: "Free Product Manager Resume Template | FreeFreeCV",
    description:
      "Free product manager resume template that's ATS-friendly and AI-assisted. Showcase your roadmaps, metrics, and leadership — no paywall, no credit card.",
    h1: "Free Resume Template for Product Managers",
    intro: `Product management roles are among the most competitive in tech — your resume needs to communicate strategy, execution, and measurable impact at a glance. FreeFreeCV's free product manager resume template is designed to help you do exactly that. Lead with a strong professional summary that positions you as a cross-functional leader, then follow with experience bullets that quantify outcomes: shipped features, revenue impact, NPS improvements, and team size managed. Our AI bullet enhancer rewrites weak job duty statements into achievement-focused lines that hiring managers and ATS algorithms both reward. The template's clean layout puts your biggest wins front and center, with dedicated space for product skills like roadmap planning, OKRs, agile methodologies, and stakeholder management. Every template on FreeFreeCV is completely free — choose from 23 professionally designed options, customize with AI assistance, and export to PDF instantly. No subscription, no trial, no credit card.`,
  },
  "fresher": {
    slug: "fresher",
    keyword: "free resume template for freshers",
    title: "Free Resume Template for Freshers | FreeFreeCV",
    description:
      "Free resume template for freshers and recent graduates. ATS-optimized, AI-assisted. Showcase projects, internships, and skills even with no experience. No credit card.",
    h1: "Free Resume Template for Freshers",
    intro: `Starting your career without work experience doesn't mean starting with a blank resume. FreeFreeCV's free resume templates for freshers are specifically designed to help recent graduates and entry-level candidates put their best foot forward. Instead of emphasizing years of experience, these templates lead with your education, academic projects, internships, certifications, and the skills that employers actually look for. Our AI suggestion engine recommends industry-relevant skills based on your target role — so even if you're not sure what to include, the tool guides you. The ATS score checker evaluates your resume against real applicant tracking system criteria and tells you exactly what to improve before you submit. You don't need to pay $20/month for a basic resume tool when you're just starting out. FreeFreeCV gives every fresher access to 23 professional templates, four AI tools, and instant PDF export — all completely free, forever. No credit card, no paywall, no time limit.`,
  },
  "data-analyst": {
    slug: "data-analyst",
    keyword: "free resume template data analyst",
    title: "Free Data Analyst Resume Template | FreeFreeCV",
    description:
      "Free data analyst resume template. ATS-friendly, AI-assisted. Highlight your SQL, Python, Tableau skills and data-driven results. No credit card required.",
    h1: "Free Resume Template for Data Analysts",
    intro: `Data analyst roles demand a resume that speaks the language of both hiring managers and the ATS systems filtering applications before any human sees them. FreeFreeCV's free data analyst resume template is designed to strike that balance. Lead with a skills section that highlights your technical stack — SQL, Python, R, Tableau, Power BI, Excel — while our AI skill suggestion tool recommends additional tools and technologies based on current job descriptions in your field. Experience bullets get the AI treatment too: instead of listing responsibilities, you describe results — query optimization that reduced report generation time by 40%, dashboards that drove a $2M revenue decision, data pipelines serving 10M rows daily. The ATS score checker grades your resume on keyword density, section completeness, and formatting consistency, giving you specific tips to improve before you apply. All templates are free — choose from 23 professional designs optimized for ATS, customize with AI assistance, and download your PDF instantly. No subscription required.`,
  },
  "ats": {
    slug: "ats",
    keyword: "free ATS resume template",
    title: "Free ATS Resume Template | FreeFreeCV",
    description:
      "Free ATS-friendly resume template that passes applicant tracking systems. Clean formatting, keyword-optimized, AI-assisted. 23 templates. No credit card.",
    h1: "Free ATS-Friendly Resume Templates",
    intro: `Applicant Tracking Systems (ATS) filter out up to 75% of resumes before a recruiter ever reads them. The most common reasons: tables, graphics, unusual fonts, missing keywords, and non-standard section headers. FreeFreeCV's free ATS resume templates are engineered from the ground up to pass every major ATS platform — Greenhouse, Lever, Taleo, Workday, iCIMS, and more. Every template uses clean single-column or structured two-column layouts with standard heading names, semantic HTML output, and no design elements that confuse parsers. Beyond the template structure, our AI ATS Score Checker analyzes your complete resume and scores it 0–100 on keyword density, section completeness, bullet point quality, and formatting consistency — then gives you specific, actionable tips to push your score higher. The Job Description Matcher lets you paste any posting and instantly see which keywords you're missing. All of this is free: 23 ATS-optimized templates, four AI tools, and PDF export. No credit card, no paywall.`,
  },
  "marketing": {
    slug: "marketing",
    keyword: "free resume template marketing",
    title: "Free Marketing Resume Template | FreeFreeCV",
    description:
      "Free marketing resume template. ATS-optimized, AI-assisted. Showcase campaigns, ROI, and digital marketing skills. 23 templates. No credit card.",
    h1: "Free Resume Template for Marketing Professionals",
    intro: `Marketing roles span a wide spectrum — from content and SEO to performance marketing, brand management, and product marketing. Whatever your specialization, your resume needs to lead with results, not responsibilities. FreeFreeCV's free marketing resume templates give you a clean, professional foundation that highlights campaign performance, ROI metrics, audience growth, and the tools that define modern marketing: Google Ads, HubSpot, Salesforce, Marketo, Mailchimp, and more. Our AI bullet enhancer transforms weak duty statements like "managed social media" into impact-focused lines like "Grew Instagram following by 85K in 6 months through a data-driven content strategy, generating $120K in attributed revenue." The ATS Score Checker ensures your resume surfaces the keywords that marketing hiring managers search for. Every template is free: choose from 23 professional designs, use the AI tools at no cost, and download your PDF instantly. No subscription, no credit card.`,
  },
  "nurse": {
    slug: "nurse",
    keyword: "free resume template nurse",
    title: "Free Nurse Resume Template | FreeFreeCV",
    description:
      "Free nurse and nursing resume template. ATS-friendly, AI-assisted. Highlight certifications, specializations, and clinical experience. No credit card.",
    h1: "Free Resume Template for Nurses",
    intro: `Nursing resumes need to communicate clinical expertise, certifications, and patient care outcomes quickly and clearly — especially when hospital systems use ATS platforms to screen hundreds of applicants for a single role. FreeFreeCV's free nurse resume templates are built to pass these filters while presenting your qualifications in the professional format healthcare recruiters expect. The templates feature dedicated sections for nursing licenses and certifications (RN, BSN, ACLS, BLS, CEN, and more), specializations (ICU, ER, pediatrics, oncology, telemetry), and clinical experience with clear unit descriptions and patient-to-nurse ratios. Our AI tools help you write bullet points that go beyond "provided patient care" to describe the specific scope, acuity, and outcomes of your work. The ATS Score Checker evaluates your resume against healthcare-specific keyword criteria. All 23 templates are completely free to use — no credit card, no subscription, instant PDF export.`,
  },
  "teacher": {
    slug: "teacher",
    keyword: "free resume template teacher",
    title: "Free Teacher Resume Template | FreeFreeCV",
    description:
      "Free teacher and educator resume template. ATS-friendly, AI-assisted. Showcase certifications, teaching philosophy, and classroom achievements. No credit card.",
    h1: "Free Resume Template for Teachers",
    intro: `Whether you're applying for your first classroom position or seeking a department head role, a strong teacher resume communicates your certifications, subject expertise, and the real impact you've had on student outcomes. FreeFreeCV's free teacher resume templates are clean, professional, and ATS-optimized for the education sector — formatted to surface the credentials that school district HR systems are programmed to find. Include your state teaching license, subject endorsements, grade levels taught, curriculum development experience, and evidence of student achievement: standardized test score improvements, reading level gains, graduation rates. Our AI summary generator drafts a compelling professional statement that positions you as a dedicated educator with a clear teaching philosophy. The skill suggestion tool recommends education-specific keywords like differentiated instruction, IEP management, Google Classroom, and PBIS. All templates are completely free — no credit card, no paywall.`,
  },
  "designer": {
    slug: "designer",
    keyword: "free resume template graphic designer",
    title: "Free Graphic Designer Resume Template | FreeFreeCV",
    description:
      "Free graphic designer resume template. ATS-friendly, professionally designed. Highlight your portfolio, tools, and creative achievements. No credit card.",
    h1: "Free Resume Template for Graphic Designers",
    intro: `Graphic designers face a unique resume challenge: the document that lists your creative credentials also needs to pass ATS systems that can't evaluate design quality — only keyword density and formatting structure. FreeFreeCV's free graphic designer resume templates strike the perfect balance: visually polished enough to impress creative directors, cleanly structured enough to clear ATS filters at agencies and in-house design teams. The templates feature dedicated sections for your design tool proficiency (Adobe Creative Suite, Figma, Sketch, Canva, Procreate), design specializations (brand identity, UI/UX, print, motion graphics, packaging), and portfolio links. AI-assisted bullet points help you articulate the business impact of your design work — brand redesigns that lifted conversion rates, campaigns that drove engagement, style guides that scaled across 50+ touchpoints. All 23 templates are completely free — choose your style, customize with AI help, and export to PDF instantly. No credit card required.`,
  },
};

export function generateStaticParams() {
  return Object.keys(ROLES).map((slug) => ({ role: slug }));
}

export function generateMetadata({ params }: { params: { role: string } }): Metadata {
  const config = ROLES[params.role];
  if (!config) return {};
  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: `https://freefreecv.com/resume-templates/${config.slug}`,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `https://freefreecv.com/resume-templates/${config.slug}`,
    },
  };
}

export default function RoleTemplatePage({ params }: { params: { role: string } }) {
  const config = ROLES[params.role];
  if (!config) notFound();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <a href="/" className="text-lg font-black text-slate-900 hover:text-violet-600 transition-colors">
            FreeFreeCV
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px] font-black uppercase tracking-widest">
            100% Free · No Credit Card · No Sign-Up Required
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-[-0.03em]">
            {config.h1}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            {config.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/templates"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-black transition-all"
            >
              Build My Resume Free →
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
            >
              See All Templates
            </a>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-black text-slate-900">About This Template</h2>
          <p className="text-slate-600 text-base leading-relaxed">{config.intro}</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-3xl font-black text-slate-900 text-center">Why FreeFreeCV?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📝", title: "AI Summary Generator", desc: "Auto-generate a professional summary from your experience in seconds." },
              { icon: "📊", title: "ATS Score Checker", desc: "Score your resume 0–100 with specific tips to pass every ATS filter." },
              { icon: "🎯", title: "Job Description Matcher", desc: "See exactly which keywords you're missing from any job posting." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 space-y-3">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="font-black text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-black text-white">Ready to build your resume?</h2>
          <p className="text-slate-400">Free forever. No credit card. No sign-up required.</p>
          <a
            href="/templates"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all"
          >
            Start Building Free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} FreeFreeCV. The free AI resume builder for everyone.</p>
        <div className="flex justify-center gap-6 mt-3">
          <a href="/">Home</a>
          <a href="/templates">Templates</a>
          <a href="mailto:support@freefreecv.com">Contact</a>
        </div>
      </footer>
    </main>
  );
}
