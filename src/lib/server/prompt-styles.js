import { randomUUID } from 'node:crypto';
import { hasDatabaseConnection, withDb } from '$lib/server/db.js';

const normalizeText = (value, maxLength) =>
	String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

function mapPromptStyle(row) {
	return {
		id: row.id,
		icon: '✨',
		name: row.name,
		badge: row.badge,
		description: row.description,
		instructions: row.instructions,
		favorite: row.favorite,
		custom: true
	};
}

export async function loadPromptStyles(user) {
	if (!hasDatabaseConnection() || !user?.id) {
		return {
			promptStyles: [],
			promptStylePersistenceEnabled: false
		};
	}

	return withDb(async (client) => {
		const result = await client.query(
			`SELECT id, name, badge, description, instructions, favorite
			 FROM public.prompt_styles
			 WHERE user_id = $1
			 ORDER BY favorite DESC, updated_at DESC
			 LIMIT 100`,
			[user.id]
		);

		return {
			promptStyles: result.rows.map(mapPromptStyle),
			promptStylePersistenceEnabled: true
		};
	});
}

export async function savePromptStyle(user, style) {
	if (!hasDatabaseConnection() || !user?.id) {
		throw new Error('DATABASE_URL is not set on the server.');
	}

	const name = normalizeText(style?.name, 40);
	const description = normalizeText(style?.description, 90);
	const instructions = normalizeText(style?.instructions, 2000);
	const favorite = Boolean(style?.favorite);
	const badge = favorite ? '즐겨찾기' : '직접 설정';

	if (!name || !description || !instructions) {
		throw new Error('이름, 설명, 프롬프트 내용을 모두 입력해 주세요.');
	}

	return withDb(async (client) => {
		const result = await client.query(
			`INSERT INTO public.prompt_styles
			 (id, user_id, name, badge, description, instructions, favorite, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, now())
			 ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				badge = EXCLUDED.badge,
				description = EXCLUDED.description,
				instructions = EXCLUDED.instructions,
				favorite = EXCLUDED.favorite,
				updated_at = now()
			 WHERE public.prompt_styles.user_id = EXCLUDED.user_id
			 RETURNING id, name, badge, description, instructions, favorite`,
			[style?.id ?? randomUUID(), user.id, name, badge, description, instructions, favorite]
		);

		if (!result.rows[0]) {
			throw new Error('수정할 프롬프트 스타일을 찾지 못했습니다.');
		}

		return mapPromptStyle(result.rows[0]);
	});
}
