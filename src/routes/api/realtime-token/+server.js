import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

const SESSION_INSTRUCTIONS = `
You are a low-latency English conversation coach for a Korean learner.
Speak naturally in English, keep responses short, and ask one clear follow-up question.
If the user makes a small grammar or vocabulary mistake, continue the conversation first,
then add one brief correction at the end. Do not over-explain unless the user asks.
`;

const normalizeText = (value, maxLength = 900) =>
	String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

const buildSessionInstructions = (coachStyle) => {
	const styleName = normalizeText(coachStyle?.name, 80);
	const styleInstructions = normalizeText(coachStyle?.instructions);
	const customInstructions = normalizeText(coachStyle?.customInstructions);

	return [
		SESSION_INSTRUCTIONS,
		styleName ? `Selected coach style: ${styleName}.` : '',
		styleInstructions ? `Coach style instructions: ${styleInstructions}` : '',
		customInstructions ? `User custom instructions: ${customInstructions}` : '',
		'Always keep the user safe, respectful, and focused on English conversation practice.'
	]
		.filter(Boolean)
		.join('\n');
};

async function createRealtimeToken({ locals, coachStyle }) {
	if (!locals.user) {
		return json({ error: '로그인이 필요합니다.' }, { status: 401 });
	}

	if (!env.OPENAI_API_KEY) {
		return json(
			{
				error: 'OPENAI_API_KEY is not set on the server.',
				step: 'env.OPENAI_API_KEY'
			},
			{ status: 500 }
		);
	}

	const instructions = buildSessionInstructions(coachStyle);

	const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			'Content-Type': 'application/json',
			'OpenAI-Safety-Identifier': 'local-speaking-practice-user'
		},
		body: JSON.stringify({
			session: {
				type: 'realtime',
				model: 'gpt-realtime-2',
				instructions,
				audio: {
					input: {
						transcription: {
							model: 'gpt-4o-transcribe',
							language: 'en'
						}
					},
					output: {
						voice: 'marin'
					}
				}
			}
		})
	});

	const data = await response.json();

	if (!response.ok) {
		return json(
			{
				error: data?.error?.message ?? 'Failed to create a realtime client secret.',
				step: 'openai.realtime.client_secrets',
				status: response.status,
				type: data?.error?.type,
				code: data?.error?.code
			},
			{ status: response.status }
		);
	}

	return json(data);
}

export const POST = async ({ locals, request }) => {
	const body = await request.json().catch(() => ({}));
	return createRealtimeToken({ locals, coachStyle: body.coachStyle });
};

export const GET = async ({ locals }) => createRealtimeToken({ locals });
