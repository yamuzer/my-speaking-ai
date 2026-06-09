import { fail, redirect } from '@sveltejs/kit';
import { requireLogin } from '$lib/server/auth.js';
import { loadConversationRecords } from '$lib/server/conversation-records.js';
import { loadPromptStyles } from '$lib/server/prompt-styles.js';
import { loadTokenQuota } from '$lib/server/token-quota.js';
import { loadUserProfile, saveUserOnboarding } from '$lib/server/user-profile.js';

export async function load({ locals }) {
	requireLogin(locals);
	const [profileStatus, records, promptStyles, tokenQuota] = await Promise.all([
		loadUserProfile(locals.user),
		loadConversationRecords(locals.user),
		loadPromptStyles(locals.user),
		loadTokenQuota(locals.user)
	]);

	if (!profileStatus.onboardingCompleted) {
		throw redirect(303, '/onboarding');
	}

	return {
		user: locals.user,
		profile: profileStatus.profile,
		tokenQuota,
		...records,
		...promptStyles
	};
}

export const actions = {
	profile: async ({ locals, request }) => {
		requireLogin(locals);

		const formData = await request.formData();
		const displayName = String(formData.get('displayName') ?? '');
		const ageRange = String(formData.get('ageRange') ?? '');
		const occupation = String(formData.get('occupation') ?? '');
		const englishLevel = String(formData.get('englishLevel') ?? '');
		const learningPurpose = String(formData.get('learningPurpose') ?? '');
		const learningGoal = String(formData.get('learningGoal') ?? '');
		const practiceFrequency = String(formData.get('practiceFrequency') ?? '');
		const interestSituations = formData.getAll('interestSituations').map(String);

		try {
			await saveUserOnboarding(locals.user, {
				displayName,
				ageRange,
				occupation,
				englishLevel,
				learningPurpose,
				learningGoal,
				practiceFrequency,
				interestSituations,
				termsAgreed: true,
				privacyPolicyAgreed: true
			});
		} catch (error) {
			return fail(400, {
				formName: 'profile',
				displayName,
				ageRange,
				occupation,
				englishLevel,
				learningPurpose,
				learningGoal,
				practiceFrequency,
				interestSituations,
				error: error instanceof Error ? error.message : '사용자 정보를 저장하지 못했습니다.'
			});
		}

		return {
			formName: 'profile',
			success: '사용자 정보를 저장했습니다.'
		};
	}
};
