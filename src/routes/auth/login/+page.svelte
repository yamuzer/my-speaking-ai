<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>로그인 | 실시간 영어회화 코치</title>
</svelte:head>

<main class="auth-page">
	<section class="auth-panel" aria-labelledby="login-title">
		<header class="auth-header">
			<p class="eyebrow">Real-time English Coach</p>
			<h1 id="login-title">실시간 영어회화 AI</h1>
			<p class="lead">AI와 바로 말하며 영어 대화를 연습하세요.</p>
		</header>

		{#if data.verified}
			<p class="success" role="status">이메일 인증이 완료됐습니다. 이제 로그인해 주세요.</p>
		{/if}

		<form method="POST">
			<label>
				<span>이메일</span>
				<input name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
			</label>

			<label>
				<span>비밀번호</span>
				<div class="password-field">
					<input
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						required
					/>
					<button
						class="password-toggle"
						type="button"
						aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
						aria-pressed={showPassword}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M3 3l18 18" />
								<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
								<path d="M9.3 5.4A8.4 8.4 0 0 1 12 5c5 0 8.4 4.4 9.5 6.1a1.7 1.7 0 0 1 0 1.8 18.1 18.1 0 0 1-2.6 3.2" />
								<path d="M6.5 6.8a18.5 18.5 0 0 0-4 4.3 1.7 1.7 0 0 0 0 1.8C3.6 14.6 7 19 12 19a8.6 8.6 0 0 0 4.1-1" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M2.5 11.1C3.6 9.4 7 5 12 5s8.4 4.4 9.5 6.1a1.7 1.7 0 0 1 0 1.8C20.4 14.6 17 19 12 19s-8.4-4.4-9.5-6.1a1.7 1.7 0 0 1 0-1.8Z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						{/if}
					</button>
				</div>
			</label>

			{#if form?.error}
				<p class="error" role="alert">{form.error}</p>
			{/if}

			<button type="submit">로그인</button>
		</form>

		<p class="switch">처음이신가요? <a href={resolve('/auth/register')}>회원가입</a></p>
	</section>
</main>

<style>
	.auth-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 32px 16px;
		background:
			linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0 38%, transparent 38%),
			linear-gradient(135deg, #eef6f3 0%, #f8fbff 47%, #fff4ec 100%);
		color: #1f2428;
	}

	.auth-panel {
		width: min(100%, 440px);
		padding: clamp(26px, 6vw, 38px);
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 24px 70px rgba(33, 50, 56, 0.14);
		backdrop-filter: blur(18px);
	}

	.auth-header {
		display: grid;
		justify-items: center;
		gap: 10px;
		margin-bottom: 26px;
		text-align: center;
	}

	.eyebrow {
		margin: 0;
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		line-height: 1;
	}

	h1 {
		margin: 0;
		max-width: 100%;
		font-size: clamp(1.9rem, 7vw, 2.45rem);
		font-weight: 900;
		line-height: 1.08;
		overflow-wrap: anywhere;
	}

	.lead {
		margin: 0;
		max-width: 24rem;
		color: #5f6970;
		line-height: 1.55;
		text-wrap: balance;
		word-break: keep-all;
	}

	form,
	label {
		display: grid;
		gap: 10px;
	}

	form {
		gap: 16px;
	}

	label span {
		font-size: 0.9rem;
		font-weight: 800;
	}

	input {
		min-height: 48px;
		width: 100%;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		padding: 0 13px;
		font: inherit;
		background: #fbfefd;
		color: #1f2428;
	}

	input:focus {
		outline: 3px solid rgba(31, 139, 124, 0.18);
		border-color: #1f8b7c;
	}

	.password-field {
		position: relative;
		display: grid;
	}

	.password-field input {
		padding-right: 50px;
	}

	.password-toggle {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		width: 38px;
		min-height: 38px;
		display: inline-grid;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: #66737a;
		box-shadow: none;
	}

	.password-toggle:hover {
		background: #edf5f3;
	}

	.password-toggle:focus-visible {
		outline: 3px solid rgba(31, 139, 124, 0.18);
	}

	.password-toggle svg {
		width: 21px;
		height: 21px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	button {
		min-height: 52px;
		border: 0;
		border-radius: 8px;
		background: #1f8b7c;
		color: white;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
	}

	button:hover {
		background: #176f65;
	}

	.error {
		margin: 0;
		padding: 12px 13px;
		border-radius: 8px;
		background: #fff0ee;
		color: #a2362e;
		font-weight: 700;
		line-height: 1.5;
	}

	.success {
		margin: 0 0 16px;
		padding: 12px 13px;
		border-radius: 8px;
		background: #eef8f1;
		color: #24724d;
		font-weight: 800;
		line-height: 1.5;
	}

	.switch {
		margin: 18px 0 0;
		color: #5f6970;
		text-align: center;
		line-height: 1.5;
	}

	a {
		color: #176f65;
		font-weight: 900;
	}
</style>
