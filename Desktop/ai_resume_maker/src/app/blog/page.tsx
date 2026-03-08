import Link from "next/link"
import { getAllPosts } from "@/lib/blog"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
    guide: "Resume Guide",
    role: "Role-Specific",
    comparison: "Comparison",
}

export default function BlogIndex() {
    const posts = getAllPosts()

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        FreeFreeCV
                    </Link>
                    <nav className="flex gap-6 text-sm text-gray-600">
                        <Link href="/templates" className="hover:text-gray-900">Templates</Link>
                        <Link href="/blog" className="text-violet-600 font-medium">Blog</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Resume Writing Guides
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                    Expert advice on writing resumes that pass ATS systems and impress hiring managers. All guides are free.
                </p>
            </section>

            {/* Posts Grid */}
            <section className="max-w-5xl mx-auto px-6 pb-20">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map(post => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group block border border-gray-200 rounded-lg p-6 hover:border-violet-300 hover:shadow-sm transition-all"
                        >
                            <span className="text-xs font-medium text-violet-600 uppercase tracking-wide">
                                {CATEGORY_LABELS[post.category] || post.category}
                            </span>
                            <h2 className="text-lg font-semibold text-gray-900 mt-2 mb-2 group-hover:text-violet-700 transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                {post.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{post.readingTime}</span>
                                <span>{post.date}</span>
                            </div>
                        </Link>
                    ))}
                </div>
                {posts.length === 0 && (
                    <p className="text-gray-500 text-center py-12">Blog posts coming soon.</p>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
                FreeFreeCV - 100% Free Resume Builder
            </footer>
        </div>
    )
}
