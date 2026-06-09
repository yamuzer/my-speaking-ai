-- Account-level fixed token quotas and usage rollups.
-- Run this after simple_user_conversation_records.sql.

CREATE TABLE IF NOT EXISTS public.user_token_quotas (
	user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	token_quota BIGINT NOT NULL DEFAULT 500000,
	quota_enabled BOOLEAN NOT NULL DEFAULT true,
	assigned_by_admin BOOLEAN NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT user_token_quotas_token_quota_check
		CHECK (token_quota >= 0)
);

CREATE TABLE IF NOT EXISTS public.token_quota_settings (
	id BOOLEAN PRIMARY KEY DEFAULT true,
	default_token_quota BIGINT NOT NULL DEFAULT 500000,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT token_quota_settings_singleton_check
		CHECK (id),
	CONSTRAINT token_quota_settings_default_token_quota_check
		CHECK (default_token_quota >= 0)
);

INSERT INTO public.token_quota_settings (id, default_token_quota)
VALUES (true, 500000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE IF EXISTS public.user_token_quotas
	ADD COLUMN IF NOT EXISTS token_quota BIGINT NOT NULL DEFAULT 500000;

ALTER TABLE IF EXISTS public.user_token_quotas
	ADD COLUMN IF NOT EXISTS assigned_by_admin BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user_token_quotas'
			AND column_name = 'monthly_token_quota'
	) THEN
		EXECUTE '
			UPDATE public.user_token_quotas
			SET token_quota = monthly_token_quota
			WHERE token_quota = 500000
		';
	END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_token_usage_totals (
	user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	input_tokens BIGINT NOT NULL DEFAULT 0,
	output_tokens BIGINT NOT NULL DEFAULT 0,
	total_tokens BIGINT NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT user_token_usage_totals_input_tokens_check
		CHECK (input_tokens >= 0),
	CONSTRAINT user_token_usage_totals_output_tokens_check
		CHECK (output_tokens >= 0),
	CONSTRAINT user_token_usage_totals_total_tokens_check
		CHECK (total_tokens >= 0)
);

ALTER TABLE IF EXISTS public.conversation_records
	ADD COLUMN IF NOT EXISTS input_tokens BIGINT NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.conversation_records
	ADD COLUMN IF NOT EXISTS output_tokens BIGINT NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS public.conversation_records
	ADD COLUMN IF NOT EXISTS total_tokens BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS conversation_records_user_id_total_tokens_idx
	ON public.conversation_records(user_id, total_tokens DESC);

DO $$
BEGIN
	IF to_regclass('public.conversation_records') IS NOT NULL THEN
		INSERT INTO public.user_token_usage_totals (user_id, input_tokens, output_tokens, total_tokens, updated_at)
		SELECT
			user_id,
			COALESCE(sum(input_tokens), 0)::bigint,
			COALESCE(sum(output_tokens), 0)::bigint,
			COALESCE(sum(total_tokens), 0)::bigint,
			now()
		FROM public.conversation_records
		GROUP BY user_id
		ON CONFLICT (user_id) DO UPDATE SET
			input_tokens = GREATEST(public.user_token_usage_totals.input_tokens, EXCLUDED.input_tokens),
			output_tokens = GREATEST(public.user_token_usage_totals.output_tokens, EXCLUDED.output_tokens),
			total_tokens = GREATEST(public.user_token_usage_totals.total_tokens, EXCLUDED.total_tokens),
			updated_at = now();
	END IF;

	IF to_regclass('public.user_token_usage_months') IS NOT NULL THEN
		INSERT INTO public.user_token_usage_totals (user_id, input_tokens, output_tokens, total_tokens, updated_at)
		SELECT
			user_id,
			COALESCE(sum(input_tokens), 0)::bigint,
			COALESCE(sum(output_tokens), 0)::bigint,
			COALESCE(sum(total_tokens), 0)::bigint,
			now()
		FROM public.user_token_usage_months
		GROUP BY user_id
		ON CONFLICT (user_id) DO UPDATE SET
			input_tokens = GREATEST(public.user_token_usage_totals.input_tokens, EXCLUDED.input_tokens),
			output_tokens = GREATEST(public.user_token_usage_totals.output_tokens, EXCLUDED.output_tokens),
			total_tokens = GREATEST(public.user_token_usage_totals.total_tokens, EXCLUDED.total_tokens),
			updated_at = now();
	END IF;
END
$$;

ALTER TABLE IF EXISTS public.user_token_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_token_usage_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.token_quota_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own token quota" ON public.user_token_quotas;
CREATE POLICY "Users can read own token quota"
	ON public.user_token_quotas
	FOR SELECT
	TO authenticated
	USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own token usage total" ON public.user_token_usage_totals;
CREATE POLICY "Users can read own token usage total"
	ON public.user_token_usage_totals
	FOR SELECT
	TO authenticated
	USING (user_id = auth.uid());

-- Quota creation, quota changes, and usage rollups are server-side only.
