-- User onboarding profile and consent records.
-- Run this file in the Supabase SQL Editor before enabling onboarding gates.

CREATE TABLE IF NOT EXISTS public.user_profiles (
	user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	display_name TEXT NOT NULL,
	age_range TEXT,
	occupation TEXT,
	english_level TEXT NOT NULL,
	learning_purpose TEXT,
	learning_goal TEXT NOT NULL,
	practice_frequency TEXT,
	interest_situations JSONB NOT NULL DEFAULT '[]'::jsonb,
	terms_agreed_at timestamptz,
	privacy_policy_agreed_at timestamptz,
	terms_version TEXT NOT NULL DEFAULT '2026-06-08',
	privacy_policy_version TEXT NOT NULL DEFAULT '2026-06-08',
	onboarding_completed_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT user_profiles_english_level_check
		CHECK (english_level IN ('beginner', 'intermediate', 'advanced'))
);

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS age_range TEXT;

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS occupation TEXT;

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS learning_purpose TEXT;

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS practice_frequency TEXT;

ALTER TABLE IF EXISTS public.user_profiles
	ADD COLUMN IF NOT EXISTS interest_situations JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS user_profiles_onboarding_completed_at_idx
	ON public.user_profiles(onboarding_completed_at);

ALTER TABLE IF EXISTS public.user_profiles
	DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE IF EXISTS public.user_profiles
	ADD CONSTRAINT user_profiles_user_id_fkey
	FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
