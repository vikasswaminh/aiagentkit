import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('download_history')
        .select('*, resumes(name)')
        .eq('user_id', user.id)
        .order('downloaded_at', { ascending: false })
        .limit(50)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resume_id, format } = body

    // Validate format
    const allowedFormats = ['pdf', 'json', 'latex']
    if (format && !allowedFormats.includes(format)) {
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('download_history')
        .insert({
            user_id: user.id,
            resume_id,
            format: format || 'pdf',
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
