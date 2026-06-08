<script>
	import { untrack } from 'svelte';

	let { profile, profileForm, user } = $props();

	const labelMaps = {
		ageRange: {
			teen: '10대',
			'20s': '20대',
			'30s': '30대',
			'40s': '40대',
			'50s_plus': '50대 이상'
		},
		englishLevel: {
			beginner: '초급',
			intermediate: '중급',
			advanced: '고급'
		},
		learningPurpose: {
			daily: '일상 회화',
			business: '비즈니스/업무',
			interview: '면접 준비',
			travel: '여행',
			exam: '시험/자격증',
			academic: '유학/학업',
			other: '기타'
		},
		practiceFrequency: {
			daily: '매일',
			weekly_3: '주 3회 이상',
			weekly_1: '주 1회 정도',
			occasional: '필요할 때만'
		},
		interestSituations: {
			daily_chat: '일상 대화',
			meeting: '회의/업무',
			presentation: '발표',
			interview: '면접',
			travel: '여행',
			small_talk: '스몰토크'
		}
	};

	const formatLabel = (group, value) => labelMaps[group]?.[value] ?? value ?? '-';
	const formatDateTime = (value) =>
		value
			? new Intl.DateTimeFormat('ko-KR', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				}).format(new Date(value))
			: '-';
	const optionEntries = (group) => Object.entries(labelMaps[group]);

	let isEditing = $state(
		untrack(() => profileForm?.formName === 'profile' && Boolean(profileForm?.error))
	);
	let displayName = $state(
		untrack(() => profileForm?.displayName ?? profile?.displayName ?? user?.name ?? '')
	);
	let ageRange = $state(untrack(() => profileForm?.ageRange ?? profile?.ageRange ?? ''));
	let occupation = $state(untrack(() => profileForm?.occupation ?? profile?.occupation ?? ''));
	let englishLevel = $state(
		untrack(() => profileForm?.englishLevel ?? profile?.englishLevel ?? '')
	);
	let learningPurpose = $state(
		untrack(() => profileForm?.learningPurpose ?? profile?.learningPurpose ?? '')
	);
	let learningGoal = $state(untrack(() => profileForm?.learningGoal ?? profile?.learningGoal ?? ''));
	let practiceFrequency = $state(
		untrack(() => profileForm?.practiceFrequency ?? profile?.practiceFrequency ?? '')
	);
	let editableInterestSituations = $state(
		untrack(() => profileForm?.interestSituations ?? profile?.interestSituations ?? [])
	);

	let interestSituations = $derived(
		Array.isArray(profile?.interestSituations) ? profile.interestSituations : []
	);
	let isProfileFormResult = $derived(profileForm?.formName === 'profile');
	let profileRows = $derived([
		['이름 또는 닉네임', profile?.displayName],
		['이메일', user?.email],
		['연령대', formatLabel('ageRange', profile?.ageRange)],
		['직업 또는 역할', profile?.occupation],
		['영어 수준', formatLabel('englishLevel', profile?.englishLevel)],
		['주요 학습 목적', formatLabel('learningPurpose', profile?.learningPurpose)],
		['희망 연습 빈도', formatLabel('practiceFrequency', profile?.practiceFrequency)]
	]);
</script>

<section class="profile-panel" aria-labelledby="profile-title">
	<header>
		<div>
			<p>Profile</p>
			<h2 id="profile-title">사용자 정보</h2>
		</div>
		{#if isEditing}
			<span>수정 중</span>
		{:else}
			<button class="header-action" type="button" onclick={() => (isEditing = true)}>수정</button>
		{/if}
	</header>

	{#if isProfileFormResult && profileForm?.success}
		<p class="success" role="status">{profileForm.success}</p>
	{/if}

	{#if isProfileFormResult && profileForm?.error}
		<p class="error" role="alert">{profileForm.error}</p>
	{/if}

	{#if isEditing}
		<form class="edit-form" method="POST" action="?/profile">
			<section class="detail-section" aria-labelledby="edit-basic-title">
				<div class="section-title">
					<h3 id="edit-basic-title">기본 프로필</h3>
					<span>편집</span>
				</div>

				<label>
					<span>이름 또는 닉네임 *</span>
					<input name="displayName" maxlength="40" bind:value={displayName} required />
				</label>

				<div class="two-column">
					<label>
						<span>연령대 *</span>
						<select name="ageRange" bind:value={ageRange} required>
							<option value="" disabled>선택해 주세요</option>
							{#each optionEntries('ageRange') as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>직업 또는 역할 *</span>
						<input name="occupation" maxlength="80" bind:value={occupation} required />
					</label>
				</div>

				<label>
					<span>영어 수준 *</span>
					<select name="englishLevel" bind:value={englishLevel} required>
						<option value="" disabled>선택해 주세요</option>
						{#each optionEntries('englishLevel') as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</label>
			</section>

			<section class="detail-section" aria-labelledby="edit-learning-title">
				<div class="section-title">
					<h3 id="edit-learning-title">학습 맥락</h3>
					<span>맞춤</span>
				</div>

				<div class="two-column">
					<label>
						<span>주요 학습 목적 *</span>
						<select name="learningPurpose" bind:value={learningPurpose} required>
							<option value="" disabled>선택해 주세요</option>
							{#each optionEntries('learningPurpose') as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>희망 연습 빈도 *</span>
						<select name="practiceFrequency" bind:value={practiceFrequency} required>
							<option value="" disabled>선택해 주세요</option>
							{#each optionEntries('practiceFrequency') as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</label>
				</div>

				<fieldset>
					<legend>관심 연습 상황</legend>
					<div class="checkbox-grid">
						{#each optionEntries('interestSituations') as [value, label] (value)}
							<label class="chip-checkbox">
								<input
									name="interestSituations"
									type="checkbox"
									{value}
									bind:group={editableInterestSituations}
								/>
								<span>{label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<label>
					<span>구체적인 학습 목표 *</span>
					<textarea name="learningGoal" maxlength="300" bind:value={learningGoal} required></textarea>
				</label>
			</section>

			<div class="form-actions">
				<button class="save-button" type="submit">저장하기</button>
				<button class="cancel-button" type="button" onclick={() => (isEditing = false)}>취소</button>
			</div>
		</form>
	{:else}
		<div class="profile-summary">
			<strong>{profile?.displayName ?? '이름 없음'}</strong>
			<p>{profile?.learningGoal ?? '학습 목표가 아직 저장되지 않았습니다.'}</p>
		</div>

		<dl class="info-grid">
			{#each profileRows as [label, value] (label)}
				<div>
					<dt>{label}</dt>
					<dd>{value || '-'}</dd>
				</div>
			{/each}
		</dl>

		<section class="detail-section" aria-labelledby="situations-title">
			<div class="section-title">
				<h3 id="situations-title">관심 연습 상황</h3>
				<span>{interestSituations.length}개</span>
			</div>

			{#if interestSituations.length}
				<div class="chip-list">
					{#each interestSituations as situation (situation)}
						<span>{formatLabel('interestSituations', situation)}</span>
					{/each}
				</div>
			{:else}
				<p class="empty">선택한 관심 상황이 없습니다.</p>
			{/if}
		</section>
	{/if}

	<section class="detail-section" aria-labelledby="consent-title">
		<div class="section-title">
			<h3 id="consent-title">동의 기록</h3>
			<span>완료</span>
		</div>

		<dl class="consent-list">
			<div>
				<dt>개인정보 처리방침</dt>
				<dd>
					{formatDateTime(profile?.privacyPolicyAgreedAt)}
					<small>버전 {profile?.privacyPolicyVersion ?? '-'}</small>
				</dd>
			</div>
			<div>
				<dt>서비스 이용약관</dt>
				<dd>
					{formatDateTime(profile?.termsAgreedAt)}
					<small>버전 {profile?.termsVersion ?? '-'}</small>
				</dd>
			</div>
		</dl>
	</section>
</section>

<style>
	.profile-panel {
		display: grid;
		gap: 18px;
	}

	header,
	.section-title {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 16px;
	}

	header p,
	header h2,
	h3,
	dl,
	.profile-summary p,
	.empty {
		margin: 0;
	}

	header p {
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
	}

	header h2 {
		margin-top: 7px;
		color: #1f2428;
		font-size: clamp(1.7rem, 6vw, 2.55rem);
		font-weight: 950;
		line-height: 1.08;
		word-break: keep-all;
	}

	header > span,
	.section-title span {
		min-height: 30px;
		display: inline-grid;
		place-items: center;
		padding: 0 10px;
		border-radius: 999px;
		background: #e6f6f1;
		color: #187064;
		font-size: 0.78rem;
		font-weight: 900;
		white-space: nowrap;
	}

	.header-action,
	.save-button {
		min-height: 40px;
		padding: 0 15px;
		border: 0;
		border-radius: 8px;
		background: #1f8b7c;
		color: white;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
	}

	.header-action:hover,
	.save-button:hover {
		background: #176f65;
	}

	.profile-summary,
	.info-grid,
	.detail-section {
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.76);
		box-shadow: 0 14px 32px rgba(33, 50, 56, 0.07);
	}

	.profile-summary {
		display: grid;
		gap: 8px;
		padding: 18px;
	}

	.profile-summary strong {
		font-size: 1.28rem;
		font-weight: 950;
	}

	.profile-summary p,
	.empty {
		color: #5f6970;
		line-height: 1.58;
		word-break: keep-all;
	}

	.success,
	.error {
		margin: 0;
		padding: 12px 13px;
		border-radius: 8px;
		font-weight: 800;
		line-height: 1.5;
	}

	.success {
		background: #eef8f1;
		color: #24724d;
	}

	.error {
		background: #fff0ee;
		color: #a2362e;
	}

	.edit-form {
		display: grid;
		gap: 14px;
	}

	label,
	fieldset {
		display: grid;
		gap: 8px;
	}

	label > span,
	legend {
		color: #1f2428;
		font-size: 0.9rem;
		font-weight: 900;
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
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
		min-height: 44px;
		padding: 0 12px;
	}

	textarea {
		min-height: 108px;
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

	.two-column {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
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
		min-height: 40px;
		display: grid;
		place-items: center;
		padding: 0 10px;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #4d5a60;
		font-size: 0.84rem;
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

	.form-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
	}

	.cancel-button {
		min-height: 40px;
		padding: 0 15px;
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.72);
		color: #4d5a60;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		overflow: hidden;
	}

	.info-grid div {
		display: grid;
		gap: 6px;
		padding: 15px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.08);
	}

	.info-grid div:nth-child(odd) {
		border-right: 1px solid rgba(35, 65, 70, 0.08);
	}

	dt {
		color: #66737a;
		font-size: 0.78rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		color: #1f2428;
		font-weight: 900;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.detail-section {
		display: grid;
		gap: 14px;
		padding: 18px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 950;
	}

	.chip-list {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.chip-list span {
		min-height: 32px;
		display: inline-grid;
		place-items: center;
		padding: 0 11px;
		border-radius: 999px;
		background: #edf5f3;
		color: #187064;
		font-size: 0.82rem;
		font-weight: 900;
	}

	.consent-list {
		display: grid;
		gap: 10px;
	}

	.consent-list div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.09);
	}

	.consent-list div:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}

	.consent-list dd {
		display: grid;
		gap: 3px;
		text-align: right;
	}

	.consent-list small {
		color: #66737a;
		font-size: 0.78rem;
	}

	@media (max-width: 560px) {
		header,
		.section-title {
			align-items: start;
			flex-direction: column;
		}

		.two-column,
		.form-actions {
			grid-template-columns: 1fr;
		}

		.checkbox-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.info-grid div:nth-child(odd) {
			border-right: 0;
		}

		.consent-list div {
			align-items: start;
			flex-direction: column;
		}

		.consent-list dd {
			text-align: left;
		}
	}
</style>
