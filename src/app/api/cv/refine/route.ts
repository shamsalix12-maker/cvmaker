// ============================================
// src/app/api/cv/refine/route.ts
// CV Refinement API - Resolve gaps with AI
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { refineCVWithAI } from '@/lib/cv/cv-extractor';
import { CVProcessorV2, CanonicalCV } from '@/lib/cv/v2';
import { decryptApiKey } from '@/lib/encryption';
import { AIProviderName, ComprehensiveCV } from '@/lib/types';
import { CVDomainId } from '@/lib/types/cv-domain.types';
import { isDevUser } from '@/lib/auth/dev-auth';
import { getUserId } from '@/lib/auth/server-auth';

/**
 * بدنه درخواست Refinement
 */
interface RefineRequestBody {
  currentCV: Partial<ComprehensiveCV>;
  resolvedGaps: { gapId: string; userInput: string }[];
  selectedDomains: CVDomainId[];
  provider: AIProviderName;
  model: string;
  instructions?: string;
  additionalText?: string;
  cvLanguage?: string;
  managerVersion?: string;
}

export async function POST(request: NextRequest) {
  try {
    // ─── Auth ───
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Parse body ───
    let body: RefineRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
      }, { status: 400 });
    }

    const {
      currentCV,
      resolvedGaps,
      selectedDomains,
      provider,
      model,
      instructions,
      additionalText,
      cvLanguage,
      managerVersion,
    } = body;

    console.log('[API Refine] Request received:', {
      userId,
      hasCV: !!currentCV,
      cvName: currentCV?.personal_info?.full_name || 'Unknown',
      resolvedGapCount: resolvedGaps?.length || 0,
      resolvedGapIds: resolvedGaps?.map(g => g.gapId) || [],
      domains: selectedDomains || [],
      provider,
      model,
      hasInstructions: !!instructions,
      hasAdditionalText: !!additionalText,
      cvLanguage: cvLanguage || 'en',
    });

    // ─── Validation ───
    if (!currentCV) {
      return NextResponse.json({
        error: 'currentCV is required',
      }, { status: 400 });
    }

    if (!provider || !model) {
      return NextResponse.json({
        error: 'provider and model are required',
      }, { status: 400 });
    }

    if (!resolvedGaps || resolvedGaps.length === 0) {
      // اگر هیچ gap رفع نشده باشد اما instructions باشد، اجازه بده
      if (!instructions && !additionalText) {
        return NextResponse.json({
          error: 'At least one resolved gap, instructions, or additional text is required',
        }, { status: 400 });
      }
    }

    // ─── Resolve API Key ───
    const supabase = await createServerSupabaseClient();

    // بررسی direct key از header
    const directApiKey = request.headers.get('x-api-key-bypass');
    let apiKey: string;

    if (directApiKey) {
      console.log('[API Refine] Using direct API key from header');
      apiKey = directApiKey;
    } else {
      const { data: keyData, error: keyError } = await supabase
        .from('ai_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider_name', provider)
        .single();

      if (keyError || !keyData) {
        // Fallback to environment variable for Google provider
        if (provider === 'google') {
          const envKey = process.env.GOOGLE_AI_API_KEY;
          if (envKey) {
            console.log('[API Refine] Using GOOGLE_AI_API_KEY from environment');
            apiKey = envKey;
          } else {
            console.error('[API Refine] API key not found:', keyError?.message);
            return NextResponse.json({
              error: `No API key found for ${provider}. Please add one in Settings.`,
            }, { status: 400 });
          }
        } else {
          console.error('[API Refine] API key not found:', keyError?.message);
          return NextResponse.json({
            error: `No API key found for ${provider}. Please add one in Settings.`,
          }, { status: 400 });
        }
      } else {
        try {
          apiKey = decryptApiKey(keyData.api_key_encrypted);
        } catch (e) {
          console.error('[API Refine] Decryption failed:', e);
          return NextResponse.json({
            error: 'Failed to decrypt API key',
          }, { status: 500 });
        }
      }
    }

    // ─── Dev mock bypass ───
    if (isDevUser(userId) && apiKey === 'TEST_KEY_MOCK') {
      console.log('[API Refine] Dev mode: returning mock refinement');
      return NextResponse.json(buildDevRefineMockResponse(currentCV, resolvedGaps || [], selectedDomains || ['general'], provider, model));
    }

    // ─── AI Refinement ───
    console.log(`[API Refine] Starting AI refinement with ${provider}/${model}...`);

    console.log('[REFINE-DEBUG-1] Input to refine:',
      JSON.stringify({
        hasCurrentCV: !!currentCV,
        cvSections: currentCV ? Object.keys(currentCV) : [],
        gapCount: resolvedGaps?.length,
        instructions: instructions?.substring(0, 100)
      }));

    if (managerVersion === 'v2') {
      console.log('[API Refine] Using Processor V2.0 Refinement (Patch-based)');
      const v2 = new CVProcessorV2(provider, model, apiKey);

      // V2 expects a patch. If the UI sends Full CV updates, we merge them.
      // If the UI sends resolvedGaps, we would ideally have an AI agent convert them to a Patch.
      // For now, we use the Merger to apply simple updates if currentCV is provided as the new state.
      const result = await v2.refine(currentCV as CanonicalCV, (body as any).patch || {});

      return NextResponse.json({
        ...result,
        cv: result.cv ? v2.toComprehensiveCV(result.cv as any) : null,
      });
    }

    const result = await refineCVWithAI(
      currentCV,
      apiKey,
      provider,
      model,
      selectedDomains || ['general'],
      resolvedGaps || [],
      instructions,
      additionalText,
      cvLanguage || 'en',
      managerVersion
    );

    console.log('[API Refine] Refinement complete:', {
      success: result.success,
      confidence: result.confidence,
      remainingGaps: result.gapAnalysis?.gaps?.filter(g => !g.is_resolved && !g.is_skipped).length || 0,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API Refine] Unhandled error:', error);
    console.error('[API Refine] Stack:', error.stack);
    return NextResponse.json({
      error: 'Internal server error during refinement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}

// ─── Dev Mock Response ───

function buildDevRefineMockResponse(
  currentCV: Partial<ComprehensiveCV>,
  resolvedGaps: { gapId: string; userInput: string }[],
  selectedDomains: CVDomainId[],
  provider: AIProviderName,
  model: string
) {
  // شبیه‌سازی ادغام gap ها در CV
  const updatedCV = { ...currentCV };

  for (const gap of resolvedGaps) {
    if (gap.gapId.includes('summary') || gap.gapId === 'gap-mock-1') {
      if (updatedCV.personal_info) {
        updatedCV.personal_info = {
          ...updatedCV.personal_info,
          summary: gap.userInput,
        };
      }
    }
    // سایر gap ها در mock ساده نگه داشته می‌شوند
  }

  return {
    success: true,
    cv: updatedCV,
    fieldStatuses: [],
    confidence: 70,
    rawText: currentCV.raw_text || '',
    aiProvider: provider,
    aiModel: model,
    extractionNotes: `Dev mock refinement. ${resolvedGaps.length} gap(s) integrated.`,
    gapAnalysis: {
      selected_domains: selectedDomains,
      detected_domains: ['general'] as CVDomainId[],
      overall_score: 70,
      domain_scores: Object.fromEntries(selectedDomains.map(d => [d, 65])),
      gaps: [
        // فقط gap هایی که resolve نشده‌اند باقی بمانند
        {
          id: 'gap-mock-remaining',
          field_path: 'skills',
          severity: 'recommended' as const,
          category: 'incomplete_content' as const,
          title_en: 'Skills Could Be More Comprehensive',
          title_fa: 'مهارت‌ها می‌توانند جامع‌تر باشند',
          description_en: 'Consider adding more domain-specific skills.',
          description_fa: 'افزودن مهارت‌های تخصصی‌تر حوزه را در نظر بگیرید.',
          fix_guidance_en: 'Add 5-10 more relevant skills specific to your target domains.',
          fix_guidance_fa: '۵-۱۰ مهارت مرتبط دیگر مختص حوزه‌های هدف اضافه کنید.',
          fix_example_en: 'Docker, Kubernetes, CI/CD, GraphQL, Redis',
          fix_example_fa: 'Docker, Kubernetes, CI/CD, GraphQL, Redis',
          relevant_domains: selectedDomains,
          input_type: 'list' as const,
          is_skipped: false,
          is_resolved: false,
          can_skip: true,
        },
      ],
      strengths: [
        {
          title_en: 'CV Structure Improved',
          title_fa: 'ساختار رزومه بهبود یافت',
          description_en: `${resolvedGaps.length} gap(s) have been successfully resolved.`,
          description_fa: `${resolvedGaps.length} نقص با موفقیت رفع شد.`,
          relevant_domains: selectedDomains,
        },
      ],
      analysis_summary: `Mock refinement complete. ${resolvedGaps.length} gap(s) resolved. CV score improved from 55 to 70.`,
      general_recommendations: [
        'Continue adding more specific skills',
        'Consider adding a projects section',
      ],
    },
    detectedDomains: [{ domain: 'general' as CVDomainId, score: 50 }],
    metadata: {
      confidence: 70,
      detected_language: 'en',
      cv_format_quality: 'good',
      estimated_experience_years: 4,
      career_level: 'mid',
      notes: `Dev mock: ${resolvedGaps.length} gaps integrated`,
    },
  };
}
