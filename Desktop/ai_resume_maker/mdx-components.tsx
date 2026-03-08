import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-800">{children}</h3>
        ),
        p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">{children}</ol>
        ),
        table: ({ children }) => (
            <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-200 text-sm">{children}</table>
            </div>
        ),
        th: ({ children }) => (
            <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
            <td className="border border-gray-200 px-4 py-2">{children}</td>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500 pl-4 py-2 mb-4 bg-violet-50 rounded-r text-gray-700 italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
            <a href={href} className="text-violet-600 underline hover:text-violet-800">{children}</a>
        ),
        ...components,
    }
}
