import { NextRequest, NextResponse } from "next/server";
import { renderResumeToHtml } from "@/lib/pdf/pdf-server";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const html = await renderResumeToHtml(data);

        return NextResponse.json({
            success: true,
            html: html.fullHtml,
            htmlLength: html.fullHtml.length
        });
    } catch (error) {
        console.error("Debug HTML generation error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}