import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ResumeSchema } from '@/lib/schemas/resume'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error) {
            console.error("GET Resume single error:", error);
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

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
            }, { status: 400 })
        }

        const { data: resume, error } = await supabase
            .from('resumes')
            .update({
                name: body.name,
                data: validation.data
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error("PUT Resume error:", error);
            return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 })
        }

        return NextResponse.json(resume)
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabase
            .from('resumes')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error("DELETE Resume error:", error);
            return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
