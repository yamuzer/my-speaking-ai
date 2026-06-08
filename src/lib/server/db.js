import { Client } from 'pg';
import { env } from '$env/dynamic/private';

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
	env.DATABASE_URL || env.SUPABASE_DB_URL || env.SUPABASE_CONNECTION
);

export function hasDatabaseConnection() {
	return Boolean(connectionString);
}

export async function withDb(fn) {
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set on the server.');
	}

	const client = new Client({ connectionString });

	try {
		await client.connect();
		return await fn(client);
	} finally {
		await client.end().catch(() => {});
	}
}
