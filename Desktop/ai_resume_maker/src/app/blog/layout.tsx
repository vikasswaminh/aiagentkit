import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Resume Writing Blog | FreeFreeCV",
    description: "Expert resume writing guides, ATS tips, and career advice. Free resources to help you land your dream job.",
    alternates: {
        canonical: "https://freefreecv.com/blog",
    },
    openGraph: {
        title: "Resume Writing Blog | FreeFreeCV",
        description: "Expert resume writing guides, ATS tips, and career advice.",
        url: "https://freefreecv.com/blog",
    },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
