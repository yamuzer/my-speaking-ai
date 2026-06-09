import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const connectionString = env.DATABASE_URL || env.SUPABASE_DB_URL || env.SUPABASE_CONNECTION;
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || env.SUPABASE_KEY;

const TEST_ITEMS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.test_items (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`;

function assertDevOnly() {
  if (!dev) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  return null;
}

function normalizeSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/rest/v1')) {
      parsed.pathname = '/';
    }
    return parsed.origin;
  } catch {
    return url;
  }
}

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }
  return createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
}

async function withClient(fn) {
  if (!connectionString) {
    return { error: 'DATABASE_URL not set on server' };
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    return await fn(client);
  } catch (err) {
    return { error: err.message || String(err) };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function GET() {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  if (connectionString) {
    const result = await withClient(async (client) => {
      const res1 = await client.query('SELECT 1 AS ok');
      const now = await client.query('SELECT now() AS now');
      let tableInfo;
      try {
        const ti = await client.query("SELECT to_regclass('public.test_items') AS reg");
        tableInfo = ti.rows[0];
      } catch {
        tableInfo = { reg: null };
      }
      return { ok: res1.rows[0].ok === 1, now: now.rows[0].now, table: tableInfo };
    });
    if (result.error) return json({ error: result.error }, { status: 500 });
    return json(result);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return json({ error: 'SUPABASE_URL or SUPABASE_KEY not set on server' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('test_items')
    .select('*')
    .order('id', { ascending: false })
    .limit(10);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ ok: true, now: new Date().toISOString(), table: { reg: 'exists' }, sample: data });
}

export async function POST({ request }) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const body = await request.json().catch(() => ({}));
  const create = body.create === true;
  const insert = body.insert === true;

  if (connectionString) {
    const result = await withClient(async (client) => {
      const out = {};
      if (create) {
        await client.query(TEST_ITEMS_TABLE_SQL);
        out.created = true;
      }
      if (insert) {
        const content = body.content || `test-${Date.now()}`;
        const r = await client.query('INSERT INTO public.test_items (content) VALUES ($1) RETURNING *', [content]);
        out.inserted = r.rows[0];
      }
      return out;
    });
    if (result.error) return json({ error: result.error }, { status: 500 });
    return json(result);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return json({ error: 'SUPABASE_URL or SUPABASE_KEY not set on server' }, { status: 500 });
  }

  if (create) {
    return json({ error: 'Cannot create table via Supabase client. Create the table manually in Supabase SQL editor.' }, { status: 400 });
  }

  if (insert) {
    const content = body.content || `test-${Date.now()}`;
    const { data, error } = await supabase
      .from('test_items')
      .insert({ content })
      .select();

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }
    return json({ inserted: data });
  }

  return json({ error: 'No action specified' }, { status: 400 });
}
