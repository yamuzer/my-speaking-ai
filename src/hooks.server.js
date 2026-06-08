import { getUserFromSession } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	try {
		event.locals.user = await getUserFromSession(event.cookies);
	} catch {
		event.locals.user = null;
	}

	return resolve(event);
}
