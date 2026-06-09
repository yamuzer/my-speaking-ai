import { env } from '$env/dynamic/private';
import { hasDatabaseConnection, withDb } from '$lib/server/db.js';

const DEFAULT_TOKEN_QUOTA = normalizeTokenCount(env.DEFAULT_TOKEN_QUOTA ?? 500000);

function normalizeTokenCount(value) {
	const tokens = Number(value ?? 0);

	if (!Number.isFinite(tokens) || tokens < 0) {
		return 0;
	}

	return Math.round(tokens);
}

function normalizeTokenDelta(value) {
	const tokens = Number(value ?? 0);

	if (!Number.isFinite(tokens)) {
		return 0;
	}

	return Math.round(tokens);
}

function getUsageTokens(message) {
	const usage = message?.usage && typeof message.usage === 'object' ? message.usage : {};
	const explicitInputTokens = normalizeTokenCount(usage.inputTokens);
	const explicitOutputTokens = normalizeTokenCount(usage.outputTokens);
	const totalTokens = normalizeTokenCount(usage.totalTokens);

	if (explicitInputTokens || explicitOutputTokens) {
		return {
			inputTokens: explicitInputTokens,
			outputTokens: explicitOutputTokens
		};
	}

	if (message?.role === 'user') {
		return {
			inputTokens: totalTokens,
			outputTokens: 0
		};
	}

	if (message?.role === 'assistant') {
		return {
			inputTokens: 0,
			outputTokens: totalTokens
		};
	}

	return {
		inputTokens: 0,
		outputTokens: 0
	};
}

export function calculateSessionTokenUsage(messages) {
	return (Array.isArray(messages) ? messages : []).reduce(
		(total, message) => {
			const usage = getUsageTokens(message);
			total.inputTokens += usage.inputTokens;
			total.outputTokens += usage.outputTokens;
			total.totalTokens += usage.inputTokens + usage.outputTokens;
			return total;
		},
		{
			inputTokens: 0,
			outputTokens: 0,
			totalTokens: 0
		}
	);
}

function mapQuotaState(row) {
	const tokenQuota = normalizeTokenCount(
		row?.assigned_by_admin ? row?.token_quota : row?.default_token_quota ?? DEFAULT_TOKEN_QUOTA
	);
	const usedTokens = normalizeTokenCount(row?.used_tokens);
	const remainingTokens = Math.max(0, tokenQuota - usedTokens);

	return {
		quotaEnabled: Boolean(row?.quota_enabled ?? true),
		tokenQuota,
		usedTokens,
		remainingTokens,
		inputTokens: normalizeTokenCount(row?.input_tokens),
		outputTokens: normalizeTokenCount(row?.output_tokens)
	};
}

export async function loadTokenQuota(user) {
	if (!hasDatabaseConnection() || !user?.id) {
		return {
			quotaEnabled: false,
			tokenQuota: 0,
			usedTokens: 0,
			remainingTokens: Infinity,
			inputTokens: 0,
			outputTokens: 0
		};
	}

		try {
		return await withDb(async (client) => {
			const result = await client.query(
				`SELECT
					COALESCE(setting.default_token_quota, $2) AS default_token_quota,
					quota.token_quota,
					COALESCE(quota.quota_enabled, true) AS quota_enabled,
					COALESCE(quota.assigned_by_admin, false) AS assigned_by_admin,
					COALESCE(usage.input_tokens, 0) AS input_tokens,
					COALESCE(usage.output_tokens, 0) AS output_tokens,
					COALESCE(usage.total_tokens, 0) AS used_tokens
				 FROM (SELECT $1::uuid AS user_id) AS target
				 LEFT JOIN public.token_quota_settings AS setting
					ON setting.id = true
				 LEFT JOIN public.user_token_quotas AS quota
					ON quota.user_id = target.user_id
				 LEFT JOIN public.user_token_usage_totals AS usage
					ON usage.user_id = target.user_id
				 LIMIT 1`,
				[user.id, DEFAULT_TOKEN_QUOTA]
			);

			return mapQuotaState(result.rows[0]);
		});
	} catch (error) {
		if (error?.code === '42P01' || error?.code === '42703') {
			return {
				quotaEnabled: false,
				tokenQuota: 0,
				usedTokens: 0,
				remainingTokens: Infinity,
				inputTokens: 0,
				outputTokens: 0
			};
		}

		throw error;
	}
}

export async function ensureTokenQuotaAvailable(user) {
	const quota = await loadTokenQuota(user);

	if (quota.quotaEnabled && quota.remainingTokens <= 0) {
		const error = new Error('부여된 토큰 할당량을 모두 사용했습니다.');
		error.status = 429;
		error.quota = quota;
		throw error;
	}

	return quota;
}

export async function recordTokenUsageDelta(client, userId, delta) {
	const inputTokens = normalizeTokenDelta(delta?.inputTokens);
	const outputTokens = normalizeTokenDelta(delta?.outputTokens);
	const totalTokens = normalizeTokenDelta(delta?.totalTokens);

	if (!userId || (!inputTokens && !outputTokens && !totalTokens)) {
		return;
	}

	await client.query(
		`INSERT INTO public.user_token_usage_totals (user_id)
		 VALUES ($1)
		 ON CONFLICT (user_id) DO NOTHING`,
		[userId]
	);

	await client.query(
		`UPDATE public.user_token_usage_totals
		 SET input_tokens = GREATEST(0, input_tokens + $2),
			output_tokens = GREATEST(0, output_tokens + $3),
			total_tokens = GREATEST(0, total_tokens + $4),
			updated_at = now()
		 WHERE user_id = $1`,
		[userId, inputTokens, outputTokens, totalTokens]
	);
}
