import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ResumeSchema } from '@/lib/schemas/resume'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error("GET Resumes Error:", error);
            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate payload
        const validation = ResumeSchema.safeParse(body.data);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid resume data',
                details: validation.error.issues.map(e => e.message)
            }, { status: 400 });
        }

        const { data: resume, error } = await supabase
            .from('resumes')
            .insert({
                user_id: user.id,
                name: body.name || `Resume - ${new Date().toLocaleDateString()}`,
                data: validation.data,
            })
            .select()
            .single()

        if (error) {
            console.error("POST Resume Error:", error);
            return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 })
        }

        return NextResponse.json(resume)
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
