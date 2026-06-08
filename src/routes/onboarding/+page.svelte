<script>
	import { untrack } from 'svelte';

	let { data, form } = $props();

	let displayName = $state(
		untrack(() => form?.displayName ?? data.profile?.displayName ?? data.user.name ?? '')
	);
	let ageRange = $state(untrack(() => form?.ageRange ?? data.profile?.ageRange ?? ''));
	let occupation = $state(untrack(() => form?.occupation ?? data.profile?.occupation ?? ''));
	let englishLevel = $state(untrack(() => form?.englishLevel ?? data.profile?.englishLevel ?? ''));
	let learningPurpose = $state(
		untrack(() => form?.learningPurpose ?? data.profile?.learningPurpose ?? '')
	);
	let learningGoal = $state(untrack(() => form?.learningGoal ?? data.profile?.learningGoal ?? ''));
	let practiceFrequency = $state(
		untrack(() => form?.practiceFrequency ?? data.profile?.practiceFrequency ?? '')
	);
	let interestSituations = $state(
		untrack(() => form?.interestSituations ?? data.profile?.interestSituations ?? [])
	);
	let termsAgreed = $state(untrack(() => Boolean(form?.termsAgreed)));
	let privacyPolicyAgreed = $state(untrack(() => Boolean(form?.privacyPolicyAgreed)));

	const situationOptions = [
		['daily_chat', '일상 대화'],
		['meeting', '회의/업무'],
		['presentation', '발표'],
		['interview', '면접'],
		['travel', '여행'],
		['small_talk', '스몰토크']
	];
</script>

<svelte:head>
	<title>맞춤 설정 | 실시간 영어회화 코치</title>
</svelte:head>

<main class="onboarding-page">
	<section class="onboarding-panel" aria-labelledby="onboarding-title">
		<header>
			<p>Welcome aboard</p>
			<h1 id="onboarding-title">나만의 영어 코치 시작하기</h1>
			<span>{data.user.email} 계정으로 시작합니다</span>
		</header>

		<form method="POST">
			<section class="form-section" aria-labelledby="profile-title">
				<div class="section-title">
					<h2 id="profile-title">기본 프로필</h2>
					<small>사용자 그룹과 페르소나 분석에 활용됩니다</small>
				</div>

				<label>
					<span>이름 또는 닉네임 *</span>
					<input
						name="displayName"
						autocomplete="name"
						maxlength="40"
						bind:value={displayName}
						required
					/>
				</label>

				<div class="two-column">
					<label>
						<span>연령대 *</span>
						<select name="ageRange" bind:value={ageRange} required>
							<option value="" disabled>선택해 주세요</option>
							<option value="teen">10대</option>
							<option value="20s">20대</option>
							<option value="30s">30대</option>
							<option value="40s">40대</option>
							<option value="50s_plus">50대 이상</option>
						</select>
					</label>

					<label>
						<span>직업 또는 현재 역할 *</span>
						<input
							name="occupation"
							maxlength="80"
							bind:value={occupation}
							placeholder="예: 대학생, 개발자, 마케터"
							required
						/>
					</label>
				</div>

				<label>
					<span>영어 수준 *</span>
					<select name="englishLevel" bind:value={englishLevel} required>
						<option value="" disabled>선택해 주세요</option>
						<option value="beginner">초급</option>
						<option value="intermediate">중급</option>
						<option value="advanced">고급</option>
					</select>
				</label>
			</section>

			<section class="form-section" aria-labelledby="learning-title">
				<div class="section-title">
					<h2 id="learning-title">학습 맥락</h2>
					<small>어떤 코칭이 필요한지 파악합니다</small>
				</div>

				<div class="two-column">
					<label>
						<span>주요 학습 목적 *</span>
						<select name="learningPurpose" bind:value={learningPurpose} required>
							<option value="" disabled>선택해 주세요</option>
							<option value="daily">일상 회화</option>
							<option value="business">비즈니스/업무</option>
							<option value="interview">면접 준비</option>
							<option value="travel">여행</option>
							<option value="exam">시험/자격증</option>
							<option value="academic">유학/학업</option>
							<option value="other">기타</option>
						</select>
					</label>

					<label>
						<span>희망 연습 빈도 *</span>
						<select name="practiceFrequency" bind:value={practiceFrequency} required>
							<option value="" disabled>선택해 주세요</option>
							<option value="daily">매일</option>
							<option value="weekly_3">주 3회 이상</option>
							<option value="weekly_1">주 1회 정도</option>
							<option value="occasional">필요할 때만</option>
						</select>
					</label>
				</div>

				<fieldset>
					<legend>관심 있는 연습 상황</legend>
					<div class="checkbox-grid">
						{#each situationOptions as [value, label] (value)}
							<label class="chip-checkbox">
								<input
									name="interestSituations"
									type="checkbox"
									{value}
									bind:group={interestSituations}
								/>
								<span>{label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<label>
					<span>구체적인 학습 목표 *</span>
					<textarea
						name="learningGoal"
						maxlength="300"
						bind:value={learningGoal}
						placeholder="예: 해외 출장 회의에서 내 의견을 자연스럽게 말하고 싶어요."
						required
					></textarea>
				</label>
			</section>

			<section class="form-section" aria-labelledby="agreement-title">
				<div class="section-title">
					<h2 id="agreement-title">이용 동의</h2>
					<small>서비스 이용을 위해 필요합니다</small>
				</div>

				<label class="agreement-card">
					<input name="privacyPolicyAgreed" type="checkbox" bind:checked={privacyPolicyAgreed} />
					<span>
						<strong>개인정보 처리방침 동의 *</strong>
						<small>
							계정 식별 정보, 학습 목표, 대화 기록과 서비스 이용 기록을 영어 회화 연습 제공,
							사용자 페르소나 분석, 품질 개선을 위해 처리합니다. 버전 {data.privacyPolicyVersion}
						</small>
					</span>
				</label>

				<label class="agreement-card">
					<input name="termsAgreed" type="checkbox" bind:checked={termsAgreed} />
					<span>
						<strong>서비스 이용약관 동의 *</strong>
						<small>
							실시간 음성 대화 기능, API 사용량 추정, 대화 기록 저장 등 서비스 제공 조건에
							동의합니다. 버전 {data.termsVersion}
						</small>
					</span>
				</label>
			</section>

			{#if !data.profilePersistenceEnabled}
				<p class="error" role="alert">DB 연결이 없어 동의 정보를 저장할 수 없습니다.</p>
			{/if}

			{#if form?.error}
				<p class="error" role="alert">{form.error}</p>
			{/if}

			<button type="submit" disabled={!data.profilePersistenceEnabled}>내 코치 시작하기</button>
		</form>
	</section>
</main>

<style>
	.onboarding-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 32px 16px;
		background:
			linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0 38%, transparent 38%),
			linear-gradient(135deg, #eef6f3 0%, #f8fbff 47%, #fff4ec 100%);
		color: #1f2428;
	}

	.onboarding-panel {
		width: min(100%, 620px);
		padding: clamp(24px, 5vw, 38px);
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 24px 70px rgba(33, 50, 56, 0.14);
		backdrop-filter: blur(18px);
	}

	header {
		display: grid;
		gap: 9px;
		margin-bottom: 24px;
		text-align: center;
	}

	header p,
	header h1 {
		margin: 0;
	}

	header p {
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
	}

	header h1 {
		font-size: clamp(2rem, 7vw, 2.7rem);
		font-weight: 950;
		line-height: 1.08;
		text-wrap: balance;
		word-break: keep-all;
	}

	header span {
		color: #66737a;
		font-size: 0.9rem;
		font-weight: 800;
		overflow-wrap: anywhere;
	}

	form,
	.form-section,
	label {
		display: grid;
		gap: 12px;
	}

	form {
		gap: 18px;
	}

	.form-section {
		padding: 16px;
		border-radius: 8px;
		background: rgba(248, 251, 255, 0.82);
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	.section-title {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 12px;
	}

	h2 {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 950;
	}

	.section-title small {
		color: #66737a;
		font-size: 0.78rem;
		font-weight: 800;
		text-align: right;
	}

	label > span {
		font-size: 0.9rem;
		font-weight: 850;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #1f2428;
		font: inherit;
	}

	input,
	select {
		min-height: 46px;
		padding: 0 12px;
	}

	.two-column {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	textarea {
		min-height: 104px;
		padding: 12px;
		resize: vertical;
		line-height: 1.55;
	}

	input:focus,
	select:focus,
	textarea:focus {
		outline: 3px solid rgba(31, 139, 124, 0.18);
		border-color: #1f8b7c;
	}

	fieldset {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
		font-size: 0.9rem;
		font-weight: 850;
	}

	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.chip-checkbox {
		position: relative;
		display: block;
	}

	.chip-checkbox input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.chip-checkbox span {
		min-height: 42px;
		display: grid;
		place-items: center;
		padding: 0 10px;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #4d5a60;
		font-size: 0.86rem;
		font-weight: 850;
		text-align: center;
	}

	.chip-checkbox input:checked + span {
		border-color: rgba(31, 139, 124, 0.5);
		background: #eef8f5;
		color: #187064;
	}

	.chip-checkbox input:focus-visible + span {
		outline: 3px solid rgba(31, 139, 124, 0.18);
	}

	.agreement-card {
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		gap: 12px;
		padding: 14px;
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.78);
	}

	.agreement-card input {
		width: 18px;
		min-height: 18px;
		margin-top: 2px;
	}

	.agreement-card span {
		display: grid;
		gap: 5px;
	}

	.agreement-card strong {
		font-size: 0.94rem;
		font-weight: 950;
	}

	.agreement-card small {
		color: #5f6970;
		font-size: 0.84rem;
		font-weight: 500;
		line-height: 1.55;
		word-break: keep-all;
	}

	button {
		min-height: 52px;
		border: 0;
		border-radius: 8px;
		background: #1f8b7c;
		color: white;
		font: inherit;
		font-weight: 950;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #176f65;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.62;
	}

	.error {
		margin: 0;
		padding: 12px 13px;
		border-radius: 8px;
		background: #fff0ee;
		color: #a2362e;
		font-weight: 800;
		line-height: 1.5;
	}

	@media (max-width: 560px) {
		.section-title,
		.two-column {
			align-items: start;
			grid-template-columns: 1fr;
		}

		.section-title {
			flex-direction: column;
		}

		.section-title small {
			text-align: left;
		}

		.checkbox-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
