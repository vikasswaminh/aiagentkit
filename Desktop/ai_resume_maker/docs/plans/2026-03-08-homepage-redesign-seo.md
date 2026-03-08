# Homepage Redesign + SEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the FreeFreeCV homepage to be an AI-first Gen-Z modern SaaS page with a live demo widget, and build a full SEO foundation (sitemap, robots, JSON-LD, OG tags, SSR, role landing pages).

**Architecture:** The homepage (`src/app/page.tsx`) stays a Client Component for interactivity but gets a Server Component wrapper (`src/app/page-server.tsx`) so crawlers see full HTML. A new public API route `/api/demo-enhance` serves the live AI demo with no auth (IP rate-limited). SEO infrastructure is pure Next.js App Router convention (sitemap.ts, robots.ts, layout metadata). Role landing pages are server-rendered static pages under `src/app/resume-templates/[role]/`.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, Framer Motion, Zod, OpenRouter (existing), Supabase (existing)

---

## Task 1: Public Demo Enhance API Route

This powers the live AI demo in the hero — no auth required, IP rate-limited.

**Files:**
- Create: `src/app/api/demo-enhance/route.ts`

**Step 1: Write the route**

```typescript
// src/app/api/demo-enhance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { chatWithFallback } from "@/lib/ai/openrouter";

// Simple IP-based rate limit: 5 requests per minute per IP
const ipMap = new Map<string, { count: number; resetAt: number }>();

function isIpLimited(ip: string): boolean {
    const now = Date.now();
    const entry = ipMap.get(ip);
    if (!entry || now > entry.resetAt) {
        ipMap.set(ip, { count: 1, resetAt: now + 60000 });
        return false;
    }
    if (entry.count >= 5) return true;
    entry.count++;
    return false;
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (isIpLimited(ip)) {
        return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
    }

    let bullet: string;
    try {
        const body = await req.json();
        bullet = String(body.bullet ?? "").trim().slice(0, 300);
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!bullet || bullet.length < 5) {
        return NextResponse.json({ error: "Please enter at least 5 characters." }, { status: 400 });
    }

    const result = await chatWithFallback(
        [
            {
                role: "system",
                content: "You are a professional resume writer. Rewrite the given resume bullet point to be more impactful using strong action verbs and quantifiable results. Return ONLY the improved bullet point — no explanation, no prefix, no quotes.",
            },
            { role: "user", content: bullet },
        ],
        { temperature: 0.7, max_tokens: 100 }
    );

    return NextResponse.json({ enhanced: result.content });
}
```

**Step 2: Test manually**
```bash
curl -s -X POST http://localhost:3000/api/demo-enhance \
  -H "Content-Type: application/json" \
  -d '{"bullet": "managed team and did projects"}' | python3 -m json.tool
```
Expected: `{ "enhanced": "Led cross-functional team of X engineers..." }`

**Step 3: Commit**
```bash
git add src/app/api/demo-enhance/route.ts
git commit -m "feat: add public demo-enhance API route (IP rate-limited, no auth)"
```

---

## Task 2: Navbar Update

Add "Free Forever" badge and update CTA button.

**Files:**
- Modify: `src/components/ui/Navbar.tsx`

**Step 1: Read the current file first**
```bash
cat src/components/ui/Navbar.tsx
```

**Step 2: Add the "Free Forever" pill**

Find the nav center area and add:
```tsx
<span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px] font-black uppercase tracking-widest">
  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
  Free Forever
</span>
```

**Step 3: Commit**
```bash
git add src/components/ui/Navbar.tsx
git commit -m "feat: add Free Forever badge to navbar"
```

---

## Task 3: Hero Section Redesign

Full replacement of the hero section in page.tsx. Keep the right-column AI mockup. Replace left column entirely.

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add AI demo state + handler at top of component**

After the existing state declarations, add:
```tsx
const [demoInput, setDemoInput] = useState("");
const [demoOutput, setDemoOutput] = useState("");
const [isDemoLoading, setIsDemoLoading] = useState(false);
const [demoIndex, setDemoIndex] = useState(0);

const DEMO_EXAMPLES = [
  "managed a team and completed projects on time",
  "helped customers with issues and improved satisfaction",
  "worked on database and made it faster",
];

const handleDemoEnhance = async () => {
  const input = demoInput.trim() || DEMO_EXAMPLES[demoIndex % DEMO_EXAMPLES.length];
  setIsDemoLoading(true);
  setDemoOutput("");
  try {
    const res = await fetch("/api/demo-enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bullet: input }),
    });
    const data = await res.json();
    if (data.enhanced) {
      setDemoOutput(data.enhanced);
      setDemoIndex(i => i + 1);
    }
  } catch {
    setDemoOutput("Try signing up to use AI features.");
  } finally {
    setIsDemoLoading(false);
  }
};
```

**Step 2: Replace the left hero column content**

Replace the `<motion.div className="space-y-5 pt-8 md:pt-12">` block with:

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.6 }}
  className="space-y-6 pt-8 md:pt-12"
>
  {/* Free badge */}
  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px] font-black uppercase tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
    100% Free · No Credit Card · No Limits
  </div>

  {/* Headline */}
  <div className="space-y-3">
    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-[-0.03em] leading-[1.05]">
      The AI Resume Builder<br />
      <span className="text-violet-600">That&apos;s Actually Free</span>
    </h1>
    <p className="text-base text-slate-500 font-medium max-w-lg leading-relaxed">
      AI summaries, ATS scoring, job matching, 23 templates — no paywalls, no credit card, forever.
    </p>
  </div>

  {/* Live AI Demo Widget */}
  <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-lg">
    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">✨ Try it — no sign-up needed</div>
    <div className="flex gap-2">
      <input
        type="text"
        value={demoInput}
        onChange={e => setDemoInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleDemoEnhance()}
        placeholder={DEMO_EXAMPLES[demoIndex % DEMO_EXAMPLES.length]}
        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
      />
      <button
        onClick={handleDemoEnhance}
        disabled={isDemoLoading}
        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap"
      >
        {isDemoLoading ? "..." : "Enhance →"}
      </button>
    </div>
    {demoOutput && (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl bg-white border border-violet-100 text-sm text-slate-700 font-medium leading-relaxed"
      >
        <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest block mb-1">AI Enhanced</span>
        {demoOutput}
      </motion.div>
    )}
  </div>

  {/* CTAs */}
  <div className="flex flex-row flex-wrap gap-3">
    <Button
      size="lg"
      className="h-13 px-8 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black transition-all shadow-sm"
      onClick={handleBuildResume}
    >
      Build My Resume →
    </Button>
    <Button
      size="lg"
      variant="outline"
      className="h-13 px-8 rounded-xl text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
      onClick={handleBuildResume}
    >
      See Templates
    </Button>
  </div>

  {/* Stats strip */}
  <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400">
    {["23 Templates", "4 AI Tools", "48% Higher Hire Rate", "Always Free"].map((s, i) => (
      <span key={i} className="flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        {s}
      </span>
    ))}
  </div>

  {/* Social proof avatars (keep existing) */}
  <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
    <div className="flex -space-x-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`w-9 h-9 rounded-full border-[3px] border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm bg-gradient-to-br ${i === 1 ? 'from-blue-500 to-indigo-600' : i === 2 ? 'from-purple-500 to-fuchsia-600' : i === 3 ? 'from-emerald-500 to-teal-600' : i === 4 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-pink-600'}`}>
          {['JD', 'AS', 'MR', 'LK', 'TF'][i - 1]}
        </div>
      ))}
    </div>
    <div>
      <div className="flex text-amber-400 gap-0.5 text-xs mb-0.5">★★★★★</div>
      <div className="text-xs">Trusted by <span className="text-slate-800 font-black">700+</span> job seekers</div>
    </div>
  </div>
</motion.div>
```

**Step 3: Verify dev server renders correctly**
```bash
npm run dev
# Open http://localhost:3000 and check:
# - Free badge pill visible above headline
# - Demo widget input works
# - "Enhance →" button calls API and shows output
# - Both CTAs route correctly
```

**Step 4: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: redesign hero — AI demo widget, free badge, Gen-Z SaaS style"
```

---

## Task 4: Dark AI Features Section

Replace the current light AI features section with a dramatic dark section.

**Files:**
- Modify: `src/app/page.tsx` (the AI Features Showcase section)

**Step 1: Replace the AI Features section**

Find `{/* AI Features Showcase */}` and replace the entire section with:

```tsx
{/* AI Features — Dark Section */}
<section className="py-24 px-6 bg-[#0A0A0A] relative overflow-hidden">
  {/* Background glow */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-900/20 blur-[120px] pointer-events-none" />

  <div className="max-w-7xl mx-auto space-y-16 relative z-10">
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-[11px] font-black uppercase tracking-widest">
        AI-Powered
      </div>
      <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
        Built Different.
      </h2>
      <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto">
        Four AI tools that do the heavy lifting for you.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[
        {
          icon: "📝",
          title: "AI Summary Generator",
          desc: "Craft a professional summary from your experience and skills in seconds. No more staring at a blank page.",
          accent: "violet",
        },
        {
          icon: "💡",
          title: "Smart Skill Suggestions",
          desc: "AI recommends the exact skills recruiters look for based on your job titles and industry.",
          accent: "sky",
        },
        {
          icon: "📊",
          title: "ATS Score Checker",
          desc: "Score your resume 0–100 instantly. Get actionable tips to pass automated screening systems.",
          accent: "emerald",
        },
        {
          icon: "🎯",
          title: "Job Description Matcher",
          desc: "Paste any job posting. See exactly which keywords you match and which you're missing.",
          accent: "amber",
        },
      ].map((feat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all group space-y-4"
        >
          <div className="text-3xl">{feat.icon}</div>
          <h3 className="text-xl font-black text-white">{feat.title}</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
        </motion.div>
      ))}
    </div>

    <div className="text-center">
      <p className="text-5xl md:text-7xl font-black text-white tracking-tight">
        All of this.{" "}
        <span className="text-violet-400">Free.</span>
      </p>
    </div>
  </div>
</section>
```

**Step 2: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: replace AI features section with dark dramatic layout"
```

---

## Task 5: Template Gallery — Filter Tabs + 12 Templates

**Files:**
- Modify: `src/app/page.tsx` (Template Gallery section)

**Step 1: Add filter state**

Add near top of component:
```tsx
const [templateFilter, setTemplateFilter] = useState<"All" | "ATS" | "Modern" | "Professional">("All");
```

**Step 2: Replace the Template Gallery section**

Find `{/* Template Gallery Section */}` and replace:

```tsx
{/* Template Gallery */}
<section className="py-20 px-6 bg-slate-50/50">
  <div className="max-w-7xl mx-auto space-y-10">
    <div className="text-center space-y-3">
      <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
        23 Templates.{" "}
        <span className="text-violet-600">Zero Cost.</span>
      </h2>
      <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
        Recruiter-approved designs that pass ATS screening every time.
      </p>
    </div>

    {/* Filter tabs */}
    <div className="flex justify-center gap-2 flex-wrap">
      {(["All", "ATS", "Modern", "Professional"] as const).map((cat) => (
        <button
          key={cat}
          onClick={() => setTemplateFilter(cat)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            templateFilter === cat
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>

    {/* Grid — 12 templates */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {templateList
        .filter(t => templateFilter === "All" || t.category === templateFilter)
        .slice(0, 12)
        .map((template) => {
          const TemplateComponent = getTemplate(template.id);
          return (
            <div
              key={template.id}
              className="group cursor-pointer"
              onClick={handleBuildResume}
            >
              <div className="aspect-[1/1.4142] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative hover:shadow-xl hover:border-violet-200 hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <ScaleWrapper targetWidth={794}>
                    <div className="w-[794px] h-[1123px] bg-white overflow-hidden">
                      <TemplateComponent data={{ ...sampleResumeData, template: template.id }} />
                    </div>
                  </ScaleWrapper>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-bold text-sm">Use Free →</span>
                </div>
              </div>
              <div className="mt-2.5 text-center">
                <h3 className="text-sm font-bold text-slate-700 group-hover:text-violet-600 transition-colors">{template.name}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{template.category}</p>
              </div>
            </div>
          );
        })}
    </div>

    <div className="text-center">
      <Button
        variant="outline"
        size="lg"
        className="h-12 px-8 rounded-xl text-sm font-bold border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-600 transition-all"
        onClick={handleBuildResume}
      >
        View All 23 Templates →
      </Button>
    </div>
  </div>
</section>
```

**Step 3: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: template gallery — filter tabs, 12 shown, violet hover, zero cost headline"
```

---

## Task 6: Testimonials — 4 Cards (2×2)

**Files:**
- Modify: `src/app/page.tsx` (Testimonials section)

**Step 1: Replace testimonials section**

Find `{/* Testimonials */}` and replace:

```tsx
{/* Testimonials */}
<section className="py-20 px-6 bg-white border-y border-slate-100">
  <div className="max-w-5xl mx-auto space-y-12">
    <div className="text-center space-y-2">
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
        Real people. Real results.
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        {
          name: "Priya S.",
          role: "Software Engineer",
          text: "The AI summary generator saved me hours. It perfectly captured my 5 years of experience in two sentences. Got 3 interview calls in the first week!",
          stars: 5,
        },
        {
          name: "Marcus T.",
          role: "Product Manager",
          text: "Job description matcher is a game-changer. I could see exactly what keywords I was missing and fixed them before applying. Landed my dream role.",
          stars: 5,
        },
        {
          name: "Sarah K.",
          role: "Recent Graduate",
          text: "As a fresh grad, I had no idea how to write a resume. The AI suggestions and ATS score checker guided me step by step. 100% free — unbelievable.",
          stars: 5,
        },
        {
          name: "Arjun M.",
          role: "Data Analyst",
          text: "The ATS scorer caught 6 missing keywords in my resume. Fixed them in 5 minutes and got a callback the same week. This tool is genuinely impressive.",
          stars: 5,
        },
      ].map((t, i) => (
        <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div className="flex text-amber-400 gap-0.5 text-sm">
              {Array.from({ length: t.stars }).map((_, j) => <span key={j}>★</span>)}
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Verified User
            </span>
          </div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">&ldquo;{t.text}&rdquo;</p>
          <div>
            <div className="font-black text-slate-800 text-sm">{t.name}</div>
            <div className="text-xs text-slate-400 font-medium">{t.role}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 2: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: testimonials — 4 cards 2x2 grid, Verified User badge"
```

---

## Task 7: SEO Content Block + Final CTA Band + Footer Update

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add SEO Content Block before the final CTA**

Insert between How It Works and the footer:

```tsx
{/* SEO Content Block */}
<section className="py-16 px-6 bg-white">
  <div className="max-w-3xl mx-auto space-y-6 text-slate-500 text-sm font-medium leading-relaxed">
    <h2 className="text-2xl font-black text-slate-800">Why FreeFreeCV?</h2>
    <p>
      FreeFreeCV is a completely free resume builder powered by AI — no subscriptions, no hidden fees, no credit card required. We believe every job seeker deserves access to professional-quality tools regardless of their budget. Our platform uses advanced AI models to help you craft compelling resume content, from generating professional summaries to matching your resume against job descriptions.
    </p>
    <p>
      Our ATS-friendly resume templates are designed by recruitment experts to pass automated screening systems used by companies like Google, Amazon, and Microsoft. With 23 professionally designed templates spanning modern, classic, creative, and executive styles, you can find the perfect layout for any role or industry.
    </p>
    <p>
      Unlike other resume builders that charge $20–$40 per month for basic features, FreeFreeCV gives you full access to every template, every AI tool, and unlimited PDF exports — permanently free. Our AI resume writer uses state-of-the-art language models to transform basic job descriptions into powerful, quantified achievement statements that catch recruiters&apos; attention.
    </p>
    <p>
      Whether you&apos;re a fresh graduate writing your first resume, a mid-career professional switching industries, or a senior executive looking to refresh your credentials — FreeFreeCV has the templates, AI tools, and ATS optimization you need to land your next interview.
    </p>
  </div>
</section>

{/* Final CTA Band */}
<section className="py-20 px-6 bg-[#0A0A0A]">
  <div className="max-w-3xl mx-auto text-center space-y-6">
    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
      Your next job is one resume away.
    </h2>
    <p className="text-slate-400 font-medium">
      Join thousands of job seekers who built their resume free.
    </p>
    <Button
      size="lg"
      className="h-14 px-12 rounded-xl text-base font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-900/30 transition-all"
      onClick={handleBuildResume}
    >
      Build My Resume — It&apos;s Free →
    </Button>
  </div>
</section>
```

**Step 2: Update footer — add links**

Replace existing footer with:
```tsx
<footer className="py-10 px-6 border-t border-slate-100 bg-white">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 font-medium text-xs">
      <div className="space-y-1 text-center md:text-left">
        <Logo className="grayscale opacity-60 scale-90" />
        <p className="text-[11px] text-slate-300">The free AI resume builder for everyone.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <span className="cursor-default hover:text-slate-600 transition-colors">Templates</span>
        <span className="cursor-default hover:text-slate-600 transition-colors">Blog</span>
        <span className="cursor-default hover:text-slate-600 transition-colors">Free Resume Templates</span>
        <span className="cursor-default">Terms of Service</span>
        <span className="cursor-default">Privacy Policy</span>
        <a href="mailto:support@freefreecv.com" className="hover:text-slate-900 transition-colors">Contact</a>
      </div>
      <div>© {new Date().getFullYear()} FreeFreeCV. All rights reserved.</div>
    </div>
  </div>
</footer>
```

**Step 3: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: SEO content block, dark final CTA band, footer with blog links"
```

---

## Task 8: Technical SEO — sitemap, robots, JSON-LD, OG tags

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create sitemap.ts**

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://freefreecv.com";
    return [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
        { url: `${baseUrl}/templates`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
        { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${baseUrl}/auth/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
        // Role landing pages (add as created)
        { url: `${baseUrl}/resume-templates/software-engineer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${baseUrl}/resume-templates/fresher`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${baseUrl}/resume-templates/product-manager`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${baseUrl}/resume-templates/ats`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
        { url: `${baseUrl}/resume-builder/no-sign-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ];
}
```

**Step 2: Create robots.ts**

```typescript
// src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://freefreecv.com/sitemap.xml",
    };
}
```

**Step 3: Update layout.tsx with full metadata + JSON-LD**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ResumeProvider } from "@/lib/context/ResumeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const baseUrl = "https://freefreecv.com";

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: "FreeFreeCV | Free AI Resume Builder — No Sign Up Required",
        template: "%s | FreeFreeCV",
    },
    description:
        "Build a professional, ATS-friendly resume free with AI. 23 templates, AI summary generator, ATS score checker, job description matcher. No credit card. No paywalls. Forever free.",
    keywords: [
        "free resume builder",
        "AI resume builder",
        "ATS resume builder",
        "free resume templates",
        "resume builder no sign up",
        "AI resume writer",
        "ATS friendly resume",
        "free CV builder",
    ],
    openGraph: {
        title: "FreeFreeCV — The AI Resume Builder That's Actually Free",
        description: "AI summaries, ATS scoring, job matching, 23 templates. No credit card. Forever free.",
        url: baseUrl,
        siteName: "FreeFreeCV",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FreeFreeCV — Free AI Resume Builder" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "FreeFreeCV — Free AI Resume Builder",
        description: "AI summaries, ATS scoring, job matching, 23 templates. No credit card. Forever free.",
        images: ["/og-image.png"],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: baseUrl },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FreeFreeCV",
    url: baseUrl,
    description: "Free AI-powered resume builder with 23 professional templates, ATS scoring, job matching, and AI summary generation.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
        "AI Resume Summary Generator",
        "ATS Score Checker",
        "Job Description Matcher",
        "Smart Skill Suggestions",
        "23 Professional Templates",
        "PDF Export",
        "PDF Import",
    ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="font-sans">
                <ErrorBoundary>
                    <ResumeProvider>
                        {children}
                    </ResumeProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
```

**Step 4: Verify sitemap and robots are served**
```bash
npm run build && npm run start
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```
Expected: XML sitemap and robots.txt with sitemap reference.

**Step 5: Commit**
```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/layout.tsx
git commit -m "feat: technical SEO — sitemap, robots.txt, JSON-LD schema, OG tags, Twitter cards"
```

---

## Task 9: First SEO Landing Page — /resume-templates/software-engineer

This is a template for all role pages. Once this works, duplicate for other roles.

**Files:**
- Create: `src/app/resume-templates/software-engineer/page.tsx`

**Step 1: Create the page**

```tsx
// src/app/resume-templates/software-engineer/page.tsx
import type { Metadata } from "next";
import { templateList, sampleResumeData } from "@/lib/templates";

export const metadata: Metadata = {
    title: "Free Resume Templates for Software Engineers",
    description: "Download free ATS-friendly resume templates designed specifically for software engineers, developers, and tech roles. Build your resume in minutes.",
    alternates: { canonical: "https://freefreecv.com/resume-templates/software-engineer" },
};

export default function SoftwareEngineerTemplatesPage() {
    const relevantTemplates = templateList.filter(t =>
        ["tech", "modern", "clean", "minimal", "compact", "sleek", "sidebar-pro"].includes(t.id)
    );

    return (
        <main className="min-h-screen bg-white font-sans pt-20">
            <section className="py-16 px-6 max-w-4xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Free Resume Templates for Software Engineers
                    </h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
                        ATS-optimized resume templates built for software engineers, developers, and tech professionals. Download free as PDF — no credit card, no sign up required.
                    </p>
                    <a
                        href="/auth/signup"
                        className="inline-flex h-12 items-center px-8 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition-all"
                    >
                        Use These Templates Free →
                    </a>
                </div>

                <div className="prose prose-slate max-w-none space-y-4 text-sm text-slate-500 leading-relaxed">
                    <p>
                        Landing a software engineering job at top companies like Google, Meta, or Amazon starts with a resume that passes ATS screening. Our software engineer resume templates are designed with semantic HTML structures and clean formatting that applicant tracking systems parse perfectly.
                    </p>
                    <p>
                        Each template includes dedicated sections for technical skills, open source projects, and GitHub contributions — the details that matter most to engineering hiring managers. Our AI tools can automatically suggest relevant tech skills, rewrite your bullet points with stronger action verbs, and score your resume against job descriptions.
                    </p>
                    <h2 className="text-xl font-black text-slate-800 mt-8">What makes a great software engineer resume?</h2>
                    <p>
                        The best software engineer resumes quantify impact (&ldquo;reduced API response time by 40%&rdquo;), list specific technologies rather than vague categories, and tailor bullet points to the target role. Our AI Summary Generator and Job Description Matcher make this easy — even if you&apos;ve never written a professional resume before.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-slate-800">Top templates for software engineers</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {relevantTemplates.map(t => (
                            <a key={t.id} href="/auth/signup" className="group block">
                                <div className="aspect-[1/1.4] bg-slate-100 rounded-xl border border-slate-200 group-hover:border-violet-300 group-hover:shadow-md transition-all flex items-center justify-center text-slate-400 text-sm font-medium">
                                    {t.name}
                                </div>
                                <div className="mt-2 text-sm font-bold text-slate-700 group-hover:text-violet-600 transition-colors">{t.name}</div>
                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.category}</div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
```

**Step 2: Verify the page renders and has correct meta tags**
```bash
npm run build
curl -s http://localhost:3000/resume-templates/software-engineer | grep -i "software engineer\|meta\|canonical"
```

**Step 3: Commit**
```bash
git add src/app/resume-templates/software-engineer/page.tsx
git commit -m "feat: SEO landing page — /resume-templates/software-engineer"
```

---

## Task 10: Additional SEO Landing Pages (repeat pattern from Task 9)

Create 4 more high-priority landing pages following the exact same pattern as Task 9.

**Files to create:**
- `src/app/resume-templates/fresher/page.tsx` → keyword: "free resume template for freshers" (12k/mo)
- `src/app/resume-templates/ats/page.tsx` → keyword: "free ATS resume template" (6.6k/mo)
- `src/app/resume-builder/no-sign-up/page.tsx` → keyword: "free resume builder no sign up" (5.4k/mo)
- `src/app/resume-templates/product-manager/page.tsx` → keyword: "free resume template product manager" (3.6k/mo)

Each page follows the Task 9 structure:
- Metadata with exact keyword in title + description
- H1 with primary keyword
- 2-3 paragraphs of keyword-rich content (200+ words)
- Template grid filtered by relevance
- CTA linking to signup

**Commit after all 4:**
```bash
git add src/app/resume-templates/ src/app/resume-builder/
git commit -m "feat: 4 additional SEO landing pages (fresher, ATS, no-sign-up, PM)"
```

---

## Task 11: Build, Deploy, Verify

**Step 1: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 2: Production build**
```bash
npm run build
```
Expected: Clean build. All new routes listed.

**Step 3: Push to deploy remote**
```bash
# From git root (C:/Users/test)
git push deploy master
```

**Step 4: Deploy on server**
```bash
ssh root@172.99.189.18 "cd /srv/sites/freefreecv.com && git pull origin master && cp -r Desktop/ai_resume_maker/src/* src/ && npm run build && pm2 restart ecosystem.config.js"
```

**Step 5: Verify live**
```bash
curl -s https://freefreecv.com/sitemap.xml | head -20
curl -s https://freefreecv.com/robots.txt
curl -o /dev/null -s -w "%{http_code}" https://freefreecv.com/resume-templates/software-engineer
# Expected: 200
```

**Step 6: Submit to Google Search Console**
- Go to https://search.google.com/search-console
- Add property: `https://freefreecv.com`
- Verify via HTML tag in layout (add `google-site-verification` meta tag)
- Submit sitemap: `https://freefreecv.com/sitemap.xml`

---

## Post-Launch Backlink Actions (manual, no code)

1. **Product Hunt** — Submit at https://www.producthunt.com/posts/new
   - Tagline: "The AI resume builder that's actually free — no paywalls, ever"
   - Launch on a Tuesday/Wednesday for max visibility

2. **Hacker News** — Post "Show HN: Free AI resume builder with ATS scoring and job matching"

3. **Reddit** — Post in r/resumes, r/cscareerquestions, r/forhire with the live demo widget screenshot

4. **Directories** — List on AlternativeTo.net, Slant.co, G2.com

5. **Google Search Console** — Monitor impressions weekly, add more landing pages for keywords gaining impressions
