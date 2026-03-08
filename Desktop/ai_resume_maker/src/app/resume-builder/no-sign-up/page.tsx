import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Resume Builder — No Sign-Up Required | FreeFreeCV",
  description:
    "Build a professional, ATS-friendly resume with no account, no sign-up, and no credit card. Use AI tools, pick from 23 templates, and download your PDF free.",
  alternates: {
    canonical: "https://freefreecv.com/resume-builder/no-sign-up",
  },
  openGraph: {
    title: "Free Resume Builder — No Sign-Up Required | FreeFreeCV",
    description:
      "Build a professional resume for free with no account required. AI tools, 23 templates, instant PDF export.",
    url: "https://freefreecv.com/resume-builder/no-sign-up",
  },
};

export default function NoSignUpPage() {
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
            No Sign-Up · No Credit Card · 100% Free
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-[-0.03em]">
            Free Resume Builder — No Sign-Up Required
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Build a professional, ATS-friendly resume with no account, no email, and no credit card. Use AI tools, pick from 23 templates, and download your PDF free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/templates"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-black transition-all"
            >
              Build My Resume Free →
            </a>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-black text-slate-900">Why No Sign-Up?</h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Most resume builders make you create an account before you can see a single template. Some go further — they require a credit card to unlock any meaningful feature. FreeFreeCV was built on a different principle: you should be able to build a great resume in minutes, not after jumping through registration hoops. Open the builder, pick a template, fill in your details with AI help, and download your PDF. No account required to start. For job seekers who need a resume fast — after a layoff, for an unexpected interview, or as a quick update before applying — removing the sign-up barrier makes a real difference.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            Beyond the no-account experience, FreeFreeCV gives you four professional-grade AI tools at no cost: an AI Summary Generator that drafts your professional summary from your experience data, a Smart Skill Suggestions engine that recommends relevant industry skills, an ATS Score Checker that grades your resume 0–100 against applicant tracking system criteria, and a Job Description Matcher that identifies keyword gaps between your resume and any job posting. These are the same tools that competitors charge $20–$40 per month for. Here they are free, forever.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            If you do create a free account, your resumes are saved to the cloud and accessible from any device. But the account is optional — never required. FreeFreeCV respects your time and your privacy. Build your resume, download it, and get back to applying.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-3xl font-black text-slate-900 text-center">Everything Free. Nothing Hidden.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📝", title: "AI Summary Generator", desc: "Auto-generate a professional summary in seconds." },
              { icon: "💡", title: "Smart Skill Suggestions", desc: "Get AI-recommended skills for your role and industry." },
              { icon: "📊", title: "ATS Score Checker", desc: "Score and improve your resume before you submit." },
              { icon: "🎯", title: "Job Description Matcher", desc: "Find and fill keyword gaps from any job posting." },
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
          <h2 className="text-4xl font-black text-white">Start building — no sign-up needed.</h2>
          <p className="text-slate-400">Free forever. No credit card. No email required.</p>
          <a
            href="/templates"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all"
          >
            Build My Resume Free →
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
