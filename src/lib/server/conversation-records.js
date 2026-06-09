import { hasDatabaseConnection, withDb } from '$lib/server/db.js';
import { calculateSessionTokenUsage, recordTokenUsageDelta } from '$lib/server/token-quota.js';

const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 2000;
const MAX_TITLE_CHARS = 120;
const MAX_DURATION_SECONDS = 60 * 60 * 6;
const allowedMessageRoles = new Set(['user', 'assistant']);

const normalizeText = (value, maxLength) =>
	String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

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

function isMissingTokenSchema(error) {
	return ['42P01', '42703'].includes(error?.code);
}

function normalizeMessages(messages, sessionId = 'session') {
	return Array.isArray(messages)
		? messages
				.filter((message) => allowedMessageRoles.has(message?.role) && typeof message.text === 'string')
				.slice(-MAX_MESSAGES)
				.map((message, index) => {
					const text = normalizeText(message.text, MAX_MESSAGE_CHARS);

					return {
						id: normalizeText(message.id, 120) || `${sessionId}-${index}`,
						role: message.role,
						text,
						time: normalizeText(message.time, 40),
						model: normalizeText(message.model, 80),
						transcriptionModel: normalizeText(message.transcriptionModel, 80),
						usage: message.usage && typeof message.usage === 'object' ? message.usage : undefined
					};
				})
				.filter((message) => message.text)
		: [];
}

function normalizeDurationSeconds(value) {
	const duration = Number(value ?? 0);

	if (!Number.isFinite(duration) || duration < 0) {
		return 0;
	}

	return Math.min(duration, MAX_DURATION_SECONDS);
}

function normalizeStartedAt(value) {
	const date = new Date(value ?? Date.now());
	const now = Date.now();
	const thirtyDaysAgo = now - 1000 * 60 * 60 * 24 * 30;

	if (!Number.isFinite(date.getTime()) || date.getTime() < thirtyDaysAgo || date.getTime() > now + 60000) {
		return new Date().toISOString();
	}

	return date.toISOString();
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
		inputTokens: Number(row.input_tokens ?? 0),
		outputTokens: Number(row.output_tokens ?? 0),
		totalTokens: Number(row.total_tokens ?? 0),
		messages: normalizeMessages(row.messages, row.id)
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
		let result;

		try {
			result = await client.query(
				`SELECT id, title, coach_style, messages, status, duration_seconds,
					input_tokens, output_tokens, total_tokens, started_at
				 FROM public.conversation_records
				 WHERE user_id = $1
				 ORDER BY started_at DESC
				 LIMIT 100`,
				[user.id]
			);
		} catch (error) {
			if (!isMissingTokenSchema(error)) {
				throw error;
			}

			result = await client.query(
				`SELECT id, title, coach_style, messages, status, duration_seconds, started_at
				 FROM public.conversation_records
				 WHERE user_id = $1
				 ORDER BY started_at DESC
				 LIMIT 100`,
				[user.id]
			);
		}

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
		await client.query('BEGIN');

		try {
			const messages = normalizeMessages(session.messages, session.id);
			const usage = calculateSessionTokenUsage(messages);
			const startedAt = normalizeStartedAt(session.startedAt);
			const previous = await client.query(
				`SELECT input_tokens, output_tokens, total_tokens
				 FROM public.conversation_records
				 WHERE id = $1 AND user_id = $2
				 FOR UPDATE`,
				[session.id, user.id]
			);
			const previousUsage = previous.rows[0] ?? {};
			const usageDelta = {
				inputTokens: usage.inputTokens - Number(previousUsage.input_tokens ?? 0),
				outputTokens: usage.outputTokens - Number(previousUsage.output_tokens ?? 0),
				totalTokens: usage.totalTokens - Number(previousUsage.total_tokens ?? 0)
			};

			await client.query(
				`INSERT INTO public.conversation_records
				 (id, user_id, title, coach_style, messages, status, duration_seconds,
					input_tokens, output_tokens, total_tokens, started_at, updated_at)
				 VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, now())
				 ON CONFLICT (id) DO UPDATE SET
					title = EXCLUDED.title,
					coach_style = EXCLUDED.coach_style,
					messages = EXCLUDED.messages,
					status = EXCLUDED.status,
					duration_seconds = EXCLUDED.duration_seconds,
					input_tokens = EXCLUDED.input_tokens,
					output_tokens = EXCLUDED.output_tokens,
					total_tokens = EXCLUDED.total_tokens,
					updated_at = now()`,
				[
					session.id,
					user.id,
					normalizeText(session.title ?? '영어회화 기록', MAX_TITLE_CHARS) || '영어회화 기록',
					JSON.stringify(session.coachStyle ?? {}),
					JSON.stringify(messages),
					session.status ?? 'ended',
					normalizeDurationSeconds(session.durationSeconds),
					usage.inputTokens,
					usage.outputTokens,
					usage.totalTokens,
					startedAt
				]
			);

			await recordTokenUsageDelta(client, user.id, usageDelta);
			await client.query('COMMIT');
		} catch (error) {
			await client.query('ROLLBACK').catch(() => {});

			if (!isMissingTokenSchema(error)) {
				throw error;
			}

			const messages = normalizeMessages(session.messages, session.id);

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
					normalizeText(session.title ?? '영어회화 기록', MAX_TITLE_CHARS) || '영어회화 기록',
					JSON.stringify(session.coachStyle ?? {}),
					JSON.stringify(messages),
					session.status ?? 'ended',
					normalizeDurationSeconds(session.durationSeconds),
					normalizeStartedAt(session.startedAt)
				]
			);
		}
	});
}
