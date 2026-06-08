import { requireLogin } from '$lib/server/auth.js';
import { loadConversationRecords } from '$lib/server/conversation-records.js';

export async function load({ locals }) {
	requireLogin(locals);
	const records = await loadConversationRecords(locals.user);

	return {
		user: locals.user,
		...records
	};
}
