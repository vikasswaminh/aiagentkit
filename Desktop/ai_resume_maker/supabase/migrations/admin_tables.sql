-- ============================================
-- 1. CLEAN UP ALL DEPENDENT POLICIES FIRST
-- ============================================
DO $$ 
DECLARE 
    tbl record;
    pol record;
BEGIN 
    -- Clean all tables mentioned in dependency errors
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN (
        'resumes', 
        'download_history', 
        'ai_usage', 
        'user_profiles', 
        'announcements', 
        'admin_users',
        'system_settings',
        'activity_logs',
        'resume_templates'
    ) 
    LOOP 
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl.tablename AND schemaname = 'public' 
        LOOP 
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl.tablename); 
        END LOOP; 
    END LOOP; 
END $$;

-- ============================================
-- 2. FORCE RESET THE SECURITY FUNCTION
-- ============================================
DROP FUNCTION IF EXISTS public.is_admin(uuid);
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE public.admin_users.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RE-ENABLE RLS & SET CLEAN POLICIES
-- ============================================

-- Enable RLS for all
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- 🛡️ ADMIN_USERS (Safe, non-recursive)
CREATE POLICY "Authenticated read status" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage all" ON public.admin_users FOR ALL USING (
  -- Using is_admin function is safe because it's SECURITY DEFINER (bypasses RLS)
  public.is_admin(auth.uid())
);

-- 📄 RESUMES
CREATE POLICY "Users view own" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all" ON public.resumes FOR SELECT USING (public.is_admin(auth.uid()));

-- 📥 DOWNLOAD HISTORY
CREATE POLICY "Users view own" ON public.download_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own" ON public.download_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all" ON public.download_history FOR SELECT USING (public.is_admin(auth.uid()));

-- 🤖 AI USAGE
CREATE POLICY "Users view own" ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own" ON public.ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all" ON public.ai_usage FOR SELECT USING (public.is_admin(auth.uid()));

-- 👤 USER PROFILES
CREATE POLICY "Users view own" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all" ON public.user_profiles FOR ALL USING (public.is_admin(auth.uid()));

-- 📢 ANNOUNCEMENTS
CREATE POLICY "Everyone view active" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage" ON public.announcements FOR ALL USING (public.is_admin(auth.uid()));

-- ⚙️ SYSTEM SETTINGS
CREATE POLICY "Everyone read" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage" ON public.system_settings FOR ALL USING (public.is_admin(auth.uid()));

-- 🎨 RESUME TEMPLATES
CREATE POLICY "Everyone view active" ON public.resume_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage" ON public.resume_templates FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================
-- 4. SYNC & OPTIMIZE
-- ============================================
INSERT INTO public.user_profiles (user_id)
SELECT DISTINCT user_id FROM public.resumes
ON CONFLICT (user_id) DO NOTHING;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

SELECT 'All systems restored and recursive loops eliminated! 🏁' as message;

