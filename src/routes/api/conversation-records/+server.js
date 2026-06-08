import { json } from '@sveltejs/kit';
import { saveConversationRecord } from '$lib/server/conversation-records.js';

export const POST = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: '로그인이 필요합니다.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);

	if (!body?.session?.id) {
		return json({ error: '저장할 대화 기록이 없습니다.' }, { status: 400 });
	}

	await saveConversationRecord(locals.user, body.session);

	return json({ ok: true });
};
