import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface BlogPost {
    slug: string
    title: string
    description: string
    date: string
    keywords: string[]
    category: "guide" | "role" | "comparison"
    readingTime: string
    faqs: { question: string; answer: string }[]
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog")

export function getAllPosts(): BlogPost[] {
    if (!fs.existsSync(CONTENT_DIR)) return []
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".mdx"))
    const posts = files.map(file => {
        const slug = file.replace(/\.mdx$/, "")
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8")
        const { data } = matter(raw)
        return {
            slug,
            title: data.title || slug,
            description: data.description || "",
            date: data.date || "",
            keywords: data.keywords || [],
            category: data.category || "guide",
            readingTime: data.readingTime || "10 min read",
            faqs: data.faqs || [],
        } satisfies BlogPost
    })
    return posts.sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getPostBySlug(slug: string): { meta: BlogPost; content: string } | null {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, "utf-8")
    const { data, content } = matter(raw)
    return {
        meta: {
            slug,
            title: data.title || slug,
            description: data.description || "",
            date: data.date || "",
            keywords: data.keywords || [],
            category: data.category || "guide",
            readingTime: data.readingTime || "10 min read",
            faqs: data.faqs || [],
        },
        content,
    }
}
