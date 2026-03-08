import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
    pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
    serverExternalPackages: ["pdfjs-dist"],
}

const withMDX = createMDX()

export default withMDX(nextConfig)
