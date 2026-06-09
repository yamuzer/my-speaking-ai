-- Baseline security hardening for the user app and admin back office.
-- Run after simple_user_conversation_records.sql and user profile migrations.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	action TEXT NOT NULL,
	actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
	target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
	details JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
	ON public.admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_user_id_idx
	ON public.admin_audit_logs(actor_user_id);

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS role_updated_at timestamptz;

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS role_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'user_profiles_role_check'
			AND conrelid = 'public.user_profiles'::regclass
	) THEN
		ALTER TABLE public.user_profiles
			ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('user', 'admin'));
	END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	IF auth.uid() IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
		RAISE EXCEPTION 'Role cannot be changed through the public API.';
	END IF;

	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_self_update_trigger ON public.user_profiles;
CREATE TRIGGER prevent_profile_role_self_update_trigger
	BEFORE UPDATE ON public.user_profiles
	FOR EACH ROW
	EXECUTE FUNCTION public.prevent_profile_role_self_update();

ALTER TABLE IF EXISTS public.prompt_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own prompt styles" ON public.prompt_styles;
CREATE POLICY "Users can read own prompt styles"
	ON public.prompt_styles
	FOR SELECT
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own prompt styles" ON public.prompt_styles;
CREATE POLICY "Users can create own prompt styles"
	ON public.prompt_styles
	FOR INSERT
	TO authenticated
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own prompt styles" ON public.prompt_styles;
CREATE POLICY "Users can update own prompt styles"
	ON public.prompt_styles
	FOR UPDATE
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own prompt styles" ON public.prompt_styles;
CREATE POLICY "Users can delete own prompt styles"
	ON public.prompt_styles
	FOR DELETE
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own conversation records" ON public.conversation_records;
CREATE POLICY "Users can read own conversation records"
	ON public.conversation_records
	FOR SELECT
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own conversation records" ON public.conversation_records;
CREATE POLICY "Users can create own conversation records"
	ON public.conversation_records
	FOR INSERT
	TO authenticated
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own conversation records" ON public.conversation_records;
CREATE POLICY "Users can update own conversation records"
	ON public.conversation_records
	FOR UPDATE
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own conversation records" ON public.conversation_records;
CREATE POLICY "Users can delete own conversation records"
	ON public.conversation_records
	FOR DELETE
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
	ON public.user_profiles
	FOR SELECT
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile"
	ON public.user_profiles
	FOR INSERT
	TO authenticated
	WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own non-admin profile fields" ON public.user_profiles;
CREATE POLICY "Users can update own non-admin profile fields"
	ON public.user_profiles
	FOR UPDATE
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());

-- Do not expose admin audit logs through the public Supabase API by default.
-- The server-side admin dashboard writes these logs through the direct DB connection.
