import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

const SESSION_INSTRUCTIONS = `
You are a low-latency English conversation coach for a Korean learner.
Speak naturally in English, keep responses short, and ask one clear follow-up question.
If the user makes a small grammar or vocabulary mistake, continue the conversation first,
then add one brief correction at the end. Do not over-explain unless the user asks.
`;

export const GET = async () => {
	if (!env.OPENAI_API_KEY) {
		return json(
			{
				error: 'OPENAI_API_KEY is not set on the server.',
				step: 'env.OPENAI_API_KEY'
			},
			{ status: 500 }
		);
	}

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
				instructions: SESSION_INSTRUCTIONS,
				audio: {
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
};
