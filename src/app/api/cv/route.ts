import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createCVService } from '@/lib/cv/cv-service';
import { ComprehensiveCV } from '@/lib/types';
import { isDevUser } from '@/lib/auth/dev-auth';
import { getUserId } from '@/lib/auth/server-auth';

// GET - Retrieve user's CV
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        const cvService = createCVService(supabase);

        const cv = await cvService.getCV(userId);

        return NextResponse.json({ cv });

    } catch (error: any) {
        console.error('GET /api/cv error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch CV' },
            { status: 500 }
        );
    }
}

// POST - Create or replace CV
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        const body = await request.json();
        const cvData: Partial<ComprehensiveCV> = body.cv;

        if (!cvData) {
            return NextResponse.json(
                { error: 'CV data is required' },
                { status: 400 }
            );
        }

        const cvService = createCVService(supabase);

        const cv = await cvService.upsertCV(userId, cvData);

        return NextResponse.json({ cv, success: true });

    } catch (error: any) {
        console.error('POST /api/cv error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save CV' },
            { status: 500 }
        );
    }
}

// PUT - Update specific fields of CV
export async function PUT(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        const body = await request.json();
        const { fieldPath, value, updates } = body;

        const cvService = createCVService(supabase);

        let cv;

        if (fieldPath && value !== undefined) {
            // Update single field
            cv = await cvService.updateCVField(userId, fieldPath, value);
        } else if (updates) {
            // Update multiple fields
            cv = await cvService.updateCV(userId, updates);
        } else {
            return NextResponse.json(
                { error: 'Either fieldPath/value or updates is required' },
                { status: 400 }
            );
        }

        return NextResponse.json({ cv, success: true });

    } catch (error: any) {
        console.error('PUT /api/cv error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update CV' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user's CV
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        const cvService = createCVService(supabase);

        await cvService.deleteCV(userId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('DELETE /api/cv error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete CV' },
            { status: 500 }
        );
    }
}
