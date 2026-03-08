"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Navbar } from "@/components/ui/Navbar";
import { Logo } from "@/components/ui/Logo";
import { ImportResumeModal } from "@/components/dashboard/ImportResumeModal";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ScaleWrapper } from "@/components/ui/ScaleWrapper";
import { templateList, sampleResumeData } from "@/lib/templates";
import { getTemplate } from "@/lib/templates/registry";

const DEMO_EXAMPLES = [
  "managed a team and completed projects on time",
  "helped customers with issues and improved satisfaction",
  "worked on database and made it faster",
];

export default function LandingPage() {
  const router = useRouter();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [demoInput, setDemoInput] = useState("");
  const [demoOutput, setDemoOutput] = useState("");
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [templateCategory, setTemplateCategory] = useState<string>("All");

  // Auto-cycle placeholder every 3 seconds when input is empty
  useEffect(() => {
    const interval = setInterval(() => {
      if (!demoInput) {
        setDemoIndex(i => (i + 1) % DEMO_EXAMPLES.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [demoInput]);

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
      if (!res.ok) {
        setDemoOutput("Enhancement failed. Please try again.");
        return;
      }
      const data = await res.json();
      if (data.enhanced) {
        setDemoOutput(data.enhanced);
        setDemoIndex(i => (i + 1) % DEMO_EXAMPLES.length);
      }
    } catch {
      setDemoOutput("Enhancement failed. Please try again.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Handler for Build My Resume button
  const handleBuildResume = () => {
    if (!user) {
      router.push("/auth/login?redirect=/templates");
    } else {
      router.push("/templates");
    }
  };

  // Handler for Import Existing Resume button
  const handleImportResume = () => {
    if (!user) {
      router.push("/auth/login?redirect=/dashboard");
    } else {
      setIsImportModalOpen(true);
    }
  };

  const features = [
    {
      icon: "🎯",
      title: "ATS Optimized",
      desc: "Built with industry-standard semantic structures to breeze through Applicant Tracking Systems.",
    },
    {
      icon: "✨",
      title: "AI Optimization",
      desc: "Turn basic job duties into powerful achievement statements with our intelligent suggestion engine.",
    },
    {
      icon: "🎨",
      title: "Premium Designs",
      desc: "Access a curated collection of modern templates designed by recruitment experts for maximum impact.",
    },
    {
      icon: "⚡",
      title: "Instant Export",
      desc: "Generate and download your resume in high-fidelity PDF format in seconds, ready for submission.",
    },
    {
      icon: "🔄",
      title: "AI Import",
      desc: "Already have a resume? Upload your PDF and our AI will automatically extract and structure your data in seconds.",
    },
    {
      icon: "☁️",
      title: "Secure Cloud",
      desc: "Your data is encrypted and saved in the cloud. Access, edit, and update your resumes anywhere.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden font-['Inter',sans-serif] pt-[100px]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-6 pt-2 md:pt-6 pb-4 overflow-hidden">
        {/* Abstract background light */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
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
                  aria-label="Resume bullet to enhance"
                  value={demoInput}
                  onChange={e => setDemoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isDemoLoading && handleDemoEnhance()}
                  placeholder={DEMO_EXAMPLES[demoIndex % DEMO_EXAMPLES.length]}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
                />
                <button
                  type="button"
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
                className="h-14 px-8 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black transition-all shadow-sm"
                onClick={handleBuildResume}
              >
                Build My Resume →
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 rounded-xl text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                onClick={() => router.push("/templates")}
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

            {/* Social proof avatars */}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Main Resume Mockup */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 overflow-hidden group">
              <div className="w-full aspect-[3/4.2] bg-slate-50 rounded-lg overflow-hidden flex flex-col">
                {/* AI Insight Dashboard Visualization */}
                <div className="w-full h-full bg-white p-8 flex flex-col gap-8 relative overflow-hidden">
                  {/* Circular Analysis Animation */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-20 -right-20 w-64 h-64 border-[32px] border-neutral-200 rounded-full pointer-events-none"
                  />

                  {/* Dashboard Header - Score Gauge */}
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <motion.circle
                          cx="64" cy="64" r="56" fill="none" stroke="#111111" strokeWidth="10" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 360" }}
                          animate={{ strokeDasharray: "310 360" }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                        
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800">92%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Strength</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-6 w-40 bg-slate-900 rounded-lg" />
                      <div className="h-3 w-24 bg-primary/20 rounded-full" />
                      <div className="flex gap-2 pt-2">
                        <div className="px-2 py-1 bg-neutral-100 text-neutral-700 text-[10px] font-black rounded-md border border-emerald-100 italic">Excellent Match</div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                      { label: "Impact Score", val: "High", color: "text-emerald-500" },
                      { label: "Keyword Density", val: "88%", color: "text-neutral-900" },
                      { label: "Action Verbs", val: "Optimal", color: "text-neutral-900" },
                      { label: "Layout Flow", val: "Perfect", color: "text-neutral-900" }
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</div>
                        <div className={`text-sm font-black ${m.color}`}>{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Real-time Insights List */}
                  <div className="space-y-4 relative z-10">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
                      Section Analysis
                    </div>
                    <div className="space-y-3">
                      {[
                        { text: "Strong quantifiable achievements detected", status: "win" },
                        { text: "Optimized for Engineering Management roles", status: "match" },
                        { text: "Formatting consistent across all sections", status: "win" },
                        { text: "Contact information validation passed", status: "win" },
                        { text: "Detected 4 missing industry keywords", status: "fix" }
                      ].map((insight, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs font-medium text-slate-600">
                          {insight.status === 'fix' ? (
                            <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold">!</div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">✓</div>
                          )}
                          {insight.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF/DOCX floating icons */}
              <div className="absolute top-8 right-8 flex flex-col gap-3 z-30">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[10px] font-black text-rose-500 border border-slate-50 hover:scale-110 transition-transform cursor-pointer">PDF</div>
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[10px] font-black text-sky-500 border border-slate-50 hover:scale-110 transition-transform cursor-pointer">DOCX</div>
              </div>

              {/* ATS Perfect Badge */}
              <div className="absolute bottom-12 left-8 px-5 py-2.5 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-3 text-accent font-black text-xs uppercase tracking-widest shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                ATS Optimized
              </div>

              {/* AI Suggestions floating card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-8 max-w-[280px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 border border-slate-50 space-y-4 z-20"
              >
                <div className="flex items-center gap-2 text-neutral-900 font-black text-xs uppercase tracking-widest">
                  ✨ AI Suggestions
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 text-xs text-slate-500 font-medium leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-sky-50 flex-shrink-0 flex items-center justify-center text-neutral-900 font-bold">→</div>
                    Optimized cloud infrastructure...
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 font-medium leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-sky-50 flex-shrink-0 flex items-center justify-center text-neutral-900 font-bold">→</div>
                    Architected robust API layers...
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Background glowing circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-sky-200/20 rounded-full blur-[80px] pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="py-10 border-y border-slate-100 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Trusted by professionals at</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center opacity-50">
            {[
              { name: "Google", font: "font-['Product_Sans',sans-serif] tracking-tight" },
              { name: "Microsoft", font: "font-['Segoe_UI',sans-serif] font-semibold tracking-tight" },
              { name: "Amazon", font: "font-['Amazon_Ember',sans-serif] font-bold tracking-tight" },
              { name: "Apple", font: "font-['SF_Pro',sans-serif] font-medium tracking-tight" },
              { name: "Uber", font: "font-['UberMove',sans-serif] font-bold tracking-tighter" },
              { name: "Netflix", font: "font-['Netflix_Sans',sans-serif] font-bold tracking-wide" },
            ].map((co) => (
              <span key={co.name} className={`text-xl text-slate-600 ${co.font}`}>{co.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
              Tools to <span className="text-neutral-900">elevate your career</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Everything you need to craft a professional resume that gets you noticed by top-tier recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/30 hover:shadow-2xl hover:shadow-sky-100 transition-all group border-b-4 border-b-transparent hover:border-b-primary"
              >
                <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Template Gallery */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-[-0.03em]">
              23 Templates. <span className="text-violet-600">Zero Cost.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Recruiter-approved designs built to pass every ATS. Pick one and start building in seconds.
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {["All", "ATS", "Modern", "Professional"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTemplateCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  templateCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(templateCategory === "All"
              ? templateList
              : templateList.filter(t => t.category === templateCategory)
            ).slice(0, 12).map((template) => {
              const TemplateComponent = getTemplate(template.id);
              return (
                <div
                  key={template.id}
                  className="group cursor-pointer"
                  onClick={handleBuildResume}
                >
                  <div className="aspect-[1/1.4142] bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden relative hover:shadow-xl hover:border-violet-200 hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <ScaleWrapper targetWidth={794}>
                        <div className="w-[794px] h-[1123px] bg-white overflow-hidden">
                          <TemplateComponent data={{ ...sampleResumeData, template: template.id }} />
                        </div>
                      </ScaleWrapper>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white font-bold text-sm">Use Free →</span>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <h3 className="text-sm font-bold text-slate-700 group-hover:text-violet-600 transition-colors">{template.name}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{template.category}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
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

      {/* AI Features — "Built Different." (Dark Section) */}
      <section className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-[11px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              AI-Powered
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-[-0.03em]">
              Built Different.
            </h2>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
              Four AI tools that do the heavy lifting for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: "📝",
                title: "AI Summary Generator",
                desc: "Auto-generate a professional summary from your experience, skills, and education. No blank-page anxiety.",
              },
              {
                icon: "💡",
                title: "Smart Skill Suggestions",
                desc: "Get AI-recommended skills based on your job titles and industry to maximize ATS keyword coverage.",
              },
              {
                icon: "📊",
                title: "ATS Score Checker",
                desc: "Instantly score your resume 0–100 with specific, actionable tips to improve every section.",
              },
              {
                icon: "🎯",
                title: "Job Description Matcher",
                desc: "Paste any job posting and see exactly which keywords you're missing — and how to add them.",
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4 hover:bg-white/8 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-black text-white">{feat.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-6xl md:text-8xl font-black text-white tracking-[-0.04em]">
              All of this. Free.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-[-0.03em]">
              Real people. Real results.
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Join thousands who landed jobs with FreeFreeCV.
            </p>
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
                text: "Job description matcher is a game-changer. I could see exactly what keywords I was missing and fix them before applying. Landed my dream role.",
                stars: 5,
              },
              {
                name: "Sarah K.",
                role: "Recent Graduate",
                text: "As a fresh grad, I had no idea how to write a resume. The AI suggestions and ATS score checker guided me step by step. 100% free — unbelievable.",
                stars: 5,
              },
              {
                name: "Marcus T.",
                role: "Data Analyst",
                text: "The ATS scorer caught 6 missing keywords. Fixed them in 5 minutes and got a callback the same week.",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 gap-0.5 text-sm">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j}>★</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 rounded-full px-2.5 py-0.5">
                    Verified User
                  </span>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
              Create your job-winning <span className="text-neutral-900 border-b-4 border-primary/20">resume in 3 simple steps</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-10 top-12 bottom-12 w-0.5 bg-slate-200 hidden md:block" />

            <div className="space-y-16">
              {[
                {
                  step: "STEP 1",
                  icon: "📚",
                  title: "Choose a stylish template",
                  desc: "Select one of the recruiter-approved resume templates designed specifically to always make it past the screening stage."
                },
                {
                  step: "STEP 2",
                  icon: "✍️",
                  title: "Customize each resume section",
                  desc: "Add details about your experience, education, and skills with one click. Need more sections? We've got plenty."
                },
                {
                  step: "STEP 3",
                  icon: "📥",
                  title: "Download your resume in seconds",
                  desc: "You've saved hours on resume creation—now use that extra time to prepare for job interviews and shine on them."
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative flex items-start gap-8 md:gap-12"
                >
                  <div className="relative z-10 w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl border border-slate-50 flex-shrink-0">
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                      {i + 1}
                    </span>
                    {item.icon}
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-black text-neutral-900 uppercase tracking-[0.2em]">{item.step}</div>
                    <h3 className="text-2xl font-bold text-slate-800">{item.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-20 flex justify-start md:ml-32"
            >
              <Button
                size="lg"
                className="h-14 px-12 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 cursor-pointer"
                onClick={handleBuildResume}
              >
                Create My Resume Now
              </Button>
            </motion.div>
          </div>
        </div>
      </section>




      {/* SEO Content Block */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto space-y-6 text-slate-600 text-base leading-relaxed">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Why FreeFreeCV?</h2>
          <p>
            A free ATS resume builder means your resume is formatted to pass Applicant Tracking Systems — the software that filters out 75% of resumes before a human ever sees them. FreeFreeCV generates ATS-friendly resumes automatically, using semantic structure, proper heading hierarchy, and keyword density that modern ATS engines score highly.
          </p>
          <p>
            AI resume writing has changed the game for job seekers. Instead of spending hours crafting bullet points from scratch, our AI analyzes your job titles, experience, and skills to generate impactful, quantified statements that hiring managers notice. Studies show ATS-optimized resumes with strong action verbs and measurable results are 48% more likely to get a callback.
          </p>
          <p>
            With 23 professionally designed resume templates free to use, FreeFreeCV covers every role and industry — from software engineering to nursing, marketing to data science. Each template is crafted to balance visual appeal with ATS compatibility, so you never have to choose between a beautiful resume and one that gets through the filter.
          </p>
          <p>
            Unlike tools that charge $20/month for basic features or hide templates behind a paywall, FreeFreeCV gives you everything — AI summaries, skill suggestions, ATS scoring, job matching, and instant PDF export — completely free, forever. No credit card, no trial period, no catch.
          </p>
        </div>
      </section>

      {/* Final CTA Band */}
      <section className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-[-0.03em]">
            Your next job is one resume away.
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Join thousands of job seekers who built their resume free.
          </p>
          <Button
            size="lg"
            className="h-14 px-10 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-lg shadow-violet-900/30"
            onClick={handleBuildResume}
          >
            Build My Resume — It&apos;s Free →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 font-medium text-xs">
          <div className="space-y-1 text-center md:text-left">
            <Logo className="grayscale opacity-60 scale-90" />
            <p className="text-xs text-slate-400">The free AI resume builder for everyone.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={handleBuildResume}>Templates</span>
            <span className="cursor-default text-slate-300">Blog (coming soon)</span>
            <span className="cursor-default">Terms of Service</span>
            <span className="cursor-default">Privacy Policy</span>
            <a href="mailto:support@freefreecv.com" className="hover:text-neutral-900 transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} FreeFreeCV. All rights reserved.</div>
        </div>
      </footer>
      <ImportResumeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </main >
  );
}
