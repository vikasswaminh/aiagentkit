import type { Metadata } from "next";
import "./globals.css";
import { ResumeProvider } from "@/lib/context/ResumeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "FreeFreeCV | Free ATS Resume Builder",
  description: "Build professional, ATS-friendly resumes for free. 23 premium templates, AI summary generator, skill suggestions, ATS scoring, and instant PDF export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
