import { fail, redirect } from '@sveltejs/kit';
import { authenticateUser, normalizeEmail, startSession } from '$lib/server/auth.js';

export function load({ locals, url }) {
	if (locals.user) {
		throw redirect(303, '/');
	}

	return {
		verified: url.searchParams.get('verified') === '1'
	};
}

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = normalizeEmail(formData.get('email'));
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: '이메일과 비밀번호를 입력해 주세요.' });
		}

		let user;
		try {
			user = await authenticateUser({ email, password });
		} catch {
			return fail(400, { email, error: '로그인할 수 없어요. Supabase 인증 설정을 확인해 주세요.' });
		}

		if (!user) {
			return fail(400, { email, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
		}

		await startSession(cookies, user);
		throw redirect(303, '/');
	}
};
