-- ============================================
-- APPLICATION TABLES FOR AI RESUME MAKER
-- ============================================

CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Resume',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

CREATE TABLE IF NOT EXISTS public.download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID,
    format TEXT NOT NULL DEFAULT 'pdf',
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dh_user_id ON public.download_history(user_id);

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    input_text TEXT,
    output_text TEXT,
    tokens_used INTEGER DEFAULT 0,
    model_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.resume_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    preview_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE public.admin_users.user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- ADMIN_USERS
CREATE POLICY "auth_read_admin_status" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admins_manage" ON public.admin_users FOR ALL USING (public.is_admin(auth.uid()));

-- RESUMES
CREATE POLICY "users_view_own_resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_manage_own_resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "admins_view_all_resumes" ON public.resumes FOR SELECT USING (public.is_admin(auth.uid()));

-- DOWNLOAD HISTORY
CREATE POLICY "users_view_own_downloads" ON public.download_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_downloads" ON public.download_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins_view_all_downloads" ON public.download_history FOR SELECT USING (public.is_admin(auth.uid()));

-- AI USAGE
CREATE POLICY "users_view_own_ai_usage" ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_ai_usage" ON public.ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins_view_all_ai_usage" ON public.ai_usage FOR SELECT USING (public.is_admin(auth.uid()));

-- USER PROFILES
CREATE POLICY "users_view_own_profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins_manage_profiles" ON public.user_profiles FOR ALL USING (public.is_admin(auth.uid()));

-- ANNOUNCEMENTS
CREATE POLICY "everyone_view_active_announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_announcements" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()));

-- SYSTEM SETTINGS
CREATE POLICY "everyone_read_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "admins_manage_settings" ON public.system_settings FOR ALL USING (public.is_admin(auth.uid()));

-- RESUME TEMPLATES
CREATE POLICY "everyone_view_active_templates" ON public.resume_templates FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_templates" ON public.resume_templates FOR ALL USING (public.is_admin(auth.uid()));

-- Grant access
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

SELECT 'Schema created successfully' as status;
