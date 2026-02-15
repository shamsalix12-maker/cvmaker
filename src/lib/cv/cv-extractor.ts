// ============================================
// src/lib/cv/cv-extractor.ts
// Domain-Aware AI-Powered CV Extraction & Gap Analysis
// ============================================

import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import {
  CVExtractionResult,
  CVExtractionRequest,
  ComprehensiveCV,
  AIProviderName,
  CVFieldStatus,
} from '@/lib/types';
import {
  CVGapAnalysis,
  CVGapItem,
  CVStrengthItem,
  CVDomainId,
  GapSeverity,
  GapCategory,
  GapInputType,
  SuggestedImprovement,
  TranslationApplied,
} from '@/lib/types/cv-domain.types';
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
  buildRefinementSystemPrompt,
  buildRefinementUserPrompt,
} from './cv-extraction-prompt';
import { validateExtractedCV, getCompletionPercentage } from './cv-validator';
import { detectDomains, CV_DOMAINS } from './cv-domains';
import {
  extractCVMultiStage,
  safeRefineCV,
  validateExtraction,
  validateLanguage,
  safeParseJSON,
} from './multi-stage-extractor';

// ═══════════════════════════════════════════
// Enhanced Types
// ═══════════════════════════════════════════

import { CVManagerFactory, CVManagerVersion } from './managers/manager-factory';
import { CVRefinementRequest } from './managers/types';

// ═══════════════════════════════════════════
// Enhanced Types (Kept for compatibility)
// ═══════════════════════════════════════════

/**
 * نتیجه استخراج پیشرفته شامل Gap Analysis
 * سازگار با CVExtractionResult قبلی + فیلدهای اضافی
 */
export interface EnhancedCVExtractionResult extends Omit<CVExtractionResult, 'cv' | 'fieldStatuses'> {
  cv: Partial<ComprehensiveCV> | null;
  fieldStatuses: CVFieldStatus[];
  /** تحلیل نواقص */
  gapAnalysis: CVGapAnalysis | null;
  /** حوزه‌های شناسایی‌شده از متن */
  detectedDomains: { domain: CVDomainId; score: number }[];
  /** متادیتای استخراج */
  metadata: {
    confidence: number;
    detected_language: string;
    cv_format_quality: string;
    estimated_experience_years: number | null;
    career_level: string;
    notes: string;
  } | null;
  /** پیشنهادهای بهبود - نیاز به تأیید کاربر */
  suggestedImprovements?: SuggestedImprovement[];
  /** ترجمه‌های اعمال شده */
  translationsApplied?: TranslationApplied[];
  /** زبان اصلی CV */
  cvLanguage?: string;
  /** نسخه منیجر استفاده شده */
  managerVersion?: string;
}

/**
 * درخواست استخراج پیشرفته شامل حوزه‌ها
 */
export interface EnhancedCVExtractionRequest extends CVExtractionRequest {
  selectedDomains: CVDomainId[];
  cvLanguage?: string;
  managerVersion?: string;
}

// ═══════════════════════════════════════════
// تابع اصلی استخراج (نسخه مدیریت شده)
// ═══════════════════════════════════════════

/**
 * استخراج CV با AI - با قابلیت سوئیچ بین منیجرهای مختلف (A/B Testing)
 */
export async function extractCVWithAI(
  request: EnhancedCVExtractionRequest | CVExtractionRequest,
  apiKey: string
): Promise<EnhancedCVExtractionResult> {
  // انتخاب نسخه منیجر (پایدار یا آزمایشی)
  const version = (request as any).managerVersion || CVManagerVersion.V1_STABLE;
  const manager = CVManagerFactory.getManager(version);

  console.log(`[CV Extractor] Delegating to manager: ${manager.id} (${manager.version})`);

  const result = await manager.extract({ ...request, apiKey } as any);

  return {
    ...result,
    managerVersion: manager.version
  };
}

// ═══════════════════════════════════════════
// تابع اصلاح (Refinement - نسخه مدیریت شده)
// ═══════════════════════════════════════════

/**
 * اصلاح CV با اطلاعات جدید از کاربر
 */
export async function refineCVWithAI(
  currentCV: Partial<ComprehensiveCV>,
  apiKey: string,
  aiProvider: string,
  aiModel: string,
  selectedDomains?: CVDomainId[],
  resolvedGaps?: { gapId: string; userInput: string }[],
  instructions?: string,
  additionalText?: string,
  cvLanguage?: string,
  managerVersion: string = CVManagerVersion.V1_STABLE
): Promise<EnhancedCVExtractionResult> {
  // انتخاب نسخه منیجر
  const manager = CVManagerFactory.getManager(managerVersion);

  console.log(`[CV Refiner] Delegating to manager: ${manager.id} (${manager.version})`);

  const refinementRequest: CVRefinementRequest & { apiKey: string } = {
    currentCV,
    resolvedGaps: resolvedGaps || [],
    additionalText,
    instructions,
    selectedDomains: selectedDomains || [],
    cvLanguage,
    provider: aiProvider,
    model: aiModel,
    apiKey
  };

  const result = await manager.refine(refinementRequest);

  return {
    ...result,
    managerVersion: manager.version
  };
}

// ═══════════════════════════════════════════
// تبدیل داده‌ها (Transformers)
// ═══════════════════════════════════════════

/**
 * تبدیل خروجی AI به ساختار ComprehensiveCV
 * پشتیبانی از هر دو فرمت: nested (extracted_data) و flat
 */
function transformExtractedData(
  parsed: any,
  rawText?: string
): Partial<ComprehensiveCV> {
  // AI ممکن است extracted_data را nested یا flat برگرداند
  const data = parsed.extracted_data || parsed;

  // ─── Personal Info ───
  const pi = data.personal_info || data.personal || data.profile || {};
  const personal_info = {
    full_name: firstNonEmpty(pi.full_name, pi.name, pi.fullName, pi.name_and_surname) || '',
    email: firstNonEmpty(pi.email, pi.email_address, pi.contact_email) || '',
    phone: firstNonEmpty(pi.phone, pi.phone_number, pi.mobile, pi.contact_number) || '',
    location: firstNonEmpty(pi.location, pi.address, pi.city, pi.permanent_address) || '',
    linkedin_url: firstNonEmpty(pi.linkedin_url, pi.linkedin) || '',
    website_url: firstNonEmpty(pi.website_url, pi.website, pi.portfolio) || '',
    summary: firstNonEmpty(pi.summary, pi.professional_summary, pi.about, pi.research_summary, pi.objective) || '',
  };

  // ─── Work Experience ───
  const rawExperience = data.work_experience || data.experience || data.work_history || data.historical_positions || [];
  const work_experience = ensureArray(rawExperience).map((item: any, idx: number) => ({
    id: item.id || `work-${idx + 1}`,
    job_title: item.job_title || item.title || item.position || '',
    company: item.company || item.organization || item.employer || '',
    location: item.location || '',
    start_date: item.start_date || '',
    end_date: item.end_date || null,
    is_current: Boolean(item.is_current),
    description: item.description || '',
    achievements: ensureStringArray(item.achievements),
  }));

  // ─── Education ───
  const rawEducation = data.education || data.educational_qualification || data.academic_background || [];
  const education = ensureArray(rawEducation).map((item: any, idx: number) => ({
    id: item.id || `edu-${idx + 1}`,
    degree: item.degree || '',
    field_of_study: item.field_of_study || item.major || item.field || '',
    institution: item.institution || item.university || item.school || '',
    location: item.location || '',
    start_date: item.start_date || '',
    end_date: item.end_date || '',
    gpa: item.gpa || null,
    description: item.description || '',
  }));

  // ─── Skills ───
  const skills = normalizeSkills(data.skills);

  // ─── Certifications ───
  const rawCerts = data.certifications || data.certificates || data.awards || [];
  const certifications = ensureArray(rawCerts).map((item: any, idx: number) => ({
    id: item.id || `cert-${idx + 1}`,
    name: item.name || item.title || '',
    issuer: item.issuer || item.organization || item.issued_by || '',
    date_obtained: item.date_obtained || item.date || '',
    expiry_date: item.expiry_date || null,
    credential_id: item.credential_id || null,
    credential_url: item.credential_url || null,
  }));

  // ─── Languages ───
  const rawLangs = data.languages || data.language_proficiency || [];
  const languages = ensureArray(rawLangs).map((item: any) => {
    if (typeof item === 'string') {
      return { language: item, proficiency: 'intermediate' as const };
    }
    return {
      language: item.language || item.name || '',
      proficiency: normalizeProficiency(item.proficiency || item.level),
    };
  });

  // ─── Projects ───
  const rawProjects = data.projects || data.research_projects || [];
  const projects = ensureArray(rawProjects).map((item: any, idx: number) => ({
    id: item.id || `proj-${idx + 1}`,
    name: item.name || item.title || '',
    description: item.description || '',
    technologies: ensureStringArray(item.technologies || item.tech_stack),
    url: item.url || null,
    start_date: item.start_date || null,
    end_date: item.end_date || null,
  }));

  // ─── Additional / Domain-specific Sections ───
  const rawAdditional = data.additional_sections || [];
  const rawDomainSections = data.domain_specific_sections || [];
  const additional_sections = [
    ...ensureArray(rawAdditional),
    ...ensureArray(rawDomainSections),
  ]
    .filter((item: any) => item.content && String(item.content).trim().length > 0)
    .map((item: any, idx: number) => ({
      id: item.id || `add-${idx + 1}`,
      title: item.title || item.label || '',
      content: item.content || '',
    }));

  return {
    personal_info,
    work_experience,
    education,
    skills,
    certifications,
    languages,
    projects,
    additional_sections,
    raw_text: rawText || data.raw_text || '',
  };
}

/**
 * تبدیل خروجی gap_analysis از AI به ساختار CVGapAnalysis
 */
function transformGapAnalysis(
  parsed: any,
  selectedDomains: CVDomainId[]
): CVGapAnalysis | null {
  const gapData = parsed.gap_analysis;
  if (!gapData) {
    console.warn('[CV Extractor] No gap_analysis in AI response - generating basic gaps');
    return generateBasicGaps(parsed, selectedDomains);
  }

  // ─── Gaps ───
  const rawGaps = ensureArray(gapData.gaps);
  console.log('[CV Extractor] transformGapAnalysis - raw gaps count:', rawGaps.length);

  // اگر gaps خالی است، گپ‌های پایه تولید کن
  if (rawGaps.length === 0) {
    console.log('[CV Extractor] Empty gaps array - generating basic gaps');
    return generateBasicGaps(parsed, selectedDomains);
  }

  const gaps: CVGapItem[] = rawGaps.map((g: any, idx: number) => ({
    id: g.id || `gap-${idx + 1}`,
    field_path: g.field_path || '',
    title_en: g.title_en || g.title || '',
    title_fa: g.title_fa || '',
    description_en: g.description_en || g.description || '',
    description_fa: g.description_fa || '',
    severity: validateSeverity(g.severity),
    category: validateCategory(g.category),
    relevant_domains: ensureStringArray(g.relevant_domains) as CVDomainId[],
    fix_guidance_en: g.fix_guidance_en || g.fix_guidance || '',
    fix_guidance_fa: g.fix_guidance_fa || '',
    fix_example_en: g.fix_example_en || g.fix_example || '',
    fix_example_fa: g.fix_example_fa || '',
    input_type: validateInputType(g.input_type),
    is_skipped: false,
    is_resolved: false,
    current_value: g.current_value || undefined,
    suggested_value: g.suggested_value || undefined,
    can_skip: g.can_skip !== false,
  }));

  // مرتب‌سازی بر اساس شدت
  const severityOrder: Record<GapSeverity, number> = {
    critical: 0,
    important: 1,
    recommended: 2,
    optional: 3,
  };
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // ─── Strengths ───
  const rawStrengths = ensureArray(gapData.strengths);
  const strengths: CVStrengthItem[] = rawStrengths.map((s: any) => ({
    title_en: s.title_en || s.title || '',
    title_fa: s.title_fa || '',
    description_en: s.description_en || s.description || '',
    description_fa: s.description_fa || '',
    relevant_domains: ensureStringArray(s.relevant_domains) as CVDomainId[],
  }));

  // ─── Scores ───
  const domainScores: Record<string, number> = {};
  const rawScores = gapData.domain_relevance_scores || {};
  for (const domainId of selectedDomains) {
    domainScores[domainId] = typeof rawScores[domainId] === 'number'
      ? Math.min(100, Math.max(0, rawScores[domainId]))
      : 0;
  }

  // ─── Detected domains ───
  const detectedDomains = ensureStringArray(gapData.detected_domains) as CVDomainId[];

  // ─── Summary & Recommendations ───
  const analysisSummary =
    gapData.analysis_summary_en ||
    gapData.analysis_summary ||
    '';

  const recommendations =
    gapData.general_recommendations_en ||
    gapData.general_recommendations ||
    [];

  return {
    selected_domains: selectedDomains,
    detected_domains: detectedDomains,
    overall_score: typeof gapData.overall_score === 'number'
      ? Math.min(100, Math.max(0, gapData.overall_score))
      : 0,
    domain_scores: domainScores,
    gaps,
    strengths,
    analysis_summary: analysisSummary,
    general_recommendations: ensureStringArray(recommendations),
  };
}

/**
 * ساخت CVGapAnalysis از gaps تولید شده
 */
function buildGapAnalysisFromGaps(
  gapResult: { gaps: any[]; strengths: any[]; overall_score: number },
  selectedDomains: CVDomainId[]
): CVGapAnalysis {
  const gaps: CVGapItem[] = gapResult.gaps.map((g: any, idx: number) => ({
    id: g.id || `gap-${idx + 1}`,
    field_path: g.field_path || '',
    title_en: g.title_en || g.title || '',
    title_fa: g.title_fa || '',
    description_en: g.description_en || g.description || '',
    description_fa: g.description_fa || '',
    severity: validateSeverity(g.severity),
    category: validateCategory(g.category),
    relevant_domains: ensureStringArray(g.relevant_domains) as CVDomainId[],
    fix_guidance_en: g.fix_guidance_en || g.fix_guidance || '',
    fix_guidance_fa: g.fix_guidance_fa || '',
    fix_example_en: g.fix_example_en || g.fix_example || '',
    fix_example_fa: g.fix_example_fa || '',
    input_type: validateInputType(g.input_type),
    is_skipped: false,
    is_resolved: false,
    current_value: g.current_value || undefined,
    suggested_value: g.suggested_value || undefined,
    can_skip: true,
  }));

  const strengths: CVStrengthItem[] = gapResult.strengths.map((s: any) => ({
    title_en: s.title_en || s.title || '',
    title_fa: s.title_fa || '',
    description_en: s.description_en || s.description || '',
    description_fa: s.description_fa || '',
    relevant_domains: ensureStringArray(s.relevant_domains) as CVDomainId[],
  }));

  return {
    selected_domains: selectedDomains,
    detected_domains: selectedDomains,
    overall_score: gapResult.overall_score,
    domain_scores: {},
    gaps,
    strengths,
    analysis_summary: 'Gap analysis generated from extracted data.',
    general_recommendations: [],
  };
}

/**
 * ساخت gap analysis خالی برای مواقعی که AI تحلیل نکرده
 */
function buildEmptyGapAnalysis(selectedDomains: CVDomainId[], message: string): CVGapAnalysis {
  return {
    selected_domains: selectedDomains,
    detected_domains: selectedDomains,
    overall_score: 50,
    domain_scores: {},
    gaps: [{
      id: 'gap-analysis-incomplete',
      field_path: '',
      title_en: 'Analysis Incomplete',
      title_fa: 'تحلیل ناقص',
      description_en: message || 'AI could not complete gap analysis. Please try again or use a different model.',
      description_fa: 'AI نتوانست تحلیل نواقص را تکمیل کند. لطفاً دوباره تلاش کنید.',
      severity: 'critical',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Re-run extraction or try a different AI model.',
      fix_guidance_fa: 'استخراج را مجدداً انجام دهید یا مدل AI دیگری امتحان کنید.',
      fix_example_en: '',
      fix_example_fa: '',
      input_type: 'confirm',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    }],
    strengths: [],
    analysis_summary: 'Gap analysis incomplete.',
    general_recommendations: ['Try using a different AI model.'],
  };
}

/**
 * تولید گپ‌های پایه بر اساس داده‌های استخراج شده
 * فقط زمانی استفاده می‌شود که AI گپ نفرستاده باشد
 */
function generateBasicGaps(parsed: any, selectedDomains: CVDomainId[]): CVGapAnalysis {
  const data = parsed.extracted_data || parsed;
  const gaps: CVGapItem[] = [];
  const strengths: CVStrengthItem[] = [];

  const pi = data.personal_info || {};

  // بررسی فیلدهای ضروری
  if (!pi.phone || pi.phone.trim() === '') {
    gaps.push({
      id: 'gap-phone',
      field_path: 'personal_info.phone',
      title_en: 'Phone Number Missing',
      title_fa: 'شماره تلفن موجود نیست',
      description_en: 'Your CV does not include a phone number.',
      description_fa: 'رزومه شما شماره تلفن شما را شامل نمی‌شود.',
      severity: 'important',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add your phone number with country code.',
      fix_guidance_fa: 'شماره تلفن خود را با کد کشور اضافه کنید.',
      fix_example_en: '+98 912 345 6789',
      fix_example_fa: '+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹',
      input_type: 'text',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  if (!pi.linkedin_url || pi.linkedin_url.trim() === '') {
    gaps.push({
      id: 'gap-linkedin',
      field_path: 'personal_info.linkedin_url',
      title_en: 'LinkedIn Profile Missing',
      title_fa: 'لینکدین موجود نیست',
      description_en: 'Adding your LinkedIn profile helps recruiters find you.',
      description_fa: 'افزودن پروفایل لینکدین به کارفرماها کمک می‌کند شما را پیدا کنند.',
      severity: 'recommended',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add your LinkedIn profile URL.',
      fix_guidance_fa: 'آدرس پروفایل لینکدین خود را اضافه کنید.',
      fix_example_en: 'https://linkedin.com/in/yourprofile',
      fix_example_fa: 'https://linkedin.com/in/yourprofile',
      input_type: 'text',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  if (!pi.summary || pi.summary.trim() === '' || pi.summary.length < 20) {
    gaps.push({
      id: 'gap-summary',
      field_path: 'personal_info.summary',
      title_en: 'Professional Summary Missing or Too Brief',
      title_fa: 'خلاصه حرفه‌ای موجود نیست یا خیلی کوتاه است',
      description_en: 'A professional summary helps highlight your key qualifications.',
      description_fa: 'خلاصه حرفه‌ای به برجسته کردن صلاحیت‌های کلیدی شما کمک می‌کند.',
      severity: 'important',
      category: 'incomplete_content',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Write 2-4 sentences about your professional background and goals.',
      fix_guidance_fa: '۲-۴ جمله درباره سوابق حرفه‌ای و اهداف خود بنویسید.',
      fix_example_en: 'Experienced software engineer with 5+ years in web development...',
      fix_example_fa: 'مهندس نرم‌افزار باتجربه با بیش از ۵ سال در توسعه وب...',
      input_type: 'textarea',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
      current_value: pi.summary || undefined,
    });
  }

  const workExp = data.work_experience || [];
  if (workExp.length === 0) {
    gaps.push({
      id: 'gap-work-exp',
      field_path: 'work_experience',
      title_en: 'Work Experience Missing',
      title_fa: 'سوابق شغلی موجود نیست',
      description_en: 'Your CV does not include any work experience.',
      description_fa: 'رزومه شما سوابق شغلی شامل نمی‌شود.',
      severity: 'critical',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add your work experience with job titles, companies, and dates.',
      fix_guidance_fa: 'سوابق شغلی خود را با عناوین، شرکت‌ها و تاریخ‌ها اضافه کنید.',
      fix_example_en: 'Software Engineer at Tech Company (2020-Present)',
      fix_example_fa: 'مهندس نرم‌افزار در شرکت فناوری (۱۴۰۰-اکنون)',
      input_type: 'experience',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  } else {
    strengths.push({
      title_en: `${workExp.length} Work Experience Entries`,
      title_fa: `${workExp.length} سابقه شغلی`,
      description_en: `Your CV includes ${workExp.length} work experience entries.`,
      description_fa: `رزومه شما شامل ${workExp.length} سابقه شغلی است.`,
      relevant_domains: selectedDomains,
    });
  }

  const education = data.education || [];
  if (education.length === 0) {
    gaps.push({
      id: 'gap-education',
      field_path: 'education',
      title_en: 'Education Missing',
      title_fa: 'تحصیلات موجود نیست',
      description_en: 'Your CV does not include any education.',
      description_fa: 'رزومه شما تحصیلات شامل نمی‌شود.',
      severity: 'important',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add your educational background.',
      fix_guidance_fa: 'تحصیلات خود را اضافه کنید.',
      fix_example_en: 'B.Sc. Computer Science, University Name (2016-2020)',
      fix_example_fa: 'کارشناسی علوم کامپیوتر، نام دانشگاه (۱۳۹۵-۱۳۹۹)',
      input_type: 'education',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  const skills = data.skills || [];
  if (!Array.isArray(skills) || skills.length === 0) {
    gaps.push({
      id: 'gap-skills',
      field_path: 'skills',
      title_en: 'Skills Missing',
      title_fa: 'مهارت‌ها موجود نیست',
      description_en: 'Your CV does not include any skills.',
      description_fa: 'رزومه شما مهارت‌ها شامل نمی‌شود.',
      severity: 'important',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'List your technical and soft skills.',
      fix_guidance_fa: 'مهارت‌های فنی و نرم خود را فهرست کنید.',
      fix_example_en: 'JavaScript, Python, Project Management, Communication',
      fix_example_fa: 'جاوااسکریپت، پایتون، مدیریت پروژه، ارتباطات',
      input_type: 'list',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  const projects = data.projects || [];
  if (projects.length === 0) {
    gaps.push({
      id: 'gap-projects',
      field_path: 'projects',
      title_en: 'No Projects Listed',
      title_fa: 'هیچ پروژه‌ای ذکر نشده',
      description_en: 'Adding projects can strengthen your CV.',
      description_fa: 'افزودن پروژه‌ها می‌تواند رزومه شما را تقویت کند.',
      severity: 'recommended',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add 2-3 notable projects.',
      fix_guidance_fa: '۲-۳ پروژه شاخص اضافه کنید.',
      fix_example_en: 'E-commerce Platform - React, Node.js, PostgreSQL',
      fix_example_fa: 'پلتفرم تجارت الکترونیک - React, Node.js, PostgreSQL',
      input_type: 'project',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  const certifications = data.certifications || [];
  if (certifications.length === 0) {
    gaps.push({
      id: 'gap-certifications',
      field_path: 'certifications',
      title_en: 'No Certifications Listed',
      title_fa: 'هیچ گواهینامه‌ای ذکر نشده',
      description_en: 'Professional certifications can add credibility.',
      description_fa: 'گواهینامه‌های حرفه‌ای می‌توانند اعتبار اضافه کنند.',
      severity: 'optional',
      category: 'missing_section',
      relevant_domains: selectedDomains,
      fix_guidance_en: 'Add any relevant certifications.',
      fix_guidance_fa: 'هر گواهینامه مرتبطی اضافه کنید.',
      fix_example_en: 'AWS Solutions Architect (2023)',
      fix_example_fa: 'معماری AWS (۱۴۰۲)',
      input_type: 'certification',
      is_skipped: false,
      is_resolved: false,
      can_skip: true,
    });
  }

  // محاسبه امتیاز
  const totalChecks = 7;
  const passedChecks = strengths.length +
    (pi.phone ? 1 : 0) +
    (workExp.length > 0 ? 1 : 0) +
    (education.length > 0 ? 1 : 0);
  const overallScore = Math.round((passedChecks / totalChecks) * 100);

  return {
    selected_domains: selectedDomains,
    detected_domains: selectedDomains,
    overall_score: overallScore,
    domain_scores: {},
    gaps,
    strengths,
    analysis_summary: `Found ${gaps.length} potential gaps. ${strengths.length} sections are complete.`,
    general_recommendations: ['Review each gap and provide information if available.'],
  };
}

/**
 * تبدیل metadata از AI
 */
function transformMetadata(parsed: any): EnhancedCVExtractionResult['metadata'] {
  const meta = parsed.metadata;
  if (!meta) return null;

  return {
    confidence: typeof meta.confidence === 'number'
      ? Math.min(100, Math.max(0, meta.confidence))
      : 0,
    detected_language: meta.detected_language || 'en',
    cv_format_quality: meta.cv_format_quality || 'fair',
    estimated_experience_years: typeof meta.estimated_experience_years === 'number'
      ? meta.estimated_experience_years
      : null,
    career_level: meta.career_level || 'mid',
    notes: meta.notes || '',
  };
}

/**
 * تبدیل پیشنهادهای بهبود از AI
 */
function transformSuggestedImprovements(improvements: any[]): SuggestedImprovement[] {
  if (!Array.isArray(improvements)) return [];

  return improvements.map((imp, idx) => ({
    id: imp.id || `improve-${idx + 1}`,
    field_path: imp.field_path || '',
    current_text: imp.current_text || '',
    suggested_text: imp.suggested_text || '',
    reason_en: imp.reason_en || imp.reason || '',
    reason_fa: imp.reason_fa || '',
    is_approved: false,
    is_rejected: false,
  }));
}

/**
 * تبدیل ترجمه‌های اعمال شده از AI
 */
function transformTranslationsApplied(translations: any[]): TranslationApplied[] {
  if (!Array.isArray(translations)) return [];

  return translations.map((t, idx) => ({
    id: t.id || `trans-${idx + 1}`,
    field_path: t.field_path || '',
    original_input: t.original_input || '',
    original_language: t.original_language || 'unknown',
    translated_text: t.translated_text || '',
    target_language: t.target_language || 'en',
    is_approved: false,
    is_rejected: false,
  }));
}

// ═══════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════

/**
 * نرمال‌سازی مهارت‌ها از فرمت‌های مختلف AI
 * - آرایه ساده: ["React", "TypeScript"]
 * - آبجکت دسته‌بندی: { technical: [...], soft: [...], tools: [...] }
 * - ترکیبی: هر دو
 */
function normalizeSkills(rawSkills: any): string[] {
  if (!rawSkills) return [];

  // اگر آرایه ساده باشد
  if (Array.isArray(rawSkills)) {
    return rawSkills
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      .map((s: string) => s.trim());
  }

  // اگر آبجکت دسته‌بندی باشد
  if (typeof rawSkills === 'object') {
    const allSkills: string[] = [];
    const categories = ['technical', 'soft', 'tools', 'domain_specific', 'hard', 'programming', 'frameworks'];

    for (const cat of categories) {
      if (Array.isArray(rawSkills[cat])) {
        for (const skill of rawSkills[cat]) {
          if (typeof skill === 'string' && skill.trim().length > 0) {
            allSkills.push(skill.trim());
          }
        }
      }
    }

    // حذف تکراری‌ها (case-insensitive)
    const seen = new Set<string>();
    return allSkills.filter(s => {
      const lower = s.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }

  return [];
}

/**
 * نرمال‌سازی سطح زبان
 */
function normalizeProficiency(
  p: any
): 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner' {
  if (!p) return 'intermediate';
  const lower = String(p).toLowerCase().trim();

  if (lower.includes('native') || lower.includes('mother') || lower === 'c2') return 'native';
  if (lower.includes('fluent') || lower === 'c1') return 'fluent';
  if (lower.includes('advanced') || lower === 'b2') return 'advanced';
  if (lower.includes('intermediate') || lower === 'b1' || lower === 'a2') return 'intermediate';
  if (lower.includes('basic') || lower.includes('beginner') || lower === 'a1') return 'beginner';

  return 'intermediate';
}

/**
 * اعتبارسنجی severity و fallback
 */
function validateSeverity(s: any): GapSeverity {
  const valid: GapSeverity[] = ['critical', 'important', 'recommended', 'optional'];
  if (typeof s === 'string' && valid.includes(s.toLowerCase() as GapSeverity)) {
    return s.toLowerCase() as GapSeverity;
  }
  return 'recommended';
}

/**
 * اعتبارسنجی category و fallback
 */
function validateCategory(c: any): GapCategory {
  const valid: GapCategory[] = [
    'missing_section', 'incomplete_content', 'weak_description',
    'missing_metrics', 'formatting_issue', 'missing_keywords', 'domain_specific',
  ];
  if (typeof c === 'string' && valid.includes(c.toLowerCase() as GapCategory)) {
    return c.toLowerCase() as GapCategory;
  }
  return 'incomplete_content';
}

/**
 * اعتبارسنجی input_type و fallback
 */
function validateInputType(t: any): GapInputType {
  const valid: GapInputType[] = [
    'text', 'textarea', 'list', 'date', 'select',
    'experience', 'education', 'certification', 'project', 'confirm',
  ];
  if (typeof t === 'string' && valid.includes(t.toLowerCase() as GapInputType)) {
    return t.toLowerCase() as GapInputType;
  }
  return 'textarea';
}

/**
 * اولین مقدار غیرخالی را برمی‌گرداند
 */
function firstNonEmpty(...values: any[]): string | null {
  for (const v of values) {
    if (v !== null && v !== undefined) {
      const str = String(v).trim();
      if (str.length > 0) return str;
    }
  }
  return null;
}

/**
 * تضمین اینکه خروجی آرایه باشد
 */
function ensureArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * تضمین آرایه‌ای از رشته‌ها
 */
function ensureStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((item: any) => item !== null && item !== undefined)
      .map((item: any) => String(item).trim())
      .filter((s: string) => s.length > 0);
  }
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
}

/**
 * تلاش برای استخراج داده‌های جزئی از JSON شکسته
 * وقتی parse کامل شکست می‌خورد، این تابع سعی می‌کند حداقل بخش‌هایی را استخراج کند
 */
function extractPartialData(response: string): any {
  const result: any = {
    extracted_data: {},
    gap_analysis: { gaps: [], strengths: [], overall_score: 50 },
  };

  try {
    // تلاش برای استخراج personal_info با regex‌های پیشرفته‌تر
    const nameMatch = response.match(/"full_name"\s*:\s*"([^"]+)"/);
    const emailMatch = response.match(/"email"\s*:\s*"([^"]+)"/);
    const phoneMatch = response.match(/"phone"\s*:\s*"([^"]+)"/);
    const locationMatch = response.match(/"location"\s*:\s*"([^"]+)"/);
    const linkedinMatch = response.match(/"linkedin_url"\s*:\s*"([^"]+)"/);

    // استخراج summary - می‌تواند طولانی باشد
    const summaryMatch = response.match(/"summary"\s*:\s*"([\s\S]*?)(?=",\s*"|\s*}\s*,|\s*}\s*$)/);

    if (nameMatch || emailMatch || phoneMatch) {
      result.extracted_data.personal_info = {
        full_name: nameMatch?.[1] || null,
        email: emailMatch?.[1] || null,
        phone: phoneMatch?.[1] || null,
        location: locationMatch?.[1] || null,
        linkedin_url: linkedinMatch?.[1] || null,
        summary: summaryMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || null,
        website_url: null,
      };
    }

    // استخراج work_experience با توضیحات کامل
    const workExpMatches = [...response.matchAll(/"id"\s*:\s*"(work-\d+)"[^}]*"job_title"\s*:\s*"([^"]+)"[^}]*"company"\s*:\s*"([^"]*)"/g)];
    if (workExpMatches.length > 0) {
      result.extracted_data.work_experience = workExpMatches.map((match, i) => {
        const blockStart = response.indexOf(match[0]);
        const blockEnd = response.indexOf('},', blockStart) || response.indexOf('}]', blockStart);
        const block = response.substring(blockStart, blockEnd);

        // استخراج description از بلاک
        const descMatch = block.match(/"description"\s*:\s*"([\s\S]*?)(?=",\s*"[a-z_]+"\s*:|\s*})/);
        const companyMatch = block.match(/"company"\s*:\s*"([^"]*)"/);
        const startDateMatch = block.match(/"start_date"\s*:\s*"([^"]*)"/);
        const endDateMatch = block.match(/"end_date"\s*:\s*"([^"]*)"/);
        const isCurrentMatch = block.match(/"is_current"\s*:\s*(true|false)/);

        return {
          id: match[1] || `work-${i + 1}`,
          job_title: match[2] || '',
          company: companyMatch?.[1] || match[3] || '',
          location: null,
          start_date: startDateMatch?.[1] || null,
          end_date: endDateMatch?.[1] || null,
          is_current: isCurrentMatch?.[1] === 'true',
          description: descMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || null,
          achievements: [],
        };
      });
    }

    // اگر method بالا کار نکرد، fallback به روش ساده‌تر
    if (!result.extracted_data.work_experience || result.extracted_data.work_experience.length === 0) {
      const jobTitleMatches = [...response.matchAll(/"job_title"\s*:\s*"([^"]+)"/g)];
      if (jobTitleMatches.length > 0) {
        result.extracted_data.work_experience = jobTitleMatches.map((match, i) => ({
          id: `work-${i + 1}`,
          job_title: match[1],
          company: null,
          location: null,
          start_date: null,
          end_date: null,
          is_current: false,
          description: null,
          achievements: [],
        }));
      }
    }

    // استخراج education
    const degreeMatches = [...response.matchAll(/"degree"\s*:\s*"([^"]+)"/g)];
    const institutionMatches = [...response.matchAll(/"institution"\s*:\s*"([^"]+)"/g)];
    if (degreeMatches.length > 0) {
      result.extracted_data.education = degreeMatches.map((match, i) => ({
        id: `edu-${i + 1}`,
        degree: match[1],
        field_of_study: null,
        institution: institutionMatches[i]?.[1] || null,
        location: null,
        start_date: null,
        end_date: null,
        gpa: null,
        description: null,
      }));
    }

    // استخراج skills
    const skillsSection = response.match(/"skills"\s*:\s*\{([^}]+)\}/);
    if (skillsSection) {
      const skillsMatch = skillsSection[1].match(/"technical"\s*:\s*\[([^\]]+)\]/);
      if (skillsMatch) {
        const skills = skillsMatch[1]
          .split(',')
          .map((s: string) => s.replace(/"/g, '').trim())
          .filter((s: string) => s.length > 0);
        result.extracted_data.skills = skills;
      }
    }

    // استخراج languages
    const langMatches = [...response.matchAll(/"language"\s*:\s*"([^"]+)"[^}]*"proficiency"\s*:\s*"([^"]+)"/g)];
    if (langMatches.length > 0) {
      result.extracted_data.languages = langMatches.map((match, i) => ({
        id: `lang-${i + 1}`,
        language: match[1],
        proficiency: match[2],
      }));
    }

    // اگر هیچ داده‌ای استخراج نشد، null برگردان
    if (Object.keys(result.extracted_data).length === 0) {
      return null;
    }

    console.log('[CV Extractor] Partial data extracted:', {
      hasPersonalInfo: !!result.extracted_data.personal_info,
      workCount: result.extracted_data.work_experience?.length || 0,
      eduCount: result.extracted_data.education?.length || 0,
      skillsCount: result.extracted_data.skills?.length || 0,
      langCount: result.extracted_data.languages?.length || 0,
    });

    return result;
  } catch (e) {
    console.error('[CV Extractor] Partial extraction failed:', e);
    return null;
  }
}

/**
 * Redesign gap detection with 3 layers.
 */
function buildComprehensiveGaps(
  cv: Partial<ComprehensiveCV>,
  selectedDomains: CVDomainId[],
  aiGaps: any[]
): CVGapItem[] {
  const gaps: CVGapItem[] = [];
  let idx = 1;
  const usedIds = new Set<string>();

  const addGap = (
    section: string,
    field: string,
    label: string,
    priority: 'critical' | 'important' | 'recommended' | 'optional',
    suggestion: string,
    category: GapCategory
  ) => {
    const id = 'gap-' + idx++;
    const key = section + '|' + field;
    if (usedIds.has(key)) return;
    usedIds.add(key);

    gaps.push({
      id,
      field_path: `${section}.${field}`,
      title_en: label,
      title_fa: label,
      description_en: suggestion,
      description_fa: suggestion,
      severity: priority,
      category: category,
      relevant_domains: selectedDomains,
      fix_guidance_en: suggestion,
      fix_guidance_fa: suggestion,
      fix_example_en: '',
      fix_example_fa: '',
      input_type: 'textarea',
      is_resolved: false,
      is_skipped: false,
      current_value: undefined,
      suggested_value: undefined,
      can_skip: true,
    });
  };

  // ══════════════════════════════════════
  // LAYER 1: STRICTLY MISSING (Structural)
  // Only flag if the required field is TRULY empty.
  // We don't check length anymore—AI handles quality.
  // ══════════════════════════════════════

  for (const domainId of selectedDomains) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    if (domain.critical_fields) {
      for (const fieldPath of domain.critical_fields) {
        const parts = fieldPath.split('.');
        let value: any = cv;
        for (const part of parts) {
          value = value?.[part];
        }

        // Strict emptiness check only
        const isTrulyEmpty = value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim().length === 0) ||
          (Array.isArray(value) && value.length === 0);

        if (isTrulyEmpty) {
          addGap(
            parts[0],
            parts[parts.length - 1],
            'Missing: ' + fieldPath.replace('.', ' > '),
            'critical',
            'This information is essential for ' + (domain.label_en || domainId),
            'missing_section'
          );
        }
      }
    }

    // Domain specific sections existence check
    if (domain.specific_sections) {
      for (const sec of domain.specific_sections) {
        // Check if it exists ANYWHERE in the CV
        const inAdditional = cv.additional_sections?.some(
          (s: any) => (s.title || '').toLowerCase().includes(sec.label_en.toLowerCase().substring(0, 10))
        );
        const inMain =
          (sec.id.includes('skill') && Array.isArray(cv.skills) && cv.skills.length > 0) ||
          (sec.id.includes('project') && cv.projects && cv.projects.length > 0) ||
          (sec.id.includes('cert') && cv.certifications && cv.certifications.length > 0);

        if (!inAdditional && !inMain) {
          addGap(
            'domain_specific',
            sec.id,
            sec.label_en,
            sec.is_required ? 'important' : 'recommended',
            sec.description_en || 'Please provide this domain-specific expertise',
            'domain_specific'
          );
        }
      }
    }
  }

  // ══════════════════════════════════════
  // LAYER 2: AI-POWERED QUALITY ANALYSIS
  // We trust the AI to find weak descriptions, missing metrics, 
  // or poor summaries because it understands context better than code.
  // ══════════════════════════════════════

  if (aiGaps && Array.isArray(aiGaps)) {
    for (const aiGap of aiGaps) {
      const section = (aiGap.section || aiGap.field_path?.split('.')[0] || 'general').toLowerCase();
      const field = (aiGap.field || aiGap.field_name || aiGap.field_path?.split('.').pop() || 'unknown').toLowerCase();
      const key = section + '|' + field;

      if (!usedIds.has(key)) {
        usedIds.add(key);
        gaps.push({
          ...aiGap,
          id: 'gap-' + idx++,
          severity: aiGap.severity || 'recommended',
          category: aiGap.category || 'weak_description',
          is_resolved: false,
          is_skipped: false,
        });
      }
    }
  }

  // Sort by priority
  const severityOrder: Record<GapSeverity, number> = {
    critical: 0,
    important: 1,
    recommended: 2,
    optional: 3,
  };
  gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return gaps;
}

/**
 * ساخت نتیجه خطا (استاندارد)
 */
function buildErrorResult(
  rawText: string,
  aiProvider: AIProviderName | string,
  aiModel: string,
  detectedDomains: { domain: CVDomainId; score: number }[],
  errorMessage: string,
  existingCV?: Partial<ComprehensiveCV>
): EnhancedCVExtractionResult {
  return {
    success: false,
    cv: existingCV || {},
    fieldStatuses: existingCV ? validateExtractedCV(existingCV) : [],
    confidence: 0,
    rawText,
    aiProvider: aiProvider as AIProviderName,
    aiModel,
    extractionNotes: errorMessage,
    gapAnalysis: null,
    detectedDomains,
    metadata: null,
    suggestedImprovements: [],
    translationsApplied: [],
    cvLanguage: 'en',
  };
}
