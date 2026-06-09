import { env } from '$env/dynamic/private';
import { execSync } from 'node:child_process';
import pkg from '../../package.json' assert { type: 'json' };

function cleanEnvValue(value) {
	return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function getDeployShortSha() {
	const candidates = [
		env.VERCEL_GIT_COMMIT_SHA,
		env.VERCEL_GITHUB_COMMIT_SHA,
		env.GITHUB_SHA,
		env.CI_COMMIT_SHA,
		env.COMMIT_SHA
	].map(cleanEnvValue);

	for (const value of candidates) {
		if (value) {
			return value.slice(0, 7);
		}
	}

	return '';
}

function getCommitCount() {
	try {
		const count = execSync('git rev-list --count HEAD', {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		})
			.trim();

		return Number.isFinite(Number(count)) ? count : '';
	} catch {
		return '';
	}
}

function getAppVersion() {
	const baseVersion = String(pkg.version ?? '0.0.0').trim();
	const sha = getDeployShortSha();
	const commitCount = getCommitCount();

	if (sha) {
		return `${baseVersion}+${sha}`;
	}

	if (commitCount) {
		return `${baseVersion}+${commitCount}`;
	}

	return baseVersion;
}

export function load({ locals }) {
	return {
		user: locals.user,
		appVersion: getAppVersion()
	};
}
