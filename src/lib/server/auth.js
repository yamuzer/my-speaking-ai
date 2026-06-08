import { redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const SESSION_COOKIE = 'auth_session';
const REFRESH_COOKIE = 'auth_refresh';
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;
function cleanEnvValue(value) {
	return String(value ?? '')
		.replace(/\uFEFF/g, '')
		.trim();
}

const SUPABASE_URL = cleanEnvValue(privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL);
const SUPABASE_PUBLIC_KEY =
	cleanEnvValue(
		privateEnv.SUPABASE_ANON_KEY ||
			privateEnv.SUPABASE_PUBLISHABLE_KEY ||
			privateEnv.SUPABASE_KEY ||
			publicEnv.PUBLIC_SUPABASE_ANON_KEY ||
			publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY
	);
const SUPABASE_AUTH_KEY = SUPABASE_PUBLIC_KEY || cleanEnvValue(privateEnv.SUPABASE_SERVICE_KEY);

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
	if (!SUPABASE_URL || !SUPABASE_AUTH_KEY) {
		return null;
	}

	return createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_AUTH_KEY, {
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

function assertSupabaseAuthConfigured() {
	const supabase = getSupabaseClient();

	if (!supabase) {
		throw new Error('SUPABASE_URL and a Supabase API key are required for login.');
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

export function normalizeEmail(email) {
	return String(email ?? '').trim().toLowerCase();
}

export function validatePassword(password) {
	if (String(password ?? '').length < 8) {
		return '비밀번호는 8자 이상이어야 합니다.';
	}

	return '';
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
	const supabase = assertSupabaseSignupConfigured();
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

export async function authenticateUser({ email, password }) {
	const supabase = assertSupabaseAuthConfigured();
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		return null;
	}

	return {
		...mapSupabaseUser(data.user),
		authSession: data.session
	};
}

export async function getUserFromSession(cookiesOrSessionId) {
	const accessToken =
		typeof cookiesOrSessionId === 'string' ? cookiesOrSessionId : cookiesOrSessionId?.get(SESSION_COOKIE);
	const refreshToken = typeof cookiesOrSessionId === 'string' ? null : cookiesOrSessionId?.get(REFRESH_COOKIE);

	if (!accessToken) {
		return null;
	}

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

	return null;
}

function setSupabaseSessionCookies(cookies, session) {
	cookies.set(SESSION_COOKIE, session.access_token, getSessionCookieOptions());

	if (session.refresh_token) {
		cookies.set(REFRESH_COOKIE, session.refresh_token, getSessionCookieOptions());
	}
}

export async function startSession(cookies, user) {
	if (!user?.authSession) {
		throw new Error('Supabase session was not created.');
	}

	setSupabaseSessionCookies(cookies, user.authSession);
}

export async function endSession(cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

export function requireLogin(locals) {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}
}

export { REFRESH_COOKIE, SESSION_COOKIE };
