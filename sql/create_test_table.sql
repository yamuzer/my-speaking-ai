-- Creates a simple test table in the public schema for Supabase connectivity tests
CREATE TABLE IF NOT EXISTS public.test_items (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: grant minimal privileges to anon or service role as needed
-- GRANT SELECT, INSERT ON public.test_items TO anon;
