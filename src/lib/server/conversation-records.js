import { hasDatabaseConnection, withDb } from '$lib/server/db.js';

const formatSessionDate = (date) =>
	new Intl.DateTimeFormat('ko-KR', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'Asia/Seoul'
	}).format(date);

const formatSessionTime = (date) =>
	new Intl.DateTimeFormat('ko-KR', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Seoul'
	}).format(date);

function normalizeMessages(messages) {
	return Array.isArray(messages)
		? messages.filter((message) => message?.role && typeof message.text === 'string')
		: [];
}

function mapRecord(row) {
	const startedAt = new Date(row.started_at);

	return {
		id: row.id,
		title: row.title,
		startedAt: row.started_at,
		dateLabel: formatSessionDate(startedAt),
		timeLabel: formatSessionTime(startedAt),
		coachStyle: row.coach_style ?? {},
		status: row.status,
		durationSeconds: Number(row.duration_seconds ?? 0),
		messages: normalizeMessages(row.messages)
	};
}

export async function loadConversationRecords(user) {
	if (!hasDatabaseConnection() || !user?.id) {
		return {
			conversationSessions: [],
			persistenceEnabled: false
		};
	}

	return withDb(async (client) => {
		const result = await client.query(
			`SELECT id, title, coach_style, messages, status, duration_seconds, started_at
			 FROM public.conversation_records
			 WHERE user_id = $1
			 ORDER BY started_at DESC
			 LIMIT 100`,
			[user.id]
		);

		return {
			conversationSessions: result.rows.map(mapRecord),
			persistenceEnabled: true
		};
	});
}

export async function saveConversationRecord(user, session) {
	if (!hasDatabaseConnection() || !user?.id || !session?.id) {
		return;
	}

	await withDb(async (client) => {
		await client.query(
			`INSERT INTO public.conversation_records
			 (id, user_id, title, coach_style, messages, status, duration_seconds, started_at, updated_at)
			 VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, now())
			 ON CONFLICT (id) DO UPDATE SET
				title = EXCLUDED.title,
				coach_style = EXCLUDED.coach_style,
				messages = EXCLUDED.messages,
				status = EXCLUDED.status,
				duration_seconds = EXCLUDED.duration_seconds,
				updated_at = now()`,
			[
				session.id,
				user.id,
				session.title ?? '영어회화 기록',
				JSON.stringify(session.coachStyle ?? {}),
				JSON.stringify(normalizeMessages(session.messages)),
				session.status ?? 'ended',
				Number(session.durationSeconds ?? 0),
				session.startedAt ?? new Date().toISOString()
			]
		);
	});
}
