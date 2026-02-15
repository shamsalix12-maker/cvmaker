// ============================================
// Zod Schemas - Canonical CV Validation
// ============================================

import { z } from 'zod';

// ─── Personal Info Schema ───
export const PersonalInfoSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
});

// ─── Work Experience Schema ───
export const WorkExperienceSchema = z.object({
  id: z.string(),
  job_title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

// ─── Education Schema ───
export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1),
  field_of_study: z.string().optional(),
  institution: z.string().min(1),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  gpa: z.number().optional().nullable(),
  description: z.string().optional(),
});

// ─── Skill Schema ───
export const SkillSchema = z.string().min(1).max(100);

// ─── Certification Schema ───
export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  issuer: z.string().optional(),
  date_obtained: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
  credential_id: z.string().optional().nullable(),
  credential_url: z.string().url().optional().nullable(),
});

// ─── Language Schema ───
export const LanguageSchema = z.object({
  language: z.string().min(1),
  proficiency: z.enum(['native', 'fluent', 'advanced', 'intermediate', 'beginner']).default('intermediate'),
});

// ─── Project Schema ───
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  url: z.string().url().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

// ─── Additional Section Schema ───
export const AdditionalSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
});

// ─── Comprehensive CV Schema ───
export const ComprehensiveCVSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  personal_info: PersonalInfoSchema.optional(),
  work_experience: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  additional_sections: z.array(AdditionalSectionSchema).default([]),
  raw_text: z.string().default(''),
});

// ─── Domain-Specific CV Schema (extends Comprehensive) ───
export const DomainSpecificCVSchema = ComprehensiveCVSchema.extend({
  selected_domains: z.array(z.string()).default([]),
  domain_scores: z.record(z.string(), z.number()).default({}),
});

// ─── Gap Analysis Schema ───
export const GapItemSchema = z.object({
  id: z.string(),
  field_path: z.string(),
  title_en: z.string(),
  title_fa: z.string().optional(),
  description_en: z.string(),
  description_fa: z.string().optional(),
  severity: z.enum(['critical', 'important', 'recommended', 'optional']),
  category: z.enum([
    'missing_section',
    'incomplete_content',
    'weak_description',
    'missing_metrics',
    'formatting_issue',
    'missing_keywords',
    'domain_specific',
  ]),
  relevant_domains: z.array(z.string()).default([]),
  fix_guidance_en: z.string(),
  fix_guidance_fa: z.string().optional(),
  fix_example_en: z.string().optional(),
  fix_example_fa: z.string().optional(),
  input_type: z.enum([
    'text',
    'textarea',
    'list',
    'date',
    'select',
    'experience',
    'education',
    'certification',
    'project',
    'confirm',
  ]),
  is_skipped: z.boolean().default(false),
  is_resolved: z.boolean().default(false),
  current_value: z.string().optional(),
  suggested_value: z.string().optional(),
  can_skip: z.boolean().default(true),
});

export const StrengthItemSchema = z.object({
  title_en: z.string(),
  title_fa: z.string().optional(),
  description_en: z.string(),
  description_fa: z.string().optional(),
  relevant_domains: z.array(z.string()).default([]),
});

export const GapAnalysisSchema = z.object({
  selected_domains: z.array(z.string()).default([]),
  detected_domains: z.array(z.string()).default([]),
  overall_score: z.number().min(0).max(100),
  domain_scores: z.record(z.string(), z.number()).default({}),
  gaps: z.array(GapItemSchema).default([]),
  strengths: z.array(StrengthItemSchema).default([]),
  analysis_summary: z.string(),
  general_recommendations: z.array(z.string()).default([]),
});

// ─── Source Trace Schema ───
export const SourceTraceSchema = z.object({
  field: z.string(),
  source: z.enum(['extracted', 'user_input', 'merged']),
  source_file: z.string().optional(),
  timestamp: z.date(),
});

// ─── Canonical CV State Schema ───
export const CanonicalCVStateSchema = z.object({
  cv: ComprehensiveCVSchema,
  version: z.number().int().positive(),
  created_at: z.date(),
  updated_at: z.date(),
  source_trace: z.array(SourceTraceSchema).default([]),
});

// ─── Validation Helper Functions ───

export function validateCV(cv: unknown): {
  success: boolean;
  data?: z.infer<typeof ComprehensiveCVSchema>;
  errors: { path: (string | number | symbol)[]; message: string }[];
} {
  const result = ComprehensiveCVSchema.safeParse(cv);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return { 
    success: false, 
    errors: result.error.issues.map(i => ({ path: i.path, message: i.message }))
  };
}

export function validateGapAnalysis(gap: unknown): {
  success: boolean;
  data?: z.infer<typeof GapAnalysisSchema>;
  errors: { path: (string | number | symbol)[]; message: string }[];
} {
  const result = GapAnalysisSchema.safeParse(gap);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return { 
    success: false, 
    errors: result.error.issues.map(i => ({ path: i.path, message: i.message }))
  };
}

// ─── Type Exports ───

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type AdditionalSection = z.infer<typeof AdditionalSectionSchema>;
export type ComprehensiveCVInput = z.infer<typeof ComprehensiveCVSchema>;
export type GapItem = z.infer<typeof GapItemSchema>;
export type GapAnalysisInput = z.infer<typeof GapAnalysisSchema>;
