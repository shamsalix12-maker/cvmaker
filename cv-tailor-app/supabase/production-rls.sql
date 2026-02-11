-- ═══════════════════════════════════════════════════════════════
-- [B37] Security & RLS Policies Update
-- Run this in Supabase SQL Editor to secure the database
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop existing permissive development policies
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_all" ON public.users;
DROP POLICY IF EXISTS "users_update_all" ON public.users;
DROP POLICY IF EXISTS "cvs_all" ON public.comprehensive_cvs;
DROP POLICY IF EXISTS "prompts_select_all" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_all" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_all" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_all" ON public.prompts;
DROP POLICY IF EXISTS "api_keys_all" ON public.ai_api_keys;
DROP POLICY IF EXISTS "templates_all" ON public.templates;
DROP POLICY IF EXISTS "applications_all" ON public.job_applications;

-- 2. Create production-ready RLS policies

-- USERS TABLE: Users can only see and update their own profile
CREATE POLICY "users_self_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_self_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- CVs TABLE: Users can manage only their own CV
CREATE POLICY "cvs_owner_all" ON public.comprehensive_cvs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROMPTS TABLE: Authenticated users can read all active prompts
CREATE POLICY "prompts_auth_select" ON public.prompts FOR SELECT TO authenticated USING (is_active = true);
-- Note: Insert/Update/Delete for prompts is reserved for service_role/admins (no public policies)

-- API KEYS TABLE: Users can manage only their own keys
CREATE POLICY "api_keys_owner_all" ON public.ai_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TEMPLATES TABLE: Users can manage only their own templates
CREATE POLICY "templates_owner_all" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- JOB APPLICATIONS TABLE: Users can manage only their own applications
CREATE POLICY "applications_owner_all" ON public.job_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Verify RLS is enabled on all tables (Safety Check)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprehensive_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
