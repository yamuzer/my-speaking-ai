import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { hasDatabaseConnection, withDb } from '$lib/server/db.js';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'auth_session';
const REFRESH_COOKIE = 'auth_refresh';
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;
const SUPABASE_URL = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY =
	privateEnv.SUPABASE_ANON_KEY ||
	privateEnv.SUPABASE_PUBLISHABLE_KEY ||
	privateEnv.SUPABASE_KEY ||
	publicEnv.PUBLIC_SUPABASE_ANON_KEY ||
	publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_AUTH_KEY = SUPABASE_PUBLIC_KEY || privateEnv.SUPABASE_SERVICE_KEY;
const SUPABASE_SERVICE_KEY = privateEnv.SUPABASE_SERVICE_KEY;

const AUTH_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS public.app_users (
	id UUID PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
	id TEXT PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
	expires_at timestamptz NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON public.app_sessions(expires_at);
`;

let authTablesReady = false;

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

function getSupabaseClient({ admin = false } = {}) {
	const key = admin ? SUPABASE_SERVICE_KEY : SUPABASE_AUTH_KEY;

	if (!SUPABASE_URL || !key) {
		return null;
	}

	return createClient(normalizeSupabaseUrl(SUPABASE_URL), key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

function getSupabaseSignupClient() {
	if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
		return null;
	}

	return createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_PUBLIC_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

function hasSupabaseAuthConfigured() {
	return Boolean(getSupabaseClient());
}

function assertSupabaseAuthConfigured({ admin = false } = {}) {
	const supabase = getSupabaseClient({ admin });

	if (!supabase) {
		throw new Error(
			admin
				? 'SUPABASE_URL and SUPABASE_SERVICE_KEY are required for signup.'
				: 'SUPABASE_URL and a Supabase API key are required for login.'
		);
	}

	return supabase;
}

function assertSupabaseSignupConfigured() {
	const supabase = getSupabaseSignupClient();

	if (!supabase) {
		throw new Error('SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is required for email verification signup.');
	}

	return supabase;
}

export function getSessionCookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE
	};
}

export async function ensureAuthTables() {
	if (!hasDatabaseConnection()) {
		return;
	}

	if (authTablesReady) {
		return;
	}

	await withDb((client) => client.query(AUTH_TABLES_SQL));
	authTablesReady = true;
}

export function normalizeEmail(email) {
	return String(email ?? '').trim().toLowerCase();
}

export function validatePassword(password) {
	if (String(password ?? '').length < 8) {
		return '비밀번호는 8자 이상이어야 합니다.';
	}

	return '';
}

async function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = await scrypt(password, salt, 64);
	return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
	const [algorithm, salt, storedKey] = String(passwordHash).split(':');

	if (algorithm !== 'scrypt' || !salt || !storedKey) {
		return false;
	}

	const storedBuffer = Buffer.from(storedKey, 'hex');
	const derivedKey = await scrypt(password, salt, storedBuffer.length);

	return timingSafeEqual(storedBuffer, derivedKey);
}

function mapUser(row) {
	return row
		? {
				id: row.id,
				email: row.email,
				name: row.name,
				createdAt: row.created_at
			}
		: null;
}

function mapSupabaseUser(user) {
	const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

	return user
		? {
				id: user.id,
				email: user.email,
				name,
				createdAt: user.created_at
			}
		: null;
}

export async function createUser({ email, name, password, emailRedirectTo }) {
	const supabase = getSupabaseSignupClient();

	if (supabase) {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { name },
				emailRedirectTo
			}
		});

		if (error) {
			throw error;
		}

		return {
			...mapSupabaseUser(data.user),
			authSession: data.session,
			emailVerificationRequired: !data.session
		};
	}

	if (!hasDatabaseConnection()) {
		assertSupabaseSignupConfigured();
	}

	await ensureAuthTables();

	const passwordHash = await hashPassword(password);
	const userId = randomUUID();

	return withDb(async (client) => {
		const result = await client.query(
			`INSERT INTO public.app_users (id, email, name, password_hash)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, email, name, created_at`,
			[userId, email, name, passwordHash]
		);

		return mapUser(result.rows[0]);
	});
}

export async function authenticateUser({ email, password }) {
	const supabase = getSupabaseClient();

	if (supabase) {
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return null;
		}

		return {
			...mapSupabaseUser(data.user),
			authSession: data.session
		};
	}

	if (!hasDatabaseConnection()) {
		assertSupabaseAuthConfigured();
	}

	await ensureAuthTables();

	const result = await withDb((client) =>
		client.query('SELECT id, email, name, password_hash, created_at FROM public.app_users WHERE email = $1', [
			email
		])
	);
	const userRow = result.rows[0];

	if (!userRow || !(await verifyPassword(password, userRow.password_hash))) {
		return null;
	}

	return mapUser(userRow);
}

export async function createSession(userId) {
	await ensureAuthTables();

	const sessionId = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

	await withDb((client) =>
		client.query('INSERT INTO public.app_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [
			sessionId,
			userId,
			expiresAt
		])
	);

	return sessionId;
}

async function getDbUserFromSession(sessionId) {
	if (!sessionId) {
		return null;
	}

	await ensureAuthTables();

	const result = await withDb((client) =>
		client.query(
			`SELECT u.id, u.email, u.name, u.created_at
			 FROM public.app_sessions s
			 JOIN public.app_users u ON u.id = s.user_id
			 WHERE s.id = $1 AND s.expires_at > now()`,
			[sessionId]
		)
	);

	return mapUser(result.rows[0]);
}

export async function getUserFromSession(cookiesOrSessionId) {
	const accessToken =
		typeof cookiesOrSessionId === 'string' ? cookiesOrSessionId : cookiesOrSessionId?.get(SESSION_COOKIE);
	const refreshToken = typeof cookiesOrSessionId === 'string' ? null : cookiesOrSessionId?.get(REFRESH_COOKIE);

	if (accessToken && hasSupabaseAuthConfigured()) {
		const supabase = assertSupabaseAuthConfigured();
		const { data, error } = await supabase.auth.getUser(accessToken);

		if (!error && data.user) {
			return mapSupabaseUser(data.user);
		}

		if (refreshToken && typeof cookiesOrSessionId !== 'string') {
			const refreshed = await supabase.auth.refreshSession({ refresh_token: refreshToken });

			if (!refreshed.error && refreshed.data.session && refreshed.data.user) {
				setSupabaseSessionCookies(cookiesOrSessionId, refreshed.data.session);
				return mapSupabaseUser(refreshed.data.user);
			}
		}
	}

	if (hasDatabaseConnection()) {
		const sessionId =
			typeof cookiesOrSessionId === 'string' ? cookiesOrSessionId : cookiesOrSessionId?.get(SESSION_COOKIE);
		return getDbUserFromSession(sessionId);
	}

	return null;
}

export async function deleteSession(sessionId) {
	if (!hasDatabaseConnection()) {
		return;
	}

	if (!sessionId) {
		return;
	}

	await ensureAuthTables();
	await withDb((client) => client.query('DELETE FROM public.app_sessions WHERE id = $1', [sessionId]));
}

function setSupabaseSessionCookies(cookies, session) {
	cookies.set(SESSION_COOKIE, session.access_token, getSessionCookieOptions());

	if (session.refresh_token) {
		cookies.set(REFRESH_COOKIE, session.refresh_token, getSessionCookieOptions());
	}
}

export async function startSession(cookies, userOrId) {
	if (userOrId?.authSession) {
		setSupabaseSessionCookies(cookies, userOrId.authSession);
		return;
	}

	if (!hasDatabaseConnection()) {
		throw new Error('Supabase session was not created.');
	}

	const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
	const sessionId = await createSession(userId);
	cookies.set(SESSION_COOKIE, sessionId, getSessionCookieOptions());
}

export async function endSession(cookies) {
	const sessionId = cookies.get(SESSION_COOKIE);
	await deleteSession(sessionId);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

export function requireLogin(locals) {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}
}

export { REFRESH_COOKIE, SESSION_COOKIE };
