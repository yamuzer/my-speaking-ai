import { hasDatabaseConnection, withDb } from '$lib/server/db.js';

export const TERMS_VERSION = '2026-06-08';
export const PRIVACY_POLICY_VERSION = '2026-06-08';

const normalizeText = (value, maxLength) =>
	String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

const allowedEnglishLevels = new Set(['beginner', 'intermediate', 'advanced']);
const allowedAgeRanges = new Set(['teen', '20s', '30s', '40s', '50s_plus']);
const allowedLearningPurposes = new Set([
	'daily',
	'business',
	'interview',
	'travel',
	'exam',
	'academic',
	'other'
]);
const allowedPracticeFrequencies = new Set(['daily', 'weekly_3', 'weekly_1', 'occasional']);

function mapProfile(row) {
	return row
		? {
				displayName: row.display_name,
				ageRange: row.age_range,
				occupation: row.occupation,
				englishLevel: row.english_level,
				learningPurpose: row.learning_purpose,
				learningGoal: row.learning_goal,
				practiceFrequency: row.practice_frequency,
				interestSituations: row.interest_situations ?? [],
				termsAgreedAt: row.terms_agreed_at,
				privacyPolicyAgreedAt: row.privacy_policy_agreed_at,
				termsVersion: row.terms_version,
				privacyPolicyVersion: row.privacy_policy_version,
				onboardingCompletedAt: row.onboarding_completed_at
			}
		: null;
}

export function isOnboardingComplete(profile) {
	return Boolean(
		profile?.displayName &&
			profile?.ageRange &&
			profile?.occupation &&
			profile?.englishLevel &&
			profile?.learningPurpose &&
			profile?.learningGoal &&
			profile?.practiceFrequency &&
			profile?.termsAgreedAt &&
			profile?.privacyPolicyAgreedAt &&
			profile?.onboardingCompletedAt
	);
}

export async function loadUserProfile(user) {
	if (!hasDatabaseConnection() || !user?.id) {
		return {
			profile: null,
			profilePersistenceEnabled: false,
			onboardingCompleted: true
		};
	}

	try {
		return await withDb(async (client) => {
			const result = await client.query(
				`SELECT display_name, age_range, occupation, english_level,
					learning_purpose, learning_goal, practice_frequency, interest_situations,
					terms_agreed_at, privacy_policy_agreed_at,
					terms_version, privacy_policy_version, onboarding_completed_at
				 FROM public.user_profiles
				 WHERE user_id = $1
				 LIMIT 1`,
				[user.id]
			);
			const profile = mapProfile(result.rows[0]);

			return {
				profile,
				profilePersistenceEnabled: true,
				onboardingCompleted: isOnboardingComplete(profile)
			};
		});
	} catch (error) {
		if (error?.code === '42P01') {
			return {
				profile: null,
				profilePersistenceEnabled: false,
				onboardingCompleted: false
			};
		}

		throw error;
	}
}

export async function saveUserOnboarding(user, input) {
	if (!hasDatabaseConnection() || !user?.id) {
		throw new Error('DATABASE_URL is not set on the server.');
	}

	const displayName = normalizeText(input?.displayName, 40);
	const ageRange = normalizeText(input?.ageRange, 20);
	const occupation = normalizeText(input?.occupation, 80);
	const englishLevel = normalizeText(input?.englishLevel, 20);
	const learningPurpose = normalizeText(input?.learningPurpose, 20);
	const learningGoal = normalizeText(input?.learningGoal, 300);
	const practiceFrequency = normalizeText(input?.practiceFrequency, 20);
	const interestSituations = Array.isArray(input?.interestSituations)
		? input.interestSituations.map((item) => normalizeText(item, 40)).filter(Boolean).slice(0, 8)
		: [];
	const termsAgreed = input?.termsAgreed === true;
	const privacyPolicyAgreed = input?.privacyPolicyAgreed === true;

	if (!displayName) {
		throw new Error('이름 또는 닉네임을 입력해 주세요.');
	}

	if (!allowedAgeRanges.has(ageRange)) {
		throw new Error('연령대를 선택해 주세요.');
	}

	if (!occupation) {
		throw new Error('직업 또는 현재 역할을 입력해 주세요.');
	}

	if (!allowedEnglishLevels.has(englishLevel)) {
		throw new Error('영어 수준을 선택해 주세요.');
	}

	if (!allowedLearningPurposes.has(learningPurpose)) {
		throw new Error('주요 학습 목적을 선택해 주세요.');
	}

	if (!learningGoal) {
		throw new Error('학습 목표를 입력해 주세요.');
	}

	if (!allowedPracticeFrequencies.has(practiceFrequency)) {
		throw new Error('연습 빈도를 선택해 주세요.');
	}

	if (!termsAgreed || !privacyPolicyAgreed) {
		throw new Error('서비스 이용약관과 개인정보 처리방침에 모두 동의해 주세요.');
	}

	return withDb(async (client) => {
		const result = await client.query(
			`INSERT INTO public.user_profiles
			 (user_id, display_name, age_range, occupation, english_level,
				learning_purpose, learning_goal, practice_frequency, interest_situations,
				terms_agreed_at, privacy_policy_agreed_at,
				terms_version, privacy_policy_version, onboarding_completed_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now(), $10, $11, now(), now())
			 ON CONFLICT (user_id) DO UPDATE SET
				display_name = EXCLUDED.display_name,
				age_range = EXCLUDED.age_range,
				occupation = EXCLUDED.occupation,
				english_level = EXCLUDED.english_level,
				learning_purpose = EXCLUDED.learning_purpose,
				learning_goal = EXCLUDED.learning_goal,
				practice_frequency = EXCLUDED.practice_frequency,
				interest_situations = EXCLUDED.interest_situations,
				terms_agreed_at = COALESCE(public.user_profiles.terms_agreed_at, EXCLUDED.terms_agreed_at),
				privacy_policy_agreed_at = COALESCE(
					public.user_profiles.privacy_policy_agreed_at,
					EXCLUDED.privacy_policy_agreed_at
				),
				terms_version = EXCLUDED.terms_version,
				privacy_policy_version = EXCLUDED.privacy_policy_version,
				onboarding_completed_at = COALESCE(
					public.user_profiles.onboarding_completed_at,
					EXCLUDED.onboarding_completed_at
				),
				updated_at = now()
			 RETURNING display_name, age_range, occupation, english_level,
				learning_purpose, learning_goal, practice_frequency, interest_situations,
				terms_agreed_at, privacy_policy_agreed_at,
				terms_version, privacy_policy_version, onboarding_completed_at`,
			[
				user.id,
				displayName,
				ageRange,
				occupation,
				englishLevel,
				learningPurpose,
				learningGoal,
				practiceFrequency,
				JSON.stringify(interestSituations),
				TERMS_VERSION,
				PRIVACY_POLICY_VERSION
			]
		);

		return mapProfile(result.rows[0]);
	});
}
