// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ResumeProvider } from "@/lib/context/ResumeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const BASE_URL = "https://freefreecv.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FreeFreeCV | Free AI Resume Builder — ATS-Friendly, No Sign-Up Required",
    template: "%s | FreeFreeCV",
  },
  description:
    "Build professional, ATS-friendly resumes for free. 23 premium templates, AI summary generator, smart skill suggestions, ATS scoring, job description matcher, and instant PDF export. No credit card. No paywall. Forever.",
  keywords: [
    "free resume builder",
    "ATS resume",
    "AI resume writer",
    "resume templates free",
    "ATS-friendly resume",
    "free ATS resume template",
    "resume builder no sign up",
    "AI resume builder",
    "free resume maker",
    "professional resume templates",
  ],
  authors: [{ name: "FreeFreeCV" }],
  creator: "FreeFreeCV",
  publisher: "FreeFreeCV",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "FreeFreeCV",
    title: "FreeFreeCV | Free AI Resume Builder",
    description:
      "Build professional, ATS-friendly resumes for free. AI summaries, skill suggestions, ATS scoring, 23 templates. No credit card, no paywall, forever.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FreeFreeCV — Free AI Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeFreeCV | Free AI Resume Builder",
    description:
      "Build professional, ATS-friendly resumes for free. AI summaries, skill suggestions, ATS scoring, 23 templates. No credit card, no paywall, forever.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FreeFreeCV",
  url: BASE_URL,
  description:
    "Free AI-powered resume builder with ATS scoring, job description matching, 23 professional templates, and instant PDF export.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI Summary Generator",
    "Smart Skill Suggestions",
    "ATS Score Checker",
    "Job Description Matcher",
    "23 Professional Templates",
    "Instant PDF Export",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "700",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
