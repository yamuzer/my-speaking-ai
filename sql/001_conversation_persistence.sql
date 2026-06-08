CREATE TABLE IF NOT EXISTS public.coach_styles (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL,
	name TEXT NOT NULL,
	badge TEXT NOT NULL DEFAULT '직접 설정',
	description TEXT NOT NULL,
	instructions TEXT NOT NULL,
	favorite BOOLEAN NOT NULL DEFAULT false,
	is_custom BOOLEAN NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_sessions (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL,
	title TEXT NOT NULL DEFAULT '영어회화 기록',
	status TEXT NOT NULL DEFAULT 'preparing',
	started_at timestamptz NOT NULL DEFAULT now(),
	duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
	coach_style JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
	id UUID PRIMARY KEY,
	session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
	user_id UUID NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
	text TEXT NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_styles_user_id_created_at_idx
	ON public.coach_styles(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS conversation_sessions_user_id_started_at_idx
	ON public.conversation_sessions(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS conversation_messages_session_id_created_at_idx
	ON public.conversation_messages(session_id, created_at ASC);
