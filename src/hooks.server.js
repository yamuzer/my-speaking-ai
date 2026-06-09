import { dev } from '$app/environment';
import { getUserFromSession } from '$lib/server/auth.js';

function setSecurityHeaders(response) {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(self), geolocation=(), payment=(), usb=()'
	);

	if (!dev) {
		response.headers.set('X-Frame-Options', 'DENY');
	}
}

export async function handle({ event, resolve }) {
	try {
		event.locals.user = await getUserFromSession(event.cookies);
	} catch {
		event.locals.user = null;
	}

	const response = await resolve(event);
	setSecurityHeaders(response);
	return response;
}
