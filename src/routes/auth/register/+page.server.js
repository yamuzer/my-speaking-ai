import { fail, redirect } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createUser, normalizeEmail, startSession, validatePassword } from '$lib/server/auth.js';
import { loadUserProfile } from '$lib/server/user-profile.js';

function getEmailRedirectTo(url) {
	const siteUrl = (privateEnv.PUBLIC_SITE_URL || publicEnv.PUBLIC_SITE_URL)?.trim().replace(/\/$/, '');
	return `${siteUrl || url.origin}/auth/callback`;
}

function getRegisterErrorMessage(error) {
	if (error?.code === '23505' || error?.code === 'email_exists' || /already|registered/i.test(error?.message)) {
		return '이미 가입된 이메일입니다.';
	}

	if (error?.code === 'over_email_send_rate_limit' || /rate limit/i.test(error?.message)) {
		return '인증 메일 발송 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.';
	}

	if (error?.name === 'AuthRetryableFetchError' || error?.status === 504) {
		return 'Supabase 인증 메일 요청이 시간 초과됐습니다. SMTP 서버 응답이 너무 느리거나 연결되지 않습니다.';
	}

	if (error?.code === 'unexpected_failure' && /confirmation email/i.test(error?.message)) {
		return '인증 메일 발송에 실패했습니다. Supabase SMTP 발신 주소와 SMTP 인증 정보를 확인해 주세요.';
	}

	if (error?.code === 'email_address_invalid') {
		return 'Supabase에서 허용하지 않는 이메일 주소입니다. 실제로 받을 수 있는 이메일을 입력해 주세요.';
	}

	if (/redirect|not allowed|uri|url/i.test(error?.message)) {
		return '인증 후 돌아올 URL이 Supabase Redirect URL 목록에 없습니다.';
	}

	return `회원가입을 완료하지 못했어요. Supabase 응답: ${error?.message ?? '알 수 없는 오류'}`;
}

export async function load({ locals }) {
	if (locals.user) {
		const profileStatus = await loadUserProfile(locals.user);
		if (!profileStatus.onboardingCompleted) {
			throw redirect(303, '/onboarding');
		}

		throw redirect(303, '/');
	}
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = normalizeEmail(formData.get('email'));
		const password = String(formData.get('password') ?? '');
		const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

		if (!email || !email.includes('@')) {
			return fail(400, { email, error: '사용 가능한 이메일을 입력해 주세요.' });
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			return fail(400, { email, error: passwordError });
		}

		if (password !== passwordConfirm) {
			return fail(400, { email, error: '비밀번호가 서로 일치하지 않습니다.' });
		}

		try {
			const name = email.split('@')[0];
			const user = await createUser({
				email,
				name,
				password,
				emailRedirectTo: getEmailRedirectTo(url)
			});
			if (user.emailVerificationRequired) {
				return {
					email,
					success: '인증 메일을 보냈습니다. 이메일을 확인한 뒤 로그인해 주세요.'
				};
			}

			await startSession(cookies, user);
		} catch (error) {
			console.error('Register action failed', {
				name: error?.name,
				code: error?.code,
				status: error?.status,
				message: error?.message
			});

			return fail(400, { email, error: getRegisterErrorMessage(error) });
		}

		throw redirect(303, '/onboarding');
	}
};
