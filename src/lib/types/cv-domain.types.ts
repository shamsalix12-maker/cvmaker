// ============================================
// src/lib/types/cv-domain.types.ts
// Domain-Aware CV Types
// ============================================

/**
 * حوزه‌های شغلی - کاربر یک یا چند مورد انتخاب می‌کند
 */
export type CVDomainId =
  | 'software_engineering'
  | 'data_science'
  | 'product_management'
  | 'design_ux'
  | 'marketing'
  | 'sales'
  | 'finance_accounting'
  | 'healthcare_medical'
  | 'academia_research'
  | 'engineering_mechanical'
  | 'engineering_electrical'
  | 'engineering_civil'
  | 'legal'
  | 'hr_recruiting'
  | 'operations_logistics'
  | 'education_teaching'
  | 'media_journalism'
  | 'consulting'
  | 'nonprofit'
  | 'government'
  | 'hospitality_tourism'
  | 'creative_arts'
  | 'general';

/**
 * تعریف یک حوزه شغلی
 */
export interface CVDomain {
  id: CVDomainId;
  label_en: string;
  label_fa: string;
  icon: string;
  description_en: string;
  description_fa: string;
  /** بخش‌های اختصاصی این حوزه */
  specific_sections: DomainSpecificSection[];
  /** فیلدهایی که برای این حوزه حیاتی هستند */
  critical_fields: string[];
  /** کلمات کلیدی برای تشخیص خودکار حوزه از متن CV */
  detection_keywords: string[];
}

/**
 * بخش اختصاصی یک حوزه (مثلاً "GitHub Portfolio" برای مهندسی نرم‌افزار)
 */
export interface DomainSpecificSection {
  id: string;
  label_en: string;
  label_fa: string;
  description_en: string;
  description_fa: string;
  is_required: boolean;
  example_en: string;
  example_fa: string;
}

// ─── Gap Analysis Types ───

export type GapSeverity = 'critical' | 'important' | 'recommended' | 'optional';

export type GapCategory =
  | 'missing_section'
  | 'incomplete_content'
  | 'weak_description'
  | 'missing_metrics'
  | 'formatting_issue'
  | 'missing_keywords'
  | 'domain_specific';

export type GapInputType =
  | 'text'
  | 'textarea'
  | 'list'
  | 'date'
  | 'select'
  | 'experience'
  | 'education'
  | 'certification'
  | 'project'
  | 'confirm';

/**
 * یک نقص شناسایی‌شده در CV
 */
export interface CVGapItem {
  id: string;
  field_path: string;
  title_en: string;
  title_fa: string;
  description_en: string;
  description_fa: string;
  severity: GapSeverity;
  category: GapCategory;
  relevant_domains: CVDomainId[];
  fix_guidance_en: string;
  fix_guidance_fa: string;
  fix_example_en: string;
  fix_example_fa: string;
  input_type: GapInputType;
  is_skipped: boolean;
  is_resolved: boolean;
  current_value?: string;
  suggested_value?: string;
  /** آیا کاربر می‌تواند این گپ را رد کند؟ */
  can_skip: boolean;
}

/**
 * نقطه قوت CV
 */
export interface CVStrengthItem {
  title_en: string;
  title_fa: string;
  description_en: string;
  description_fa: string;
  relevant_domains: CVDomainId[];
}

/**
 * نتیجه کامل آنالیز نواقص
 */
export interface CVGapAnalysis {
  selected_domains: CVDomainId[];
  detected_domains: CVDomainId[];
  overall_score: number;
  domain_scores: Record<string, number>;
  gaps: CVGapItem[];
  strengths: CVStrengthItem[];
  analysis_summary: string;
  general_recommendations: string[];
}

// ─── Classification & Improvement Types ───

/**
 * آیتم طبقه‌بندی شده توسط AI که نیاز به تأیید کاربر دارد
 */
export interface ClassificationItem {
  field_path: string;
  original_text: string;
  extracted_value: string;
  confidence: 'high' | 'medium' | 'low';
  needs_user_confirmation: boolean;
  is_confirmed: boolean;
  is_rejected: boolean;
}

/**
 * پیشنهاد بهبود توسط AI - نیاز به تأیید کاربر دارد
 */
export interface SuggestedImprovement {
  id: string;
  field_path: string;
  current_text: string;
  suggested_text: string;
  reason_en: string;
  reason_fa: string;
  is_approved: boolean;
  is_rejected: boolean;
}

/**
 * ترجمه اعمال شده به زبان CV
 */
export interface TranslationApplied {
  id: string;
  field_path: string;
  original_input: string;
  original_language: string;
  translated_text: string;
  target_language: string;
  is_approved: boolean;
  is_rejected: boolean;
}

/**
 * نتیجه Refinement شامل بهبودها و ترجمه‌ها
 */
export interface RefinementResult {
  cv: Partial<import('@/lib/types').ComprehensiveCV>;
  suggested_improvements: SuggestedImprovement[];
  translations_applied: TranslationApplied[];
  gap_analysis: CVGapAnalysis | null;
  cv_language: string;
}

// ─── Completion Flow Types ───

export type CVCompletionStep =
  | 'domain_selection'
  | 'upload'
  | 'ai_extraction'
  | 'classification_review'
  | 'gap_analysis'
  | 'gap_resolution'
  | 'improvement_review'
  | 'review'
  | 'complete';

export interface CVCompletionState {
  current_step: CVCompletionStep;
  selected_domains: CVDomainId[];
  extracted_cv: Partial<import('@/lib/types').ComprehensiveCV> | null;
  gap_analysis: CVGapAnalysis | null;
  active_gaps_count: number;
  resolved_gaps_count: number;
  skipped_gaps_count: number;
  completion_percentage: number;
  /** طبقه‌بندی‌های هوشمند که نیاز به تأیید دارند */
  classifications: ClassificationItem[];
  /** پیشنهادهای بهبود */
  suggested_improvements: SuggestedImprovement[];
  /** ترجمه‌های اعمال شده */
  translations_applied: TranslationApplied[];
  /** زبان اصلی CV */
  cv_language: string;
  /** نسخه موتور استخراج */
  manager_version?: string;
  /** مرحله استخراج فعلی (برای نسخه ۲) */
  current_stage?: string;
  /** لیست مراحل استخراج (برای نسخه ۲) */
  extraction_stages?: string[];
}
