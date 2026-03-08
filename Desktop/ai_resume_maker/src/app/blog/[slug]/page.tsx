import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getAllPosts, getPostBySlug } from "@/lib/blog"

export const dynamic = "force-dynamic"

export function generateStaticParams() {
    return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const post = getPostBySlug(slug)
    if (!post) return {}
    return {
        title: post.meta.title,
        description: post.meta.description,
        keywords: post.meta.keywords,
        alternates: {
            canonical: `https://freefreecv.com/blog/${slug}`,
        },
        openGraph: {
            title: post.meta.title,
            description: post.meta.description,
            url: `https://freefreecv.com/blog/${slug}`,
            type: "article",
            publishedTime: post.meta.date,
        },
    }
}

function ArticleSchema({ meta }: { meta: { title: string; description: string; date: string; slug: string; faqs: { question: string; answer: string }[] } }) {
    const article = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.date,
        author: {
            "@type": "Organization",
            name: "FreeFreeCV",
            url: "https://freefreecv.com",
        },
        publisher: {
            "@type": "Organization",
            name: "FreeFreeCV",
            url: "https://freefreecv.com",
        },
        mainEntityOfPage: `https://freefreecv.com/blog/${meta.slug}`,
    }

    const faq = meta.faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: meta.faqs.map(f => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
            },
        })),
    } : null

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
            />
            {faq && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
                />
            )}
        </>
    )
}

export default async function BlogPostPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const post = getPostBySlug(slug)
    if (!post) notFound()

    // Dynamic import of the MDX file
    let MDXContent: React.ComponentType
    try {
        const mod = await import(`@/content/blog/${slug}.mdx`)
        MDXContent = mod.default
    } catch {
        notFound()
    }

    return (
        <div className="min-h-screen bg-white">
            <ArticleSchema meta={{ ...post.meta, slug }} />

            {/* Header */}
            <header className="border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        FreeFreeCV
                    </Link>
                    <nav className="flex gap-6 text-sm text-gray-600">
                        <Link href="/templates" className="hover:text-gray-900">Templates</Link>
                        <Link href="/blog" className="hover:text-gray-900">Blog</Link>
                    </nav>
                </div>
            </header>

            {/* Article */}
            <article className="max-w-3xl mx-auto px-6 pt-12 pb-16">
                {/* Breadcrumb */}
                <nav className="text-sm text-gray-400 mb-6">
                    <Link href="/blog" className="hover:text-gray-600">Blog</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-600">{post.meta.title}</span>
                </nav>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {post.meta.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
                    <span>{post.meta.readingTime}</span>
                    <span>Updated {post.meta.date}</span>
                </div>

                {/* TL;DR Box */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-5 mb-10">
                    <p className="text-sm font-semibold text-violet-800 mb-1">TL;DR</p>
                    <p className="text-sm text-violet-700">{post.meta.description}</p>
                </div>

                {/* MDX Content */}
                <div className="prose prose-gray max-w-none">
                    <MDXContent />
                </div>

                {/* FAQ Section */}
                {post.meta.faqs.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-6">
                            {post.meta.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-gray-100 pb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {faq.question}
                                    </h3>
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </article>

            {/* CTA Band */}
            <section className="bg-[#0A0A0A] py-16">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Ready to Build Your Resume?
                    </h2>
                    <p className="text-gray-400 mb-6">
                        21 ATS-optimized templates. AI bullet enhancer. 100% free.
                    </p>
                    <Link
                        href="/templates"
                        className="inline-block bg-violet-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-violet-700 transition-colors"
                    >
                        Start Building Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
                FreeFreeCV - 100% Free Resume Builder
            </footer>
        </div>
    )
}
