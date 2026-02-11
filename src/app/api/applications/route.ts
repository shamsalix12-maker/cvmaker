import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ApplicationService } from '@/lib/applications';

export async function GET(request: NextRequest) {
    const result = await ApplicationService.listApplications();
    if (!result.success) {
        return NextResponse.json({ error: result.error?.message }, { status: result.error?.code === 'UNAUTHORIZED' ? 401 : 500 });
    }
    return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await ApplicationService.createApplication(body);
    if (!result.success) {
        return NextResponse.json({ error: result.error?.message }, { status: 500 });
    }
    return NextResponse.json(result.data, { status: 201 });
}
