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

    // 2. Get User's Comprehensive CV
    const cv = await ApplicationService.getLatestCV();
    if (!cv) {
        return NextResponse.json({ error: 'Comprehensive CV not found' }, { status: 400 });
    }

    // 3. Update Status to 'processing'
    await ApplicationService.updateStatus(id, 'processing');

    try {
        // 4. Generate Drafts
        const drafts = await ApplicationProcessor.generateDrafts(application, cv, user.id);

        // 5. Update Application with Drafts
        const updateResult = await ApplicationService.updateApplication(id, {
            draft_outputs: drafts,
            status: 'draft_ready',
            updated_at: new Date().toISOString()
        });

        if (!updateResult.success) {
            throw new Error(updateResult.error?.message || 'Failed to update application');
        }

        return NextResponse.json(updateResult.data);
    } catch (error: any) {
        console.error('Processing error:', error);
        await ApplicationService.updateStatus(id, 'input'); // Revert status
        return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
    }
}
