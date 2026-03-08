# Homepage Redesign + SEO Strategy — Design Document
**Date:** 2026-03-08
**Status:** Approved

---

## Goal

Redesign freefreecv.com homepage to position it as an AI-first, Gen-Z modern SaaS tool that is genuinely free. Build a full SEO presence from zero: technical foundation, keyword landing pages, and a content/blog strategy.

---

## Visual Language

- **Style:** Gen-Z modern SaaS, minimalist medium. Reference: Linear.app meets Perplexity.ai.
- **Typography:** `font-black` headings, tight letter-spacing, oversized numbers + small ALL-CAPS labels.
- **Palette:** Near-black `#0A0A0A` primary, white backgrounds, violet/indigo `#7C3AED` for AI elements only. No loud color blocks.
- **Motion:** Subtle — text reveals, gentle float, typewriter animation. No spinning carousels.
- **Cards:** `rounded-2xl`/`rounded-3xl`, light borders (`border-slate-100`), micro-shadows. Glassmorphism on floating elements.
- **One dark section** — the AI Features section uses `bg-[#0A0A0A]` for visual drama. All others are white or `slate-50`.

---

## Page Structure (10 Sections)

### 1. Navbar
- Logo left
- `Free Forever` badge center (pill, violet accent)
- Login link + `Start Free →` CTA button right
- Sticky, blur (`backdrop-blur-md`) on scroll

### 2. Hero
- **Free badge pill** above headline: `100% Free · No Credit Card · No Limits`
- **Headline:** `The AI Resume Builder That's Actually Free`
- **Subheadline:** `AI summaries, ATS scoring, job matching, 23 templates — no paywalls, no credit card, forever.`
- **Live AI Demo Widget** (key differentiator):
  - Text input: placeholder `"Paste a bullet point or job title..."`
  - `Enhance with AI →` button
  - Output appears with typewriter animation below
  - No auth required — use 3 rotating pre-written before/after examples client-side, or call a new public `/api/demo-enhance` route (no rate limit by user, rate limit by IP)
  - Label: `✨ Try it — no sign-up needed`
- **Two CTAs:** `Build My Resume →` (black filled, `h-14`) + `See Templates` (ghost)
- **Stats strip:** `23 Templates · 4 AI Tools · 48% Higher Hire Rate · 100% Free`
- **Right column:** Existing AI dashboard mockup (keep as-is — strong visual)
- **Social proof avatars** stay below CTAs

### 3. Trusted-by Strip
- Same company logos (Google, Microsoft, Amazon, Apple, Uber, Netflix)
- Add a live-counting number: `{count}+ resumes built` (starts at 700, animates up on scroll)
- Subtle border top/bottom, `opacity-50` logos

### 4. AI Features — "Built Different" (Dark Section)
- Background: `#0A0A0A` — only dark section on page
- Section label: `AI-POWERED` in violet pill
- Headline (white): `Built Different.`
- Subheadline (slate-400): `Four AI tools that do the heavy lifting for you.`
- 4 cards in a 2×2 grid (mobile: stacked):
  - Light-on-dark style: `bg-white/5 border border-white/10`
  - Each card: small animated icon + feature name + 1-line description
  - Features: AI Summary Generator · Smart Skill Suggestions · ATS Score Checker · Job Description Matcher
- Bottom of section: `All of this. Free.` — massive white type, centered, `text-6xl font-black`

### 5. Template Gallery
- Headline: `23 Templates. Zero Cost.`
- **Category filter tabs:** All · ATS · Modern · Professional (client-side filter, no navigation)
- **12 templates shown** in a `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` grid
- Each card: template preview via ScaleWrapper + name + category tag
- Hover state: overlay with `Use Free →` text
- `View All 23 Templates →` button below

### 6. How It Works
- Headline: `Resume done in minutes, not hours.`
- **Horizontal timeline** on desktop (3 steps with connecting line), vertical on mobile
- Steps: Choose Template → Fill with AI Help → Download PDF
- Each step: large number, icon, title, 1-sentence description
- CTA below: `Start Building Free →`

### 7. Testimonials
- Headline: `Real people. Real results.`
- **4 testimonials** in a `grid-cols-1 md:grid-cols-2` layout (2×2)
- Each card: quote, stars, name, role, small `Verified User` badge
- Add a 4th testimonial: Marcus T. / Data Analyst / "The ATS scorer caught 6 missing keywords. Fixed them in 5 minutes and got a callback the same week."

### 8. SEO Content Block (below fold, crawlable)
- Visually subtle — white background, normal text weight, `max-w-3xl mx-auto`
- Heading: `Why FreeFreeCV?`
- 4 paragraphs (~400 words total) of keyword-rich content:
  - Para 1: What a free ATS resume builder means and why it matters
  - Para 2: How AI resume writing works and improves outcomes
  - Para 3: Why 23 templates cover every role and industry
  - Para 4: Comparison note (without naming competitors) — "Unlike tools that charge $20/month..."
- Target keywords woven naturally: "free resume builder", "ATS resume", "AI resume writer", "resume templates free", "ATS-friendly resume"

### 9. Final CTA Band
- Full-width, dark background (`#0A0A0A`)
- Headline (white): `Your next job is one resume away.`
- Subtext (slate-400): `Join thousands of job seekers who built their resume free.`
- Single CTA: `Build My Resume — It's Free →` (violet background button)

### 10. Footer
- Logo + tagline: `The free AI resume builder for everyone.`
- Links: Templates · Blog (placeholder) · Free Resume Templates · Privacy · Terms · Contact
- Copyright line

---

## SEO Strategy

### Phase 1 — Technical Foundation (implement immediately)

**Files to create/modify:**

1. **`src/app/sitemap.ts`** — Next.js App Router sitemap
   - Static routes: `/`, `/templates`, `/auth/login`, `/auth/signup`
   - Dynamic routes: all template landing pages (once created)

2. **`src/app/robots.ts`** — robots.txt
   - Allow all, point to sitemap

3. **`src/app/layout.tsx`** — Add to `<head>`:
   - JSON-LD structured data: `WebApplication` schema
   - Open Graph tags: title, description, image (`og:image` — a screenshot of the homepage)
   - Twitter card tags
   - Canonical URL

4. **Homepage SSR** — Extract static sections to a Server Component wrapper so Googlebot sees full HTML content (the current `"use client"` page renders blank HTML to crawlers).

5. **`public/og-image.png`** — A 1200×630 social share image (design: dark background, FreeFreeCV logo, "Free AI Resume Builder" text)

### Phase 2 — SEO Landing Pages (1 per week, 10 total)

Create `src/app/resume-templates/[role]/page.tsx` — server-rendered, keyword-targeted:

| URL | Target Keyword | Monthly Searches |
|-----|---------------|-----------------|
| `/resume-templates/software-engineer` | free resume template software engineer | 8,100/mo |
| `/resume-templates/product-manager` | free resume template product manager | 3,600/mo |
| `/resume-templates/fresher` | free resume template for freshers | 12,000/mo |
| `/resume-templates/data-analyst` | free resume template data analyst | 4,400/mo |
| `/resume-templates/ats` | free ATS resume template | 6,600/mo |
| `/resume-builder/no-sign-up` | free resume builder no sign up | 5,400/mo |
| `/resume-templates/marketing` | free resume template marketing | 2,900/mo |
| `/resume-templates/nurse` | free resume template nurse | 3,200/mo |
| `/resume-templates/teacher` | free resume template teacher | 4,100/mo |
| `/resume-templates/designer` | free resume template graphic designer | 2,700/mo |

Each page: H1 with keyword, 200-word intro, template gallery filtered by relevance, internal link to builder.

### Phase 3 — Blog (month 2+)

Create `src/app/blog/` with static MDX posts. Target informational keywords:

1. "How to write a software engineer resume in 2026" (6,600/mo)
2. "Why your resume gets rejected by ATS (and how to fix it)" (4,400/mo)
3. "Best free resume builders compared 2026" (8,100/mo)
4. "How to tailor your resume to a job description" (3,600/mo)
5. "Resume skills section: what to include and what to avoid" (2,900/mo)
6. "How to write a resume with no experience" (12,000/mo)
7. "Action verbs for resume: 200 examples by industry" (5,400/mo)
8. "ATS resume format: the complete guide" (4,100/mo)
9. "How to write a professional summary for a resume" (6,600/mo)
10. "Resume length: one page or two?" (3,200/mo)

### Backlink Strategy

- **Product Hunt launch** — submit with "Free AI Resume Builder" tagline
- **Hacker News "Show HN"** — angle: "I built a free AI resume builder with no paywalls"
- **BetaList, AlternativeTo, Slant** — directory listings
- **Reddit** — share in r/resumes, r/cscareerquestions, r/jobs with the live AI demo
- **The AI demo widget** — shareable/embeddable, earns natural backlinks

---

## Implementation Order

1. Homepage redesign (page.tsx + new public demo API endpoint)
2. Technical SEO (sitemap, robots, JSON-LD, OG tags, SSR wrapper)
3. SEO landing pages (role-specific template pages)
4. Blog infrastructure (MDX setup)
5. Blog articles (ongoing)
