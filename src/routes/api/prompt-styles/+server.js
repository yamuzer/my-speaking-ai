import { json } from '@sveltejs/kit';
import { savePromptStyle } from '$lib/server/prompt-styles.js';

export const POST = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: '로그인이 필요합니다.' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);

	if (!body?.style) {
		return json({ error: '저장할 프롬프트 스타일이 없습니다.' }, { status: 400 });
	}

	try {
		const style = await savePromptStyle(locals.user, body.style);
		return json({ style });
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : '프롬프트 스타일 저장에 실패했습니다.'
			},
			{ status: 400 }
		);
	}
};
