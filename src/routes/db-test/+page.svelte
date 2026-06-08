<script>
  import { onMount } from 'svelte';
  let status = $state(null);
  let error = $state('');
  let creating = $state(false);
  let inserting = $state(false);
  let newContent = $state('');
  let loading = $state(false);
  let serverMissing = $state(false);

  const apiPath = '/db-test/api';

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await fetch(apiPath);
      const j = await res.json();
      status = j;
      if (!res.ok && j?.error) error = j.error;
    } catch (e) {
      error = e.message || String(e);
      status = null;
    }
    updateServerMissing();
    loading = false;
  }

  function updateServerMissing() {
    serverMissing = !!(status && status.error && /DATABASE_URL|SUPABASE/i.test(status.error));
  }

  async function createTable() {
    creating = true;
    error = '';
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true })
      });
      const j = await res.json();
      if (!res.ok) error = j.error || 'Create failed';
      else await load();
    } catch (e) {
      error = e.message || String(e);
    }
    creating = false;
  }

  async function insertRow() {
    inserting = true;
    error = '';
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insert: true, content: newContent })
      });
      const j = await res.json();
      if (!res.ok) error = j.error || 'Insert failed';
      else {
        newContent = '';
        await load();
      }
    } catch (e) {
      error = e.message || String(e);
    }
    inserting = false;
  }

  onMount(load);
</script>

<style>
  .wrap { max-width:900px; margin:1rem auto; font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial; }
  header { display:flex; justify-content:space-between; align-items:center; gap:1rem; }
  h1 { margin:0; font-size:1.25rem; }
  .muted { color:#6b7280; }
  .card { background:#fff; border:1px solid #e5e7eb; padding:1rem; border-radius:10px; margin-top:1rem; }
  .grid { display:grid; grid-template-columns:1fr auto; gap:1rem; align-items:center; }
  .badge { padding:0.25rem 0.5rem; border-radius:999px; font-weight:600; }
  .badge.ok { background:#ecfdf5; color:#059669; }
  .badge.warn { background:#fff7ed; color:#b45309; }
  .controls { display:flex; gap:0.5rem; flex-wrap:wrap; }
  input[type="text"] { padding:0.5rem; border:1px solid #d1d5db; border-radius:6px; }
  button { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #d1d5db; background:#f8fafc; cursor:pointer; }
  button:hover:not(:disabled) { background:#e2e8f0; }
  button:disabled { opacity:0.5; cursor:not-allowed; }
  table { width:100%; border-collapse:collapse; margin-top:0.75rem; }
  th, td { border-bottom:1px solid #f3f4f6; padding:0.5rem; text-align:left; }
  .note { font-size:0.9rem; color:#374151; }
  code { background:#f3f4f6; padding:0.15rem 0.3rem; border-radius:4px; }
</style>

<div class="wrap">
  <header>
    <div>
      <h1>Database Test</h1>
      <div class="muted">Verify server-side Postgres/Supabase connectivity and insert a sample row.</div>
    </div>
    <div>
      {#if loading}
        <span class="badge">Loading…</span>
      {:else}
        {#if status?.ok}
          <span class="badge ok">Connected</span>
        {:else}
          <span class="badge warn">Not connected</span>
        {/if}
      {/if}
    </div>
  </header>

  <div class="card">
    <div class="muted" style="margin-bottom:1rem;">
      This page is designed for the following table structure:
      <pre style="margin:0; padding:0.75rem; background:#f3f4f6; border-radius:8px; overflow:auto;">
CREATE TABLE IF NOT EXISTS public.test_items (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
      </pre>
    </div>
  </div>

  {#if error}
    <div class="card" style="border-left:4px solid #ef4444;">
      <strong>Error</strong>
      <div class="note">{error}</div>
    </div>
  {/if}

  <div class="card">
    <div class="grid">
      <div>
        <div style="margin-bottom:0.5rem;"><strong>Server time</strong> <span class="muted">{status?.now ?? '—'}</span></div>
        <div class="muted">Table: <strong>{status?.table?.reg ? 'test_items (exists)' : 'test_items (not found or empty)'}</strong></div>
      </div>

      <div class="controls">
        <button onclick={load}>Refresh</button>
        <button onclick={createTable} disabled={creating || serverMissing}>{creating ? 'Creating…' : 'Create table'}</button>
      </div>
    </div>

    <hr />

    <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.75rem;">
      <input type="text" placeholder="Row content (optional)" bind:value={newContent} style="flex:1" />
      <button onclick={insertRow} disabled={inserting || serverMissing}>{inserting ? 'Inserting…' : 'Insert row'}</button>
    </div>

    {#if status?.sample && status.sample.length}
      <table>
        <thead>
          <tr><th>ID</th><th>Content</th><th>Created At</th></tr>
        </thead>
        <tbody>
          {#each status.sample as row (row.id)}
            <tr><td>{row.id}</td><td>{row.content}</td><td>{row.created_at}</td></tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="muted" style="margin-top:0.75rem;">No sample rows yet. Insert one to test.</div>
    {/if}

    {#if serverMissing}
      <div class="muted" style="margin-top:0.75rem;">Server environment not configured for direct DB access. Set <code>DATABASE_URL</code> or <code>SUPABASE_URL</code>/<code>SUPABASE_KEY</code> and restart server.</div>
    {/if}
  </div>
</div>
