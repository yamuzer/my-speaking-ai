#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const sqlDir = path.resolve(process.cwd(), 'sql');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '').trim();
  }
}

if (!fs.existsSync(sqlDir)) {
  console.error('SQL directory not found:', sqlDir);
  process.exit(1);
}

const sqlFiles = fs
  .readdirSync(sqlDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

if (!sqlFiles.length) {
  console.error('No SQL files found in:', sqlDir);
  process.exit(1);
}

function normalizeConnectionString(value) {
  const connection = String(value || '').trim();

  try {
    const parsed = new URL(connection);
    parsed.pathname = parsed.pathname.trim();
    return parsed.toString();
  } catch {
    return connection;
  }
}

const connectionString = normalizeConnectionString(
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_CONNECTION
);

if (!connectionString) {
  console.error('No database connection string found in env. Set DATABASE_URL to your Supabase Postgres connection string.');
  console.error('Example (do not run with production keys in public):');
  console.error('  export DATABASE_URL="postgres://postgres:password@dbhost:5432/postgres"');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database. Running migrations...');

    for (const file of sqlFiles) {
      const sqlPath = path.join(sqlDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`Running ${file}...`);
      await client.query(sql);
    }

    console.log('Migrations executed successfully.');
  } catch (err) {
    console.error('Error running SQL:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
