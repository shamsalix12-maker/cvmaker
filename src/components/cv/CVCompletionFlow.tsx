// ============================================
// src/components/cv/CVCompletionFlow.tsx
// Main CV Completion Flow Orchestrator
// ============================================

'use client';

import { useState, useCallback, useRef, Fragment } from 'react';
import { ComprehensiveCV } from '@/lib/types';
import {
  CVCompletionStep,
  CVCompletionState,
  CVGapAnalysis,
  CVGapItem,
  CVDomainId,
} from '@/lib/types/cv-domain.types';
import { DomainSelector } from './DomainSelector';
import { GapAnalysisDashboard } from './GapAnalysisDashboard';
import { GapResolutionWizard } from './GapResolutionWizard';
import { ClassificationReview } from './ClassificationReview';
import { ImprovementReview } from './ImprovementReview';

// ═══════════════════════════════════════════
// Helper Functions for Safe Merge
// ═══════════════════════════════════════════

/**
 * Merge resolved gaps into CV WITHOUT AI
 * This ensures NO data is ever deleted or modified
 */
function mergeGapsIntoCV(
  cv: Partial<ComprehensiveCV>,
  resolvedGaps: { gapId: string; userInput: string }[],
  cvLanguage: string
): Partial<ComprehensiveCV> {
  // Deep clone to avoid mutations
  const merged = JSON.parse(JSON.stringify(cv));

  for (const gap of resolvedGaps) {
    const { gapId, userInput } = gap;

    // Map gap IDs to CV fields
    if (gapId.includes('phone') || gapId === 'gap-phone') {
      if (!merged.personal_info) merged.personal_info = {};
      merged.personal_info.phone = userInput;
    }
    else if (gapId.includes('linkedin') || gapId === 'gap-linkedin') {
      if (!merged.personal_info) merged.personal_info = {};
      merged.personal_info.linkedin_url = userInput;
    }
    else if (gapId.includes('summary') || gapId === 'gap-summary') {
      if (!merged.personal_info) merged.personal_info = {};
      merged.personal_info.summary = userInput;
    }
    else if (gapId.includes('skills') || gapId === 'gap-skills') {
      // Parse skills - can be comma-separated or newline-separated
      const skills = userInput
        .split(/[,\n]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      merged.skills = [...(merged.skills || []), ...skills];
    }
    else if (gapId.includes('work-exp') || gapId === 'gap-work-exp') {
      if (!merged.work_experience) merged.work_experience = [];
      // Add as new entry - user should provide structured input
      merged.work_experience.push({
        id: `work-${Date.now()}`,
        job_title: userInput,
        company: '',
        location: '',
        start_date: '',
        end_date: null,
        is_current: false,
        description: '',
        achievements: [],
      });
    }
    else if (gapId.includes('education') || gapId === 'gap-education') {
      if (!merged.education) merged.education = [];
      merged.education.push({
        id: `edu-${Date.now()}`,
        degree: userInput,
        field_of_study: '',
        institution: '',
        location: '',
        start_date: '',
        end_date: '',
        gpa: null,
        description: '',
      });
    }
    else if (gapId.includes('certification') || gapId === 'gap-certifications') {
      if (!merged.certifications) merged.certifications = [];
      merged.certifications.push({
        id: `cert-${Date.now()}`,
        name: userInput,
        issuer: '',
        date_obtained: '',
        expiry_date: null,
        credential_id: null,
        credential_url: null,
      });
    }
    else if (gapId.includes('project') || gapId === 'gap-projects') {
      if (!merged.projects) merged.projects = [];
      merged.projects.push({
        id: `proj-${Date.now()}`,
        name: userInput,
        description: '',
        technologies: [],
        start_date: '',
        end_date: null,
        url: null,
      });
    }
    else {
      // Generic field path mapping
      const fieldPath = gapId.replace('gap-', '').replace(/-/g, '_');
      setNestedValue(merged, fieldPath, userInput);
    }
  }

  return merged;
}

/**
 * Set a nested value in an object using dot notation
 */
function setNestedValue(obj: any, path: string, value: string): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Validate that no data was lost during merge
 */
function validateCVPreservation(
  original: Partial<ComprehensiveCV>,
  merged: Partial<ComprehensiveCV>
): { valid: boolean; issues: string[]; summary: string } {
  const issues: string[] = [];

  // Check personal_info
  const origPI = original.personal_info || {} as any;
  const mergedPI = merged.personal_info || {} as any;

  if ((origPI as any).full_name && !(mergedPI as any).full_name) issues.push('full_name lost');
  if ((origPI as any).email && !(mergedPI as any).email) issues.push('email lost');
  if ((origPI as any).summary && !(mergedPI as any).summary) issues.push('summary lost');

  // Check work_experience count
  const origWorkCount = original.work_experience?.length || 0;
  const mergedWorkCount = merged.work_experience?.length || 0;
  if (mergedWorkCount < origWorkCount) {
    issues.push(`work_experience: ${origWorkCount} → ${mergedWorkCount}`);
  }

  // Check education count
  const origEduCount = original.education?.length || 0;
  const mergedEduCount = merged.education?.length || 0;
  if (mergedEduCount < origEduCount) {
    issues.push(`education: ${origEduCount} → ${mergedEduCount}`);
  }

  // Check skills count
  const origSkillsCount = Array.isArray(original.skills) ? original.skills.length : 0;
  const mergedSkillsCount = Array.isArray(merged.skills) ? merged.skills.length : 0;
  if (mergedSkillsCount < origSkillsCount) {
    issues.push(`skills: ${origSkillsCount} → ${mergedSkillsCount}`);
  }

  // Check certifications count
  const origCertCount = original.certifications?.length || 0;
  const mergedCertCount = merged.certifications?.length || 0;
  if (mergedCertCount < origCertCount) {
    issues.push(`certifications: ${origCertCount} → ${mergedCertCount}`);
  }

  // Check languages count
  const origLangCount = original.languages?.length || 0;
  const mergedLangCount = merged.languages?.length || 0;
  if (mergedLangCount < origLangCount) {
    issues.push(`languages: ${origLangCount} → ${mergedLangCount}`);
  }

  // Check projects count
  const origProjCount = original.projects?.length || 0;
  const mergedProjCount = merged.projects?.length || 0;
  if (mergedProjCount < origProjCount) {
    issues.push(`projects: ${origProjCount} → ${mergedProjCount}`);
  }

  const valid = issues.length === 0;
  const summary = valid
    ? `All data preserved: ${mergedWorkCount} work, ${mergedEduCount} edu, ${mergedSkillsCount} skills`
    : `Data loss detected: ${issues.join(', ')}`;

  return { valid, issues, summary };
}

// ─── Props ───

interface CVCompletionFlowProps {
  locale: 'en' | 'fa';
  aiProvider: string;
  aiModel: string;
  onComplete: (cv: Partial<ComprehensiveCV>) => void;
  onDeleteCV?: () => Promise<void>;
  refineCV?: (params: {
    currentCV?: Partial<ComprehensiveCV>;
    resolvedGaps?: { gapId: string; userInput: string }[];
    selectedDomains?: string[];
    instructions?: string;
    additionalText?: string;
    cvLanguage?: string;
    provider?: any;
    model?: string;
  }) => Promise<any>;
  existingCV?: Partial<ComprehensiveCV>;
  initialDomains?: CVDomainId[];
}

// ─── Step Config ───

const STEP_CONFIG: Record<CVCompletionStep, {
  title_en: string;
  title_fa: string;
  icon: string;
}> = {
  domain_selection: { title_en: 'Domains', title_fa: 'حوزه‌ها', icon: '🎯' },
  upload: { title_en: 'Upload CV', title_fa: 'آپلود رزومه', icon: '📄' },
  ai_extraction: { title_en: 'AI Analysis', title_fa: 'تحلیل AI', icon: '🤖' },
  classification_review: { title_en: 'Confirm Data', title_fa: 'تأیید داده‌ها', icon: '✓' },
  gap_analysis: { title_en: 'Review Gaps', title_fa: 'بررسی نواقص', icon: '📋' },
  gap_resolution: { title_en: 'Fix Gaps', title_fa: 'رفع نواقص', icon: '🔧' },
  improvement_review: { title_en: 'Review Changes', title_fa: 'بازبینی تغییرات', icon: '📝' },
  review: { title_en: 'Review', title_fa: 'بازبینی', icon: '✅' },
  complete: { title_en: 'Done', title_fa: 'تکمیل', icon: '🎉' },
};

const VISIBLE_STEPS: CVCompletionStep[] = [
  'domain_selection',
  'upload',
  'classification_review',
  'gap_analysis',
  'gap_resolution',
  'improvement_review',
  'review',
  'complete',
];

// ─── Component ───

export function CVCompletionFlow({
  locale,
  aiProvider,
  aiModel,
  onComplete,
  onDeleteCV,
  refineCV,
  existingCV,
  initialDomains,
}: CVCompletionFlowProps) {
  const isRTL = locale === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── State ───

  const [state, setState] = useState<CVCompletionState>({
    current_step: existingCV ? 'gap_analysis' : 'domain_selection',
    selected_domains: initialDomains || [],
    extracted_cv: existingCV || null,
    gap_analysis: null,
    active_gaps_count: 0,
    resolved_gaps_count: 0,
    skipped_gaps_count: 0,
    completion_percentage: 0,
    classifications: [],
    suggested_improvements: [],
    translations_applied: [],
    cv_language: 'en',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ─── Navigation ───

  const goToStep = useCallback((step: CVCompletionStep) => {
    setState(prev => ({ ...prev, current_step: step }));
    setError(null);
  }, []);

  // ─── Step 1: Domain Selection ───

  const handleDomainsChange = useCallback((domains: CVDomainId[]) => {
    setState(prev => ({ ...prev, selected_domains: domains }));
  }, []);

  const handleDomainsConfirm = useCallback(() => {
    if (state.selected_domains.length === 0) {
      setState(prev => ({ ...prev, selected_domains: ['general'] }));
    }
    goToStep('upload');
  }, [state.selected_domains, goToStep]);

  // ─── Step 2: Upload ───

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRawText('');
      setError(null);
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!selectedFile && !rawText.trim()) {
      setError(locale === 'fa'
        ? 'لطفاً فایل آپلود کنید یا متن رزومه را وارد کنید'
        : 'Please upload a file or enter CV text');
      return;
    }

    setIsLoading(true);
    setError(null);
    goToStep('ai_extraction');

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('rawText', rawText);
      }

      formData.append('provider', aiProvider);
      formData.append('model', aiModel);
      formData.append('domains', JSON.stringify(
        state.selected_domains.length > 0 ? state.selected_domains : ['general']
      ));
      formData.append('cvLanguage', state.cv_language);

      const response = await fetch('/api/cv/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
          result.extractionNotes ||
          'Extraction failed. Please try again.'
        );
      }

      const gapAnalysis: CVGapAnalysis | null = result.gapAnalysis || null;
      const activeGaps = gapAnalysis?.gaps.filter(
        (g: CVGapItem) => !g.is_skipped && !g.is_resolved
      ).length || 0;

      const cvLanguage = result.metadata?.detected_language || result.cvLanguage || 'en';

      setState(prev => ({
        ...prev,
        extracted_cv: result.cv,
        gap_analysis: gapAnalysis,
        active_gaps_count: activeGaps,
        resolved_gaps_count: 0,
        skipped_gaps_count: 0,
        completion_percentage: result.confidence || 0,
        cv_language: cvLanguage,
        classifications: [],
        suggested_improvements: result.suggestedImprovements || [],
        translations_applied: result.translationsApplied || [],
        current_step: 'gap_analysis',
      }));

    } catch (err: unknown) {
      console.error('[CVFlow] Extraction error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      goToStep('upload');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, rawText, aiProvider, aiModel, state.selected_domains, locale, goToStep]);

  // ─── Step 4-5: Gap Resolution ───

  const handleResolveGap = useCallback((gapId: string, userInput: string) => {
    setState(prev => {
      if (!prev.gap_analysis) return prev;

      const updatedGaps = prev.gap_analysis.gaps.map(g =>
        g.id === gapId
          ? { ...g, is_resolved: true, current_value: userInput }
          : g
      );

      const resolved = updatedGaps.filter(g => g.is_resolved).length;
      const skipped = updatedGaps.filter(g => g.is_skipped).length;
      const active = updatedGaps.filter(g => !g.is_resolved && !g.is_skipped).length;

      return {
        ...prev,
        gap_analysis: { ...prev.gap_analysis, gaps: updatedGaps },
        resolved_gaps_count: resolved,
        skipped_gaps_count: skipped,
        active_gaps_count: active,
        completion_percentage: Math.round(((resolved + skipped) / updatedGaps.length) * 100),
      };
    });
  }, []);

  const handleSkipGap = useCallback((gapId: string) => {
    setState(prev => {
      if (!prev.gap_analysis) return prev;

      const updatedGaps = prev.gap_analysis.gaps.map(g =>
        g.id === gapId ? { ...g, is_skipped: true } : g
      );

      const resolved = updatedGaps.filter(g => g.is_resolved).length;
      const skipped = updatedGaps.filter(g => g.is_skipped).length;
      const active = updatedGaps.filter(g => !g.is_resolved && !g.is_skipped).length;

      return {
        ...prev,
        gap_analysis: { ...prev.gap_analysis, gaps: updatedGaps },
        resolved_gaps_count: resolved,
        skipped_gaps_count: skipped,
        active_gaps_count: active,
      };
    });
  }, []);

  const handleResolutionComplete = useCallback(async () => {
    if (!state.gap_analysis || !state.extracted_cv) {
      goToStep('improvement_review');
      return;
    }

    const resolvedGaps = state.gap_analysis.gaps
      .filter(g => g.is_resolved && g.current_value)
      .map(g => ({ gapId: g.id, userInput: g.current_value! }));

    // اگر هیچ گپی رفع نشده، بدون فراخوانی API به مرحله بعد برو
    if (resolvedGaps.length === 0) {
      console.log('[CVFlow] No resolved gaps, skipping refinement');
      goToStep('improvement_review');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('[CVFlow] Sending', resolvedGaps.length, 'resolved gaps to AI for refinement');

    try {
      if (refineCV) {
        const result = await refineCV({
          currentCV: state.extracted_cv,
          resolvedGaps,
          selectedDomains: state.selected_domains,
          cvLanguage: state.cv_language,
          provider: aiProvider as any,
          model: aiModel
        });

        if (result.success && result.cv) {
          console.log('[CVFlow] AI Refinement successful');
          setState(prev => ({
            ...prev,
            extracted_cv: result.cv,
            gap_analysis: result.gapAnalysis || prev.gap_analysis,
            current_step: 'improvement_review',
          }));
        } else {
          throw new Error(result.error || result.extractionNotes || 'Refinement failed');
        }
      } else {
        // Fallback to manual merge if refineCV is not provided (shouldn't happen in real app)
        console.warn('[CVFlow] refineCV prop missing, falling back to manual merge');
        const mergedCV = mergeGapsIntoCV(state.extracted_cv, resolvedGaps, state.cv_language);
        setState(prev => ({
          ...prev,
          extracted_cv: mergedCV,
          current_step: 'improvement_review',
        }));
      }
    } catch (err: unknown) {
      console.error('[CVFlow] Refinement error:', err);
      setError(err instanceof Error ? err.message : 'AI refinement failed. Using current data.');
      // Don't block the user, allow them to see what's currently in the CV
      goToStep('improvement_review');
    } finally {
      setIsLoading(false);
    }
  }, [state.gap_analysis, state.extracted_cv, state.cv_language, goToStep, refineCV, aiProvider, aiModel, state.selected_domains]);

  // ─── Step 6: Review & Save ───

  const handleSave = useCallback(() => {
    if (state.extracted_cv) {
      onComplete(state.extracted_cv);
      goToStep('complete');
    }
  }, [state.extracted_cv, onComplete, goToStep]);

  // ─── Classification Review Handlers ───

  const handleConfirmClassification = useCallback((index: number) => {
    setState(prev => {
      const classifications = [...prev.classifications];
      if (classifications[index]) {
        classifications[index] = { ...classifications[index], is_confirmed: true };
      }
      return { ...prev, classifications };
    });
  }, []);

  const handleRejectClassification = useCallback((index: number) => {
    setState(prev => {
      const classifications = [...prev.classifications];
      if (classifications[index]) {
        classifications[index] = { ...classifications[index], is_rejected: true };
      }
      return { ...prev, classifications };
    });
  }, []);

  const handleConfirmAllClassifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      classifications: prev.classifications.map(c => ({ ...c, is_confirmed: true })),
    }));
  }, []);

  // ─── Improvement Review Handlers ───

  const handleApproveImprovement = useCallback((index: number) => {
    setState(prev => {
      const improvements = [...prev.suggested_improvements];
      if (improvements[index]) {
        improvements[index] = { ...improvements[index], is_approved: true };
      }
      return { ...prev, suggested_improvements: improvements };
    });
  }, []);

  const handleRejectImprovement = useCallback((index: number) => {
    setState(prev => {
      const improvements = [...prev.suggested_improvements];
      if (improvements[index]) {
        improvements[index] = { ...improvements[index], is_rejected: true };
      }
      return { ...prev, suggested_improvements: improvements };
    });
  }, []);

  const handleEditImprovement = useCallback((index: number, newText: string) => {
    setState(prev => {
      const improvements = [...prev.suggested_improvements];
      if (improvements[index]) {
        improvements[index] = { ...improvements[index], suggested_text: newText };
      }
      return { ...prev, suggested_improvements: improvements };
    });
  }, []);

  const handleApproveTranslation = useCallback((index: number) => {
    setState(prev => {
      const translations = [...prev.translations_applied];
      if (translations[index]) {
        translations[index] = { ...translations[index], is_approved: true };
      }
      return { ...prev, translations_applied: translations };
    });
  }, []);

  const handleRejectTranslation = useCallback((index: number) => {
    setState(prev => {
      const translations = [...prev.translations_applied];
      if (translations[index]) {
        translations[index] = { ...translations[index], is_rejected: true };
      }
      return { ...prev, translations_applied: translations };
    });
  }, []);

  const handleApplyApprovedChanges = useCallback(() => {
    // در اینجا می‌توان تغییرات تأیید شده را به CV اعمال کرد
    // فعلاً به مرحله بعد می‌رویم
    goToStep('review');
  }, [goToStep]);

  // ─── Stepper index ───

  const allSteps: CVCompletionStep[] = [
    'domain_selection', 'upload', 'ai_extraction',
    'classification_review', 'gap_analysis', 'gap_resolution',
    'improvement_review', 'review', 'complete',
  ];
  const currentStepIndex = allSteps.indexOf(state.current_step);

  // ─── Render ───

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* ═══ Stepper Header ═══ */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {VISIBLE_STEPS.map((step, index) => {
              const config = STEP_CONFIG[step];
              const stepIdx = allSteps.indexOf(step);
              const isActive = state.current_step === step ||
                (state.current_step === 'ai_extraction' && step === 'upload');
              const isPast = stepIdx < currentStepIndex &&
                state.current_step !== 'ai_extraction';

              return (
                <Fragment key={step}>
                  {index > 0 && (
                    <div className={`flex-1 h-0.5 mx-1 min-w-[16px] ${isPast ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                  )}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {isPast ? '✓' : config.icon}
                    </div>
                    <span className={`
                      text-xs hidden sm:inline whitespace-nowrap
                      ${isActive
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {locale === 'fa' ? config.title_fa : config.title_en}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Global error */}
        {error && state.current_step !== 'ai_extraction' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-500 flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  {locale === 'fa' ? 'خطا' : 'Error'}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step content */}
        {renderStepContent()}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // Step Renderers
  // ═══════════════════════════════════════════

  function renderStepContent() {
    switch (state.current_step) {

      // ─── Step 1: Domain Selection ───
      case 'domain_selection':
        return (
          <div className="space-y-6">
            <DomainSelector
              selectedDomains={state.selected_domains}
              onDomainsChange={handleDomainsChange}
              locale={locale}
              maxSelections={5}
            />

            {/* CV Language Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {locale === 'fa' ? '🌐 زبان رزومه' : '🌐 CV Language'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {locale === 'fa'
                  ? 'زبان اصلی رزومه خود را انتخاب کنید. همه محتوای رزومه به این زبان خواهد بود.'
                  : 'Select the primary language of your CV. All CV content will be in this language.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, cv_language: 'en' }))}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${state.cv_language === 'en'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl">🇬🇧</span>
                  <span className="block mt-2 font-medium">English</span>
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, cv_language: 'fa' }))}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${state.cv_language === 'fa'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl">🇮🇷</span>
                  <span className="block mt-2 font-medium">فارسی</span>
                </button>
              </div>
            </div>

            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              {existingCV && (
                <button
                  onClick={() => goToStep('review')}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1"
                >
                  📂 {locale === 'fa' ? 'مشاهده مستقیم رزومه قبلی' : 'View saved CV directly'}
                </button>
              )}
              <button
                onClick={handleDomainsConfirm}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium flex items-center gap-2 shadow-sm ms-auto"
              >
                {locale === 'fa' ? 'ادامه' : 'Continue'}
                <span>{isRTL ? '←' : '→'}</span>
              </button>
            </div>
          </div>
        );

      // ─── Step 2: Upload ───
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {locale === 'fa' ? '📄 رزومه خود را آپلود کنید' : '📄 Upload Your CV'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {locale === 'fa'
                  ? 'فایل PDF یا DOCX آپلود کنید، یا متن رزومه را مستقیماً وارد کنید'
                  : 'Upload a PDF or DOCX file, or paste your CV text directly'}
              </p>
            </div>

            {/* File upload area */}
            <div
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${selectedFile
                  ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <>
                  <span className="text-4xl">✅</span>
                  <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                  >
                    {locale === 'fa' ? 'حذف فایل' : 'Remove file'}
                  </button>
                </>
              ) : (
                <>
                  <span className="text-4xl">📎</span>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'fa'
                      ? 'برای انتخاب فایل کلیک کنید یا فایل را اینجا بکشید'
                      : 'Click to select a file or drag & drop'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    PDF, DOCX, DOC, TXT
                  </p>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 font-medium">
                {locale === 'fa' ? 'یا' : 'OR'}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Text input */}
            <div>
              <textarea
                value={rawText}
                onChange={e => {
                  setRawText(e.target.value);
                  if (e.target.value.trim()) setSelectedFile(null);
                }}
                placeholder={locale === 'fa'
                  ? 'متن رزومه خود را اینجا بچسبانید...'
                  : 'Paste your CV text here...'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-y min-h-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {rawText.trim() && (
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'fa'
                    ? `${rawText.trim().split(/\s+/).length} کلمه`
                    : `${rawText.trim().split(/\s+/).length} words`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => goToStep('domain_selection')}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {isRTL ? '→' : '←'} {locale === 'fa' ? 'بازگشت' : 'Back'}
              </button>
              <button
                onClick={handleExtract}
                disabled={!selectedFile && !rawText.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                🤖 {locale === 'fa' ? 'تحلیل با AI' : 'Analyze with AI'}
              </button>
            </div>

            {/* Clear existing CV option */}
            {existingCV && onDeleteCV && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <button
                  onClick={async () => {
                    if (window.confirm(locale === 'fa' ? 'آیا از حذف رزومه فعلی و شروع مجدد اطمینان دارید؟' : 'Are you sure you want to delete the existing CV and start over?')) {
                      await onDeleteCV();
                      setState(prev => ({ ...prev, extracted_cv: null, gap_analysis: null }));
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  🗑️ {locale === 'fa' ? 'حذف رزومه قبلی و شروع مجدد' : 'Delete existing CV and start over'}
                </button>
              </div>
            )}
          </div>
        );

      // ─── Step 3: AI Extraction (Loading) ───
      case 'ai_extraction':
        return (
          <div className="max-w-lg mx-auto text-center py-20 space-y-6">
            {/* Animated robot */}
            <div className="relative inline-block">
              <span className="text-6xl block animate-bounce" style={{ animationDuration: '2s' }}>
                🤖
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {locale === 'fa' ? 'در حال تحلیل رزومه شما...' : 'Analyzing your CV...'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                {locale === 'fa'
                  ? 'هوش مصنوعی در حال استخراج اطلاعات، شناسایی نواقص و تحلیل نقاط قوت رزومه شماست. این فرآیند ممکن است ۱۵-۳۰ ثانیه طول بکشد.'
                  : 'AI is extracting information, identifying gaps, and analyzing your CV strengths. This may take 15-30 seconds.'}
              </p>
            </div>

            {/* Loading bar */}
            <div className="w-64 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  animation: 'loading-sweep 2.5s ease-in-out infinite',
                }}
              />
            </div>

            {/* Steps indicator */}
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <p>📄 {locale === 'fa' ? 'خواندن متن رزومه...' : 'Reading CV text...'}</p>
              <p>🔍 {locale === 'fa' ? 'استخراج اطلاعات ساختاریافته...' : 'Extracting structured data...'}</p>
              <p>📊 {locale === 'fa' ? 'تحلیل نواقص بر اساس حوزه‌ها...' : 'Analyzing gaps for selected domains...'}</p>
            </div>

            <style jsx>{`
              @keyframes loading-sweep {
                0% { width: 0%; margin-left: 0%; }
                50% { width: 60%; margin-left: 20%; }
                100% { width: 0%; margin-left: 100%; }
              }
            `}</style>
          </div>
        );

      // ─── Step: Classification Review ───
      case 'classification_review':
        return (
          <ClassificationReview
            classifications={state.classifications}
            locale={locale}
            onConfirm={handleConfirmClassification}
            onReject={handleRejectClassification}
            onConfirmAll={handleConfirmAllClassifications}
            onContinue={() => goToStep('gap_analysis')}
          />
        );

      // ─── Step 4: Gap Analysis Dashboard ───
      case 'gap_analysis':
        if (!state.gap_analysis) {
          return (
            <div className="text-center py-12">
              <span className="text-4xl">📋</span>
              <p className="text-gray-500 dark:text-gray-400 mt-3">
                {locale === 'fa' ? 'داده‌ای برای نمایش وجود ندارد' : 'No analysis data available'}
              </p>
              <button
                onClick={() => goToStep('upload')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                {locale === 'fa' ? 'بازگشت و تلاش مجدد' : 'Go back and try again'}
              </button>
            </div>
          );
        }
        return (
          <GapAnalysisDashboard
            analysis={state.gap_analysis}
            locale={locale}
            onStartResolving={() => goToStep('gap_resolution')}
            onGapClick={() => goToStep('gap_resolution')}
          />
        );

      // ─── Step 5: Gap Resolution Wizard ───
      case 'gap_resolution':
        if (!state.gap_analysis) return null;
        return (
          <GapResolutionWizard
            gaps={state.gap_analysis.gaps}
            locale={locale}
            onResolve={handleResolveGap}
            onSkip={handleSkipGap}
            onComplete={handleResolutionComplete}
            onBack={() => goToStep('gap_analysis')}
            isLoading={isLoading}
          />
        );

      // ─── Step: Improvement Review ───
      case 'improvement_review':
        return (
          <ImprovementReview
            improvements={state.suggested_improvements}
            translations={state.translations_applied}
            locale={locale}
            cvLanguage={state.cv_language}
            onApproveImprovement={handleApproveImprovement}
            onRejectImprovement={handleRejectImprovement}
            onEditImprovement={handleEditImprovement}
            onApproveTranslation={handleApproveTranslation}
            onRejectTranslation={handleRejectTranslation}
            onApplyAll={handleApplyApprovedChanges}
            onSkip={() => goToStep('review')}
          />
        );

      // ─── Step 6: Review ───
      case 'review':
        return renderReviewStep();

      // ─── Step 7: Complete ───
      case 'complete':
        return (
          <div className="text-center py-20">
            <span className="text-7xl block">🎉</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
              {locale === 'fa' ? 'رزومه جامع شما ذخیره شد!' : 'Your Comprehensive CV is Saved!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-lg mx-auto">
              {locale === 'fa'
                ? 'اکنون می‌توانید از رزومه جامع خود برای تولید رزومه‌های سفارشی متناسب با هر شغل استفاده کنید. برای هر آگهی شغلی، AI رزومه‌ای مخصوص آن موقعیت ایجاد خواهد کرد.'
                : 'You can now use your comprehensive CV to generate tailored resumes for each job application. For each job posting, AI will create a resume customized for that position.'}
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════
  // Review Step Renderer
  // ═══════════════════════════════════════════

  function renderReviewStep() {
    const cv = state.extracted_cv;
    if (!cv) return null;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-5xl block">✅</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-3">
            {locale === 'fa' ? 'بازبینی نهایی رزومه جامع' : 'Final Review of Comprehensive CV'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {locale === 'fa'
              ? 'رزومه جامع شما آماده است. قبل از ذخیره، آن را بازبینی کنید.'
              : 'Your comprehensive CV is ready. Review it before saving.'}
          </p>
        </div>

        {/* Loading overlay for refinement */}
        {isLoading && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
            <span className="text-2xl animate-spin inline-block">⚙️</span>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              {locale === 'fa'
                ? 'در حال بهبود رزومه با اطلاعات جدید...'
                : 'Improving CV with new information...'}
            </p>
          </div>
        )}

        {/* CV Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">

          {/* Personal Info */}
          <ReviewSection
            title={`👤 ${locale === 'fa' ? 'اطلاعات شخصی' : 'Personal Info'}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <ReviewField label={locale === 'fa' ? 'نام' : 'Name'} value={cv.personal_info?.full_name} />
              <ReviewField label={locale === 'fa' ? 'ایمیل' : 'Email'} value={cv.personal_info?.email} />
              <ReviewField label={locale === 'fa' ? 'تلفن' : 'Phone'} value={cv.personal_info?.phone} />
              <ReviewField label={locale === 'fa' ? 'مکان' : 'Location'} value={cv.personal_info?.location} />
              <ReviewField label="LinkedIn" value={cv.personal_info?.linkedin_url} />
              <ReviewField label={locale === 'fa' ? 'وبسایت' : 'Website'} value={cv.personal_info?.website_url} />
            </div>
          </ReviewSection>

          {/* Summary */}
          {cv.personal_info?.summary && (
            <ReviewSection
              title={`📝 ${locale === 'fa' ? 'خلاصه حرفه‌ای' : 'Professional Summary'}`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {cv.personal_info.summary}
              </p>
            </ReviewSection>
          )}

          {/* Work Experience */}
          <ReviewSection
            title={`💼 ${locale === 'fa' ? 'سوابق شغلی' : 'Work Experience'} (${cv.work_experience?.length || 0})`}
          >
            {(cv.work_experience?.length || 0) > 0 ? (
              <div className="space-y-3">
                {cv.work_experience!.map((w, i) => (
                  <div key={w.id || i} className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {w.job_title} {w.company && `@ ${w.company}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {w.start_date}{w.is_current ? ` — ${locale === 'fa' ? 'اکنون' : 'Present'}` : w.end_date ? ` — ${w.end_date}` : ''}
                      {w.location ? ` • ${w.location}` : ''}
                    </div>
                    {w.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{w.description}</p>
                    )}
                    {w.achievements && w.achievements.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {w.achievements.map((a, j) => (
                          <li key={j} className="flex items-start gap-1 text-gray-600 dark:text-gray-400">
                            <span className="text-gray-400 flex-shrink-0">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </ReviewSection>

          {/* Education */}
          <ReviewSection
            title={`🎓 ${locale === 'fa' ? 'تحصیلات' : 'Education'} (${cv.education?.length || 0})`}
          >
            {(cv.education?.length || 0) > 0 ? (
              <div className="space-y-2">
                {cv.education!.map((e, i) => (
                  <div key={e.id || i} className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {e.degree}{e.field_of_study ? ` — ${e.field_of_study}` : ''}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {e.institution}
                      {e.end_date ? ` (${e.end_date})` : ''}
                      {e.gpa ? ` • GPA: ${e.gpa}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </ReviewSection>

          {/* Skills */}
          <ReviewSection
            title={`🛠 ${locale === 'fa' ? 'مهارت‌ها' : 'Skills'} (${cv.skills?.length || 0})`}
          >
            {(cv.skills?.length || 0) > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {cv.skills!.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </ReviewSection>

          {/* Certifications */}
          {(cv.certifications?.length || 0) > 0 && (
            <ReviewSection
              title={`📜 ${locale === 'fa' ? 'گواهینامه‌ها' : 'Certifications'} (${cv.certifications!.length})`}
            >
              <div className="space-y-1">
                {cv.certifications!.map((c, i) => (
                  <div key={c.id || i} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{c.name}</span>
                    {c.issuer && <span className="text-gray-500"> — {c.issuer}</span>}
                    {c.date_obtained && <span className="text-gray-400 text-xs"> ({c.date_obtained})</span>}
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {/* Languages */}
          {(cv.languages?.length || 0) > 0 && (
            <ReviewSection
              title={`🌐 ${locale === 'fa' ? 'زبان‌ها' : 'Languages'} (${cv.languages!.length})`}
            >
              <div className="flex flex-wrap gap-2">
                {cv.languages!.map((l, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs">
                    {l.language} ({l.proficiency})
                  </span>
                ))}
              </div>
            </ReviewSection>
          )}

          {/* Projects */}
          {(cv.projects?.length || 0) > 0 && (
            <ReviewSection
              title={`🚀 ${locale === 'fa' ? 'پروژه‌ها' : 'Projects'} (${cv.projects!.length})`}
            >
              <div className="space-y-2">
                {cv.projects!.map((p, i) => (
                  <div key={p.id || i} className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {p.name}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs ms-2">
                          🔗
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{p.description}</p>
                    )}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.technologies.map((t, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {/* Additional Sections */}
          {(cv.additional_sections?.length || 0) > 0 && (
            <ReviewSection
              title={`📎 ${locale === 'fa' ? 'بخش‌های اضافی' : 'Additional'} (${cv.additional_sections!.length})`}
            >
              <div className="space-y-2">
                {cv.additional_sections!.map((s, i) => (
                  <div key={s.id || i} className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{s.title}</div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{s.content}</p>
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => goToStep('gap_analysis')}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isRTL ? '→' : '←'} {locale === 'fa' ? 'بازگشت به نواقص' : 'Back to Gaps'}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            💾 {locale === 'fa' ? 'ذخیره رزومه جامع' : 'Save Comprehensive CV'}
          </button>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════
// Helper Sub-components
// ═══════════════════════════════════════════

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ReviewField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400">{label}: </span>
      <span className="text-gray-800 dark:text-gray-200">
        {value && value.trim() ? value : '—'}
      </span>
    </div>
  );
}

function EmptyState({ locale }: { locale: 'en' | 'fa' }) {
  return (
    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
      {locale === 'fa' ? 'موردی یافت نشد' : 'None found'}
    </p>
  );
}
