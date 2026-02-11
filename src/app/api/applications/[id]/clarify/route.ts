import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/applications';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AIChatMessage } from '@/lib/types';

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

    try {
        const { answer } = await request.json();
        if (!answer) {
            return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
        }

        // 1. Get Application
        const appRes = await ApplicationService.getApplication(id);
        if (!appRes.success || !appRes.data) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }
        const application = appRes.data;

        // 2. Update conversation history
        const newMessage: AIChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: answer,
            timestamp: new Date().toISOString()
        };

        const updatedHistory = [...(application.conversation_history || []), newMessage];

        // 3. Update application and move back to 'processing' or 'input'
        const result = await ApplicationService.updateApplication(id, {
            conversation_history: updatedHistory,
            status: 'processing' // Move to processing to re-trigger AI
        });

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to update application');
        }

        return NextResponse.json(result.data);
    } catch (error: any) {
        console.error('Clarify error:', error);
        return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
    }
}
