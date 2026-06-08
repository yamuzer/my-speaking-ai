import { redirect } from '@sveltejs/kit';
import { endSession } from '$lib/server/auth.js';

export async function POST({ cookies }) {
	await endSession(cookies);
	throw redirect(303, '/auth/login');
}
