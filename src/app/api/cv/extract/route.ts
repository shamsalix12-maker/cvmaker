// ============================================
// src/app/api/cv/extract/route.ts
// Domain-Aware CV Extraction API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { extractCVWithAI, EnhancedCVExtractionRequest } from '@/lib/cv/cv-extractor';
import { CVProcessorV2 } from '@/lib/cv/v2';
import { decryptApiKey } from '@/lib/encryption';
import { parseFile } from '@/lib/parsers';
import { AIProviderName } from '@/lib/types';
import { CVDomainId } from '@/lib/types/cv-domain.types';
import { isDevUser } from '@/lib/auth/dev-auth';
import { getUserId } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // ─── Auth ───
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Content-Type check ───
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error(`[API Extract] Invalid Content-Type: ${contentType}`);
      return NextResponse.json({
        error: 'Expected multipart/form-data request',
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // ─── Parse FormData ───
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('rawText') as string | null;
    const provider = formData.get('provider') as AIProviderName;
    const model = formData.get('model') as string;
    const domainsRaw = formData.get('domains') as string | null;
    const cvLanguage = (formData.get('cvLanguage') as string) || 'en';
    const managerVersion = formData.get('managerVersion') as string | null;

    // API key sources
    const directApiKey = request.headers.get('x-api-key-bypass');
    const devUserApiKey = formData.get('devApiKey') as string | null;

    // ─── Parse domains ───
    let selectedDomains: CVDomainId[] = ['general'];
    if (domainsRaw) {
      try {
        const parsed = JSON.parse(domainsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          selectedDomains = parsed as CVDomainId[];
        }
      } catch {
        // اگر JSON نبود، comma-separated امتحان کن
        const split = domainsRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (split.length > 0) {
          selectedDomains = split as CVDomainId[];
        }
      }
    }

    console.log('[API Extract] Request received:', {
      userId,
      hasFile: !!file,
      fileName: file?.name || null,
      fileSize: file?.size || 0,
      hasRawText: !!rawText,
      rawTextLength: rawText?.length || 0,
      provider,
      model,
      domains: selectedDomains,
      cvLanguage,
      hasDirectKey: !!directApiKey,
      hasDevKey: !!devUserApiKey,
      isDevUser: isDevUser(userId),
      managerVersion,
    });

    // ─── Validation ───
    if (!provider || !model) {
      return NextResponse.json({
        error: 'AI provider and model are required',
      }, { status: 400 });
    }

    // ─── Resolve API Key ───
    let apiKey: string;

    if (directApiKey) {
      console.log('[API Extract] Using direct API key from header');
      apiKey = directApiKey;
    } else if (devUserApiKey && isDevUser(userId)) {
      console.log('[API Extract] Using dev user API key from form data');
      apiKey = devUserApiKey;
    } else {
      const { data: keyData, error: keyError } = await supabase
        .from('ai_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('provider_name', provider)
        .single();

      console.log('[API Extract] DB key lookup:', {
        found: !!keyData,
        error: keyError?.message || null,
      });

      if (keyError || !keyData) {
        // Fallback to environment variable for Google provider
        if (provider === 'google') {
          const envKey = process.env.GOOGLE_AI_API_KEY;
          if (envKey) {
            console.log('[API Extract] Using GOOGLE_AI_API_KEY from environment');
            apiKey = envKey;
          } else {
            const errorMsg = `No API key found for ${provider}. Please add one in Settings.`;
            return NextResponse.json({ error: errorMsg }, { status: 400 });
          }
        } else {
          const errorMsg = `No API key found for ${provider}. Please add one in Settings.`;
          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }
      } else {
        try {
          apiKey = decryptApiKey(keyData.api_key_encrypted);
          console.log('[API Extract] API key decrypted successfully');
        } catch (e) {
          console.error('[API Extract] Decryption failed:', e);
          return NextResponse.json({
            error: 'Failed to decrypt API key. Please re-enter your key in Settings.',
          }, { status: 500 });
        }
      }
    }

    // ─── Get text to process ───
    let textToProcess = '';

    if (file) {
      console.log(`[API Extract] Parsing file: ${file.name} (${file.size} bytes, ${file.type})`);
      try {
        const parsed = await parseFile(file);
        textToProcess = parsed.text;
        console.log(`[API Extract] File parsed. Text length: ${textToProcess.length}`);
      } catch (error: any) {
        console.error('[API Extract] File parsing failed:', error);

        // Dev fallback
        if (isDevUser(userId) && apiKey === 'TEST_KEY_MOCK') {
          textToProcess = 'Mock file content (parsing failed or skipped in dev mode)';
        } else {
          return NextResponse.json({
            error: `Failed to parse file: ${error.message}`,
          }, { status: 400 });
        }
      }
    } else if (rawText) {
      console.log(`[API Extract] Using raw text. Length: ${rawText.length}`);
      textToProcess = rawText;
    } else {
      return NextResponse.json({
        error: 'Either file or rawText is required',
      }, { status: 400 });
    }

    // ─── Dev mock bypass ───
    if (isDevUser(userId) && apiKey === 'TEST_KEY_MOCK') {
      console.log('[API Extract] Dev Mode: Returning mock response');
      return NextResponse.json(buildDevMockResponse(textToProcess, provider, model, selectedDomains));
    }

    // ─── Validate text ───
    if (!textToProcess || textToProcess.trim().length === 0) {
      return NextResponse.json({
        error: 'Document text is empty after parsing. Please check the file or text.',
      }, { status: 400 });
    }

    // ─── AI Extraction ───
    console.log(`[API Extract] Starting AI extraction with ${provider}/${model}...`);

    if (managerVersion === 'v2') {
      const startTime = Date.now();
      console.log('[API Extract] Starting Processor V2.0 Pipeline...');
      try {
        const v2 = new CVProcessorV2(provider, model, apiKey);
        const result = await v2.fullProcess(textToProcess, domainsRaw || '');

        const duration = Date.now() - startTime;
        console.log(`[API Extract] V2.0 Pipeline finished in ${duration}ms. Success: ${result.success}`);

        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }

        const mappedResponse = {
          ...result,
          cv: result.cv ? v2.toComprehensiveCV(result.cv) : null,
          gapAnalysis: v2.toV1GapAnalysis(result.audit, result.gaps, selectedDomains),
          aiProvider: provider,
          aiModel: model,
          rawText: textToProcess,
        };

        console.log('[API Extract] V2.0 success! Mapping confirmed.', {
          hasCV: !!mappedResponse.cv,
          hasGaps: !!mappedResponse.gapAnalysis,
          gapCount: mappedResponse.gapAnalysis?.gaps?.length || 0
        });

        return NextResponse.json(mappedResponse);
      } catch (v2Error: any) {
        console.error('[API Extract] V2.0 CRITICAL EXCEPTION:', v2Error);
        console.error('[API Extract] Stack trace:', v2Error.stack);
        return NextResponse.json({
          success: false,
          error: `Critical failure in V2 pipeline: ${v2Error.message}`,
          details: v2Error.message,
          stack: v2Error.stack
        }, { status: 500 });
      }
    }

    const extractionRequest: EnhancedCVExtractionRequest = {
      rawText: textToProcess,
      aiProvider: provider,
      aiModel: model,
      selectedDomains,
      cvLanguage,
    };

    const result = await extractCVWithAI(extractionRequest, apiKey);

    console.log('[API Extract] Extraction complete:', {
      success: result.success,
      confidence: result.confidence,
      gapCount: result.gapAnalysis?.gaps?.length || 0,
      overallScore: result.gapAnalysis?.overall_score || 0,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API Extract] Unhandled error:', error);
    console.error('[API Extract] Stack:', error.stack);
    return NextResponse.json({
      error: 'Internal server error during extraction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}

// ─── Dev Mock Response Builder ───

function buildDevMockResponse(
  textToProcess: string,
  provider: AIProviderName,
  model: string,
  selectedDomains: CVDomainId[]
) {
  return {
    success: true,
    cv: {
      personal_info: {
        full_name: 'Dev User (Server Mock)',
        email: 'dev@example.com',
        phone: '+1234567890',
        location: 'Mock City, Devland',
        linkedin_url: '',
        website_url: '',
        summary: 'This is a server-side mock response. In production, AI will extract real CV data.',
      },
      work_experience: [
        {
          id: 'work-1',
          job_title: 'Mock Engineer',
          company: 'Mock Corp',
          location: 'Mock City',
          start_date: '2020-01',
          end_date: null,
          is_current: true,
          description: 'Working on mock projects for testing purposes.',
          achievements: ['Built mock system', 'Tested mock features'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'B.Sc.',
          field_of_study: 'Computer Science',
          institution: 'Mock University',
          location: 'Mock City',
          start_date: '2016-09',
          end_date: '2020-06',
          gpa: '3.8',
          description: '',
        },
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Testing'],
      certifications: [],
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Persian', proficiency: 'native' },
      ],
      projects: [],
      additional_sections: [],
      raw_text: textToProcess,
    },
    fieldStatuses: [],
    confidence: 55,
    rawText: textToProcess,
    aiProvider: provider,
    aiModel: model,
    extractionNotes: 'Dev Mode: Server-side mock response.',
    gapAnalysis: {
      selected_domains: selectedDomains,
      detected_domains: ['general'],
      overall_score: 55,
      domain_scores: Object.fromEntries(selectedDomains.map(d => [d, 50])),
      gaps: [
        {
          id: 'gap-mock-1',
          field_path: 'personal_info.summary',
          severity: 'critical',
          category: 'weak_description',
          title_en: 'Professional Summary Needs Improvement',
          title_fa: 'خلاصه حرفه‌ای نیاز به بهبود دارد',
          description_en: 'Your professional summary is generic and does not highlight your key strengths or domain expertise.',
          description_fa: 'خلاصه حرفه‌ای شما عمومی است و نقاط قوت کلیدی یا تخصص حوزه‌ای شما را برجسته نمی‌کند.',
          fix_guidance_en: 'Write a 2-4 sentence summary that includes: your job title/role, years of experience, key technical skills, and a notable achievement with metrics.',
          fix_guidance_fa: 'یک خلاصه ۲-۴ جمله‌ای بنویسید که شامل: عنوان شغلی، سال‌های تجربه، مهارت‌های فنی کلیدی و یک دستاورد برجسته با اعداد باشد.',
          fix_example_en: 'Senior Software Engineer with 5+ years of experience building scalable web applications using React and Node.js. Led a team of 6 developers, delivering 3 products that generated $2M in annual revenue.',
          fix_example_fa: 'مهندس ارشد نرم‌افزار با بیش از ۵ سال تجربه در ساخت اپلیکیشن‌های وب مقیاس‌پذیر با React و Node.js. رهبری تیم ۶ نفره توسعه‌دهنده و تحویل ۳ محصول با درآمد سالانه $2M.',
          relevant_domains: selectedDomains,
          input_type: 'textarea',
          is_skipped: false,
          is_resolved: false,
          can_skip: true,
          current_value: 'This is a server-side mock response.',
          suggested_value: 'Experienced professional with expertise in [your field]. Proven track record of [key achievement].',
        },
        {
          id: 'gap-mock-2',
          field_path: 'work_experience',
          severity: 'important',
          category: 'missing_metrics',
          title_en: 'Work Experience Lacks Quantifiable Metrics',
          title_fa: 'تجربه کاری فاقد معیارهای کمی است',
          description_en: 'Your work experience descriptions need quantifiable achievements (numbers, percentages, dollar amounts).',
          description_fa: 'توضیحات تجربه کاری شما به دستاوردهای قابل اندازه‌گیری نیاز دارد (اعداد، درصدها، مبالغ).',
          fix_guidance_en: 'For each role, add 2-3 achievements with specific numbers. Think about: team size, revenue impact, efficiency gains, user growth, cost savings.',
          fix_guidance_fa: 'برای هر نقش، ۲-۳ دستاورد با اعداد مشخص اضافه کنید. به این موارد فکر کنید: اندازه تیم، تأثیر درآمدی، بهبود بهره‌وری، رشد کاربر، صرفه‌جویی هزینه.',
          fix_example_en: 'Reduced API response time by 40% through database optimization; Managed team of 8 engineers; Increased test coverage from 45% to 92%.',
          fix_example_fa: 'کاهش ۴۰٪ زمان پاسخ API از طریق بهینه‌سازی دیتابیس؛ مدیریت تیم ۸ مهندس؛ افزایش پوشش تست از ۴۵٪ به ۹۲٪.',
          relevant_domains: selectedDomains,
          input_type: 'textarea',
          is_skipped: false,
          is_resolved: false,
          can_skip: true,
        },
        {
          id: 'gap-mock-3',
          field_path: 'projects',
          severity: 'recommended',
          category: 'missing_section',
          title_en: 'No Projects Listed',
          title_fa: 'هیچ پروژه‌ای ذکر نشده',
          description_en: 'Adding 2-3 notable projects can significantly strengthen your CV, especially for technical roles.',
          description_fa: 'اضافه کردن ۲-۳ پروژه شاخص می‌تواند رزومه شما را به‌ویژه برای نقش‌های فنی تقویت کند.',
          fix_guidance_en: 'List your most impressive projects with: project name, brief description, technologies used, and impact/results.',
          fix_guidance_fa: 'مهم‌ترین پروژه‌هایتان را با: نام پروژه، توضیح مختصر، فناوری‌های استفاده‌شده و نتایج فهرست کنید.',
          fix_example_en: 'E-commerce Platform - Built a full-stack e-commerce app using React, Node.js, and PostgreSQL. Handled 10K+ daily users with 99.9% uptime.',
          fix_example_fa: 'پلتفرم تجارت الکترونیک - ساخت اپلیکیشن فول‌استک با React, Node.js و PostgreSQL. پشتیبانی از بیش از ۱۰ هزار کاربر روزانه با ۹۹.۹٪ آپتایم.',
          relevant_domains: selectedDomains,
          input_type: 'project',
          is_skipped: false,
          is_resolved: false,
          can_skip: true,
        },
        {
          id: 'gap-mock-4',
          field_path: 'certifications',
          severity: 'optional',
          category: 'missing_section',
          title_en: 'No Certifications Listed',
          title_fa: 'هیچ گواهینامه‌ای ذکر نشده',
          description_en: 'Professional certifications can add credibility, but are not required for all roles.',
          description_fa: 'گواهینامه‌های حرفه‌ای می‌توانند اعتبار اضافه کنند، اما برای همه نقش‌ها الزامی نیستند.',
          fix_guidance_en: 'If you have any relevant certifications (AWS, Google, Scrum, PMP, etc.), list them here.',
          fix_guidance_fa: 'اگر گواهینامه مرتبطی دارید (AWS, Google, Scrum, PMP و غیره)، اینجا فهرست کنید.',
          fix_example_en: 'AWS Solutions Architect Associate (2023)',
          fix_example_fa: 'AWS Solutions Architect Associate (۲۰۲۳)',
          relevant_domains: selectedDomains,
          input_type: 'certification',
          is_skipped: false,
          is_resolved: false,
          can_skip: true,
        },
      ],
      strengths: [
        {
          title_en: 'Has Work Experience',
          title_fa: 'دارای سابقه کاری',
          description_en: 'The CV includes at least one work experience entry, which is essential.',
          description_fa: 'رزومه شامل حداقل یک سابقه کاری است که ضروری است.',
          relevant_domains: selectedDomains,
        },
        {
          title_en: 'Education Included',
          title_fa: 'تحصیلات ذکر شده',
          description_en: 'Educational background is present with degree and institution details.',
          description_fa: 'سوابق تحصیلی با جزئیات مدرک و مؤسسه ذکر شده است.',
          relevant_domains: selectedDomains,
        },
      ],
      analysis_summary: 'This is a mock analysis. The CV has basic structure but needs improvement in professional summary, quantifiable achievements, and projects section.',
      general_recommendations: [
        'Add quantifiable metrics to all work experience descriptions',
        'Expand professional summary with specific skills and achievements',
        'Include 2-3 notable projects with technologies and impact',
      ],
    },
    detectedDomains: [{ domain: 'general' as CVDomainId, score: 50 }],
    metadata: {
      confidence: 55,
      detected_language: 'en',
      cv_format_quality: 'fair',
      estimated_experience_years: 4,
      career_level: 'mid',
      notes: 'Dev mode mock response',
    },
  };
}
