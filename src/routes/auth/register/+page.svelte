<script>
	import { resolve } from '$app/paths';

	let { form } = $props();
	let email = $state('');
	let lastFormEmail = $state('');
	let showPassword = $state(false);
	let showPasswordConfirm = $state(false);
	let password = $state('');
	let passwordConfirm = $state('');

	let passwordLengthState = $derived(
		password.length === 0 ? 'idle' : password.length >= 8 ? 'valid' : 'invalid'
	);
	let passwordMatchState = $derived(
		passwordConfirm.length === 0 ? 'idle' : password === passwordConfirm ? 'valid' : 'invalid'
	);

	$effect(() => {
		if (form?.email && form.email !== lastFormEmail) {
			email = form.email;
			lastFormEmail = form.email;
		}
	});
</script>

<svelte:head>
	<title>회원가입 | 실시간 영어회화 코치</title>
</svelte:head>

<main class="auth-page">
	<section class="auth-panel" aria-labelledby="register-title">
		<header class="auth-header">
			<p class="eyebrow">Create account</p>
			<h1 id="register-title">회원가입</h1>
			<p class="lead">인증 메일 확인 후 바로 시작할 수 있어요.</p>
		</header>

		<form method="POST">
			<label>
				<span>이메일</span>
				<input name="email" type="email" autocomplete="email" bind:value={email} required />
			</label>

			<label>
				<span>비밀번호</span>
				<div class="password-field">
					<input
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						minlength="8"
						aria-describedby="password-rules"
						bind:value={password}
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
				<ul id="password-rules" class="validation-list" aria-live="polite">
					<li class={passwordLengthState}>
						<span aria-hidden="true">{passwordLengthState === 'valid' ? '✓' : '•'}</span>
						비밀번호는 8자 이상이어야 합니다.
					</li>
				</ul>
			</label>

			<label>
				<span>비밀번호 확인</span>
				<div class="password-field">
					<input
						name="passwordConfirm"
						type={showPasswordConfirm ? 'text' : 'password'}
						autocomplete="new-password"
						minlength="8"
						aria-describedby="password-confirm-rule"
						bind:value={passwordConfirm}
						required
					/>
					<button
						class="password-toggle"
						type="button"
						aria-label={showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
						aria-pressed={showPasswordConfirm}
						onclick={() => (showPasswordConfirm = !showPasswordConfirm)}
					>
						{#if showPasswordConfirm}
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
				<p id="password-confirm-rule" class:valid={passwordMatchState === 'valid'} class:invalid={passwordMatchState === 'invalid'} class="validation-message" aria-live="polite">
					{#if passwordMatchState === 'valid'}
						비밀번호가 일치합니다.
					{:else if passwordMatchState === 'invalid'}
						비밀번호가 서로 일치하지 않습니다.
					{:else}
						비밀번호를 한 번 더 입력해 주세요.
					{/if}
				</p>
			</label>

			{#if form?.error}
				<p class="error" role="alert">{form.error}</p>
			{/if}

			{#if form?.success}
				<p class="success" role="status">{form.success}</p>
			{/if}

			<button type="submit">가입하기</button>
		</form>

		<p class="switch">이미 계정이 있나요? <a href={resolve('/auth/login')}>로그인</a></p>
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

	.validation-list {
		display: grid;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
		color: #736c62;
		font-size: 0.86rem;
		line-height: 1.45;
	}

	.validation-list li {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.validation-list span {
		width: 16px;
		display: inline-grid;
		place-items: center;
		font-weight: 900;
	}

	.validation-list .valid,
	.validation-message.valid {
		color: #24724d;
		font-weight: 800;
	}

	.validation-list .invalid,
	.validation-message.invalid {
		color: #9c3029;
		font-weight: 800;
	}

	.validation-message {
		margin: 0;
		color: #736c62;
		font-size: 0.86rem;
		line-height: 1.45;
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
		margin: 0;
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
