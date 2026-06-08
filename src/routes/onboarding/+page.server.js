import { fail, redirect } from '@sveltejs/kit';
import { requireLogin } from '$lib/server/auth.js';
import {
	loadUserProfile,
	PRIVACY_POLICY_VERSION,
	saveUserOnboarding,
	TERMS_VERSION
} from '$lib/server/user-profile.js';

export async function load({ locals }) {
	requireLogin(locals);

	const profileStatus = await loadUserProfile(locals.user);
	if (profileStatus.onboardingCompleted) {
		throw redirect(303, '/');
	}

	return {
		user: locals.user,
		profile: profileStatus.profile,
		profilePersistenceEnabled: profileStatus.profilePersistenceEnabled,
		termsVersion: TERMS_VERSION,
		privacyPolicyVersion: PRIVACY_POLICY_VERSION
	};
}

export const actions = {
	default: async ({ locals, request }) => {
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
		const termsAgreed = formData.get('termsAgreed') === 'on';
		const privacyPolicyAgreed = formData.get('privacyPolicyAgreed') === 'on';

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
				termsAgreed,
				privacyPolicyAgreed
			});
		} catch (error) {
			return fail(400, {
				displayName,
				ageRange,
				occupation,
				englishLevel,
				learningPurpose,
				learningGoal,
				practiceFrequency,
				interestSituations,
				termsAgreed,
				privacyPolicyAgreed,
				error: error instanceof Error ? error.message : '동의 정보를 저장하지 못했습니다.'
			});
		}

		throw redirect(303, '/');
	}
};
