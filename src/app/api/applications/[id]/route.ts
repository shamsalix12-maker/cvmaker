import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/applications';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const result = await ApplicationService.getApplication(id);
    if (!result.success) {
        return NextResponse.json({ error: result.error?.message }, { status: 404 });
    }
    return NextResponse.json(result.data);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const result = await ApplicationService.updateApplication(id, body);
    if (!result.success) {
        return NextResponse.json({ error: result.error?.message }, { status: 500 });
    }
    return NextResponse.json(result.data);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const result = await ApplicationService.deleteApplication(id);
    if (!result.success) {
        return NextResponse.json({ error: result.error?.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
