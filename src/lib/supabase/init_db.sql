-- ═══════════════════════════════════════════════════════════════
-- Supabase Initialization Script
-- Project: CV Maker / CV Tailor
-- Date: 2026-02-11
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Tables
-- ─────────────────────────────────────────────────────────────────

-- Users profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive CVs
CREATE TABLE IF NOT EXISTS public.comprehensive_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    personal_info JSONB DEFAULT '{}'::jsonb,
    work_experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    additional_sections JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Prompts (System-wide)
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_fa TEXT NOT NULL,
    description_en TEXT,
    description_fa TEXT,
    prompt_text TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI API Keys (Encrypted)
CREATE TABLE IF NOT EXISTS public.ai_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    available_models JSONB DEFAULT '[]'::jsonb,
    token_balance TEXT,
    last_validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider_name)
);

-- Document Templates
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    file_format TEXT NOT NULL,
    file_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications (Orchestrator state)
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT,
    company_name TEXT,
    job_description TEXT NOT NULL,
    selected_prompt_ids JSONB DEFAULT '[]'::jsonb,
    ai_selections JSONB DEFAULT '[]'::jsonb,
    output_language TEXT DEFAULT 'en',
    tone_setting JSONB DEFAULT '{}'::jsonb,
    selected_template_ids JSONB DEFAULT '{"cv": null, "cover_letter": null, "email": null}'::jsonb,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    draft_outputs JSONB DEFAULT '[]'::jsonb,
    final_output JSONB,
    edited_output JSONB,
    status TEXT DEFAULT 'input',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprehensive_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies
-- ─────────────────────────────────────────────────────────────────

-- Users Table
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Comprehensive CVs
CREATE POLICY "Users can view own CVs" ON public.comprehensive_cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON public.comprehensive_cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON public.comprehensive_cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON public.comprehensive_cvs FOR DELETE USING (auth.uid() = user_id);

-- AI Prompts (Readable by all authenticated users)
CREATE POLICY "Anyone can view prompts" ON public.prompts FOR SELECT USING (true);

-- AI API Keys
CREATE POLICY "Users can view own keys" ON public.ai_api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own keys" ON public.ai_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own keys" ON public.ai_api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own keys" ON public.ai_api_keys FOR DELETE USING (auth.uid() = user_id);

-- Templates
CREATE POLICY "Users can view own templates" ON public.templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);

-- Job Applications
CREATE POLICY "Users can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.job_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.job_applications FOR DELETE USING (auth.uid() = user_id);

-- 4. Automation Triggers
-- ─────────────────────────────────────────────────────────────────

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Updated At Trigger
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comprehensive_cvs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_api_keys FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
