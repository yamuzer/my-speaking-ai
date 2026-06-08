-- Minimal tables for user-scoped English conversation records.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.prompt_styles (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	badge TEXT NOT NULL DEFAULT '직접 설정',
	description TEXT NOT NULL,
	instructions TEXT NOT NULL,
	favorite BOOLEAN NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_records (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	title TEXT NOT NULL DEFAULT '영어회화 기록',
	coach_style JSONB NOT NULL DEFAULT '{}'::jsonb,
	messages JSONB NOT NULL DEFAULT '[]'::jsonb,
	status TEXT NOT NULL DEFAULT 'ended',
	duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
	started_at timestamptz NOT NULL DEFAULT now(),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS conversation_records_user_id_started_at_idx
	ON public.conversation_records(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS prompt_styles_user_id_updated_at_idx
	ON public.prompt_styles(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS user_profiles_onboarding_completed_at_idx
	ON public.user_profiles(onboarding_completed_at);

ALTER TABLE IF EXISTS public.prompt_styles
	DROP CONSTRAINT IF EXISTS prompt_styles_user_id_fkey;

ALTER TABLE IF EXISTS public.prompt_styles
	ADD CONSTRAINT prompt_styles_user_id_fkey
	FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.conversation_records
	DROP CONSTRAINT IF EXISTS conversation_records_user_id_fkey;

ALTER TABLE IF EXISTS public.conversation_records
	ADD CONSTRAINT conversation_records_user_id_fkey
	FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_profiles
	DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE IF EXISTS public.user_profiles
	ADD CONSTRAINT user_profiles_user_id_fkey
	FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
