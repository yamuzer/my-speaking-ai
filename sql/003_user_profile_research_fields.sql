-- Additional onboarding fields for target/persona research.
-- Run this after public.user_profiles has been created.

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

ALTER TABLE IF EXISTS public.user_profiles
	DROP CONSTRAINT IF EXISTS user_profiles_age_range_check;

ALTER TABLE IF EXISTS public.user_profiles
	ADD CONSTRAINT user_profiles_age_range_check
	CHECK (age_range IS NULL OR age_range IN ('teen', '20s', '30s', '40s', '50s_plus'));

ALTER TABLE IF EXISTS public.user_profiles
	DROP CONSTRAINT IF EXISTS user_profiles_learning_purpose_check;

ALTER TABLE IF EXISTS public.user_profiles
	ADD CONSTRAINT user_profiles_learning_purpose_check
	CHECK (
		learning_purpose IS NULL
		OR learning_purpose IN ('daily', 'business', 'interview', 'travel', 'exam', 'academic', 'other')
	);

ALTER TABLE IF EXISTS public.user_profiles
	DROP CONSTRAINT IF EXISTS user_profiles_practice_frequency_check;

ALTER TABLE IF EXISTS public.user_profiles
	ADD CONSTRAINT user_profiles_practice_frequency_check
	CHECK (
		practice_frequency IS NULL
		OR practice_frequency IN ('daily', 'weekly_3', 'weekly_1', 'occasional')
	);
