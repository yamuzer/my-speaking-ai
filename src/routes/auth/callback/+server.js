import { redirect } from '@sveltejs/kit';

export function GET() {
	throw redirect(303, '/auth/login?verified=1');
}
