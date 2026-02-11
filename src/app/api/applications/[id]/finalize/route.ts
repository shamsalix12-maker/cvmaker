import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService, ApplicationProcessor } from '@/lib/applications';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Application
    const appResult = await ApplicationService.getApplication(id);
    if (!appResult.success || !appResult.data) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    const application = appResult.data;

    // 2. Update Status to 'finalizing' (using 'processing' as proxy if needed, or keeping 'draft_ready')
    // For simplicity, we just process

    try {
        // 3. Consolidate Drafts
        const finalOutput = await ApplicationProcessor.consolidateDrafts(application, user.id);

        if (!finalOutput) {
            throw new Error('Consolidation failed to produce output');
        }

        // 4. Update Application with Final Output
        const updateResult = await ApplicationService.updateApplication(id, {
            final_output: finalOutput,
            status: 'finalized',
            updated_at: new Date().toISOString()
        });

        if (!updateResult.success) {
            throw new Error(updateResult.error?.message || 'Failed to update application');
        }

        return NextResponse.json(updateResult.data);
    } catch (error: any) {
        console.error('Finalization error:', error);
        return NextResponse.json({ error: error.message || 'Finalization failed' }, { status: 500 });
    }
}
