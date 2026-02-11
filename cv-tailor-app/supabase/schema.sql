-- ═══════════════════════════════════════════════════════════════
-- [F094] supabase/schema.sql
-- Database Schema for CV Tailor
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- 1. USERS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_id TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'fa')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 2. COMPREHENSIVE CVS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comprehensive_cvs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  personal_info JSONB DEFAULT '{}'::jsonb,
  work_experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  additional_sections JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────────────────────────
-- 3. PROMPTS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_fa TEXT DEFAULT '',
  prompt_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 4. AI API KEYS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL CHECK (provider_name IN ('openai', 'anthropic', 'google')),
  api_key_encrypted TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  available_models JSONB DEFAULT '[]'::jsonb,
  token_balance TEXT,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_name)
);

-- ─────────────────────────────────────────────────────────────────
-- 5. TEMPLATES TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('cv', 'cover_letter', 'email')),
  file_format TEXT NOT NULL CHECK (file_format IN ('docx', 'md')),
  file_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 6. JOB APPLICATIONS TABLE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_title TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  job_description TEXT NOT NULL,
  selected_prompt_ids JSONB DEFAULT '[]'::jsonb,
  ai_selections JSONB DEFAULT '[]'::jsonb,
  output_language TEXT DEFAULT 'en',
  tone_setting JSONB DEFAULT '{"mode": "preset", "preset_value": "professional", "custom_text": null}'::jsonb,
  selected_template_ids JSONB DEFAULT '{"cv": null, "cover_letter": null, "email": null}'::jsonb,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  draft_outputs JSONB DEFAULT '[]'::jsonb,
  final_output JSONB,
  edited_output JSONB,
  status TEXT DEFAULT 'input' CHECK (status IN ('input', 'processing', 'clarification', 'draft_ready', 'editing', 'finalized')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprehensive_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- USERS TABLE: Users can only see and update their own profile
CREATE POLICY "users_self_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_self_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- CVs TABLE: Users can manage only their own CV
CREATE POLICY "cvs_owner_all" ON public.comprehensive_cvs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROMPTS TABLE: Authenticated users can read all active prompts
CREATE POLICY "prompts_auth_select" ON public.prompts FOR SELECT TO authenticated USING (is_active = true);

-- API KEYS TABLE: Users can manage only their own keys
CREATE POLICY "api_keys_owner_all" ON public.ai_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TEMPLATES TABLE: Users can manage only their own templates
CREATE POLICY "templates_owner_all" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- JOB APPLICATIONS TABLE: Users can manage only their own applications
CREATE POLICY "applications_owner_all" ON public.job_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cvs_updated_at ON public.comprehensive_cvs;
CREATE TRIGGER update_cvs_updated_at 
  BEFORE UPDATE ON public.comprehensive_cvs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at 
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.ai_api_keys;
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON public.ai_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────
-- SAMPLE PROMPTS (seed data)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO public.prompts (title_en, title_fa, description_en, description_fa, prompt_text, category, sort_order) VALUES
(
  'Professional CV Tailoring',
  'تنظیم حرفه‌ای سی‌وی',
  'Create a professionally tailored CV that matches the job requirements',
  'ایجاد سی‌وی حرفه‌ای متناسب با نیازمندی‌های شغل',
  'You are an expert CV writer. Given the comprehensive CV and job description, create a tailored CV that:
1. Highlights relevant experience and skills
2. Uses keywords from the job description
3. Quantifies achievements where possible
4. Maintains a professional tone
5. Is concise and impactful

Ask clarifying questions if needed before generating the output.',
  'general',
  1
),
(
  'Tech Industry Focus',
  'تمرکز بر صنعت فناوری',
  'Optimized for technology and software positions',
  'بهینه‌شده برای موقعیت‌های فناوری و نرم‌افزار',
  'You are a tech industry recruiting specialist. Create application materials that:
1. Emphasize technical skills and technologies
2. Highlight project experience and contributions
3. Include relevant GitHub, portfolio, or technical achievements
4. Use industry-standard terminology
5. Focus on problem-solving abilities and impact

Ask about specific technologies or projects if the information seems incomplete.',
  'tech',
  2
),
(
  'Executive Level',
  'سطح مدیریتی',
  'For senior management and executive positions',
  'برای موقعیت‌های مدیریت ارشد و اجرایی',
  'You are an executive career consultant. Create application materials that:
1. Emphasize leadership experience and strategic impact
2. Quantify business results and team achievements
3. Highlight board experience, if any
4. Focus on vision and organizational transformation
5. Maintain an authoritative yet approachable tone

Ask about leadership achievements or strategic initiatives if not clear.',
  'executive',
  3
)
ON CONFLICT DO NOTHING;
