-- Minimal tables for user-scoped English conversation records.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.users (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	email TEXT NOT NULL,
	name TEXT,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_records (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	title TEXT NOT NULL DEFAULT '영어회화 기록',
	coach_style JSONB NOT NULL DEFAULT '{}'::jsonb,
	messages JSONB NOT NULL DEFAULT '[]'::jsonb,
	status TEXT NOT NULL DEFAULT 'ended',
	duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
	started_at timestamptz NOT NULL DEFAULT now(),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_records_user_id_started_at_idx
	ON public.conversation_records(user_id, started_at DESC);
