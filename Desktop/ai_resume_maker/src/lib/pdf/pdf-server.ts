import "server-only";
import { ResumeData } from "@/lib/schemas/resume";
import { getTemplate } from "@/lib/templates/registry";
import { ResumePrintLayout } from "@/components/resume/ResumePrintLayout";
import React from "react";
import path from "path";
import fs from "fs";

// Use require to bypass static analysis for server-only module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactDOMServer = require("react-dom/server");

const API2PDF_ENDPOINT = "https://v2018.api2pdf.com/chrome/html";
const DEFAULT_API2PDF_KEY = "e60f031e-8633-458c-973b-3787939a1ee6";

export interface PDFServiceResponse {
    success: boolean;
    pdf?: Buffer;
    error?: string;
}

/**
 * PDF Service Abstraction
 * Currently uses api2pdf for high-fidelity rendering.
 * Replaces the local Puppeteer-based pipeline.
 */
export async function generatePDF(html: string): Promise<PDFServiceResponse> {
    const apiKey = process.env.API2PDF_KEY || DEFAULT_API2PDF_KEY;

    // Debug: Log the HTML size only (no content for privacy)
    console.log("generatePDF received HTML length:", html.length);

    if (!apiKey) {
        return {
            success: false,
            error: "API2PDF_KEY is not configured."
        };
    }

    try {
        const requestPayload = {
            html,
            inline: true,
            fileName: "resume.pdf",
            options: {
                printBackground: true,
                displayHeaderFooter: false,
                format: "A4",
                emulateMediaType: "screen", // Key fix: use screen styles
                margin: {
                    top: "0",
                    right: "0",
                    bottom: "0",
                    left: "0"
                },
                // Ensure deterministic rendering
                waitForNetworkIdle: true
            }
        };

        console.log("api2pdf request:", API2PDF_ENDPOINT);
        console.log("api2pdf payload:", JSON.stringify(requestPayload, null, 2));

        const response = await fetch(API2PDF_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestPayload)
        });

        console.log("api2pdf response status:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("api2pdf error response:", errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }
            return {
                success: false,
                error: `api2pdf error: ${errorData.message || response.statusText}`
            };
        }

        const data = await response.json();

        // Log the full api2pdf response for debugging
        console.log("api2pdf response:", JSON.stringify(data, null, 2));

        if (data.success && data.pdf) {
            // Fetch the generated PDF
            try {
                const pdfResponse = await fetch(data.pdf);
                if (!pdfResponse.ok) {
                    return {
                        success: false,
                        error: `Failed to fetch PDF from URL: ${pdfResponse.statusText}`
                    };
                }
                const arrayBuffer = await pdfResponse.arrayBuffer();
                return {
                    success: true,
                    pdf: Buffer.from(arrayBuffer)
                };
            } catch (fetchError) {
                console.error("Error fetching PDF from URL:", fetchError);
                return {
                    success: false,
                    error: `Failed to fetch PDF from URL: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
                };
            }
        }

        // More detailed error message based on response structure
        if (!data.success) {
            return {
                success: false,
                error: `api2pdf generation failed: ${data.message || data.error || 'Unknown error'}`
            };
        }

        if (!data.FileUrl && !data.pdf) {
            return {
                success: false,
                error: `api2pdf response missing FileUrl/pdf. Available fields: ${Object.keys(data).join(', ')}`
            };
        }

        return {
            success: false,
            error: "api2pdf failed to return a valid FileUrl."
        };
    } catch (error: unknown) {
        console.error("PDF Generation Service Failure:", error);
        return {
            success: false,
            error: (error instanceof Error ? error.message : String(error)) || "Unknown error during PDF generation."
        };
    }
}

/**
 * Builds a full HTML document for api2pdf.
 * Embeds shared styles and fonts.
 */
export function buildSnapshot(contentHtml: string, printCss: string, fontsCss: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Export</title>
    <style>
        ${fontsCss}
        ${printCss}
        
        /* Ensure proper rendering in print context */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        
        body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
            -webkit-font-smoothing: antialiased;
        }

        /* Shadow utilities to match preview */
        .shadow-2xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }
        .shadow-slate-900\/10 {
            box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.1) !important;
        }
        
        /* Ensure proper sizing for A4 wrapper */
        .resume-container {
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
        }
    </style>
</head>
<body>
    ${contentHtml}
</body>
</html>`;
}

export interface RenderResults {
    fullHtml: string;
    stats: {
        htmlLength: number;
        cssLength: number;
        fontsLength: number;
        totalLength: number;
    };
}

/**
 * Renders the resume to a static HTML string using React templates.
 * Uses React.createElement to avoid JSX syntax in .ts files.
 */
export async function renderResumeToHtml(data: ResumeData): Promise<RenderResults> {
    const TemplateComponent = getTemplate(data.template || "simple");

    // Read authoritative styles
    const printCssPath = path.join(process.cwd(), "src/styles/print.css");
    const fontsCssPath = path.join(process.cwd(), "src/styles/fonts-base64.css");

    const [printCss, fontsCss] = await Promise.all([
        fs.promises.readFile(printCssPath, "utf8"),
        fs.promises.readFile(fontsCssPath, "utf8").catch(() => "") // Fallback for safety
    ]);

    // Create the same structure as the preview page: ResumePrintLayout > Template
    const contentHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(
            ResumePrintLayout,
            { className: "shadow-none" }, // No shadow in PDF
            React.createElement(TemplateComponent, { data })
        )
    );

    const fullHtml = buildSnapshot(contentHtml, printCss, fontsCss);

    return {
        fullHtml,
        stats: {
            htmlLength: contentHtml.length,
            cssLength: printCss.length,
            fontsLength: fontsCss.length,
            totalLength: fullHtml.length
        }
    };
}
