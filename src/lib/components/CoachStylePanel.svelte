<script>
	let { styles, selectedStyleId, disabled, onSelect, onSave } = $props();

	let isCreating = $state(false);
	let name = $state('');
	let description = $state('');
	let instructions = $state('');
	let favorite = $state(false);
	let errorMessage = $state('');

	let selectedStyle = $derived(styles.find((style) => style.id === selectedStyleId));

	const resetForm = () => {
		name = '';
		description = '';
		instructions = '';
		favorite = false;
		errorMessage = '';
	};

	const closeForm = () => {
		isCreating = false;
		resetForm();
	};

	const saveStyle = () => {
		const trimmedName = name.trim();
		const trimmedDescription = description.trim();
		const trimmedInstructions = instructions.trim();

		if (!trimmedName || !trimmedDescription || !trimmedInstructions) {
			errorMessage = '이름, 설명, 프롬프트 내용을 모두 입력해 주세요.';
			return;
		}

		onSave?.({
			name: trimmedName,
			description: trimmedDescription,
			instructions: trimmedInstructions,
			favorite
		});
		closeForm();
	};
</script>

<section class="style-panel" aria-labelledby="style-title">
	<header>
		<div>
			<p>Coach Style</p>
			<h2 id="style-title">AI 코치 스타일</h2>
		</div>
		<span>{selectedStyle?.name ?? '선택 없음'}</span>
	</header>

	<div class="toolbar">
		<div class="search-box" aria-hidden="true">
			<svg viewBox="0 0 24 24">
				<circle cx="11" cy="11" r="7"></circle>
				<path d="m16.5 16.5 4 4"></path>
			</svg>
			<span>스타일 검색</span>
		</div>
		<button class="new-button" type="button" disabled={disabled} onclick={() => (isCreating = true)}>
			새 스타일
		</button>
	</div>

	{#if isCreating}
		<section class="create-form" aria-label="새 AI 코치 스타일 만들기">
			<h3>새 스타일 만들기</h3>

			<label>
				<span>이름 *</span>
				<input
					bind:value={name}
					disabled={disabled}
					maxlength="40"
					placeholder="스타일 이름을 입력하세요"
				/>
			</label>

			<label>
				<span>설명 *</span>
				<input
					bind:value={description}
					disabled={disabled}
					maxlength="90"
					placeholder="스타일에 대한 간단한 설명"
				/>
			</label>

			<label>
				<span>프롬프트 내용 *</span>
				<small>{instructions.length}/2000자</small>
				<textarea
					bind:value={instructions}
					disabled={disabled}
					maxlength="2000"
					placeholder="AI 코치의 성격과 교육 방식을 자세히 설명해 주세요."
				></textarea>
			</label>

			<label class="favorite-row">
				<input type="checkbox" bind:checked={favorite} disabled={disabled} />
				<span>즐겨찾기에 추가</span>
			</label>

			{#if errorMessage}
				<p class="form-error">{errorMessage}</p>
			{/if}

			<div class="form-actions">
				<button class="save-button" type="button" disabled={disabled} onclick={saveStyle}>저장하기</button>
				<button class="cancel-button" type="button" onclick={closeForm}>취소</button>
			</div>
		</section>
	{/if}

	<div class="style-list">
		{#each styles as style (style.id)}
			<article class:selected={style.id === selectedStyleId} class="style-card">
				<div class="card-head">
					<div>
						<strong>{style.name}</strong>
						<span>{style.badge}</span>
					</div>
					{#if style.favorite}
						<small>즐겨찾기</small>
					{/if}
				</div>

				<p>{style.description}</p>
				<div class="prompt-preview">{style.instructions}</div>

				<button type="button" disabled={disabled} onclick={() => onSelect?.(style.id)}>
					{style.id === selectedStyleId ? '선택됨' : '이 스타일 사용하기'}
				</button>
			</article>
		{/each}
	</div>

	<p class="hint">
		{#if disabled}
			진행 중인 대화에는 현재 스타일이 유지됩니다.
		{:else}
			선택한 스타일은 다음 대화 세션부터 적용됩니다.
		{/if}
	</p>
</section>

<style>
	.style-panel {
		display: grid;
		gap: 16px;
		padding: 18px;
		border-radius: 8px;
		background: linear-gradient(180deg, rgba(248, 251, 255, 0.86), rgba(241, 249, 247, 0.76));
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 16px;
	}

	header p,
	header h2,
	h3 {
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
		margin-top: 6px;
		color: #1f2428;
		font-size: 1.08rem;
		font-weight: 900;
		line-height: 1.2;
	}

	header > span {
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

	.toolbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
	}

	.search-box {
		min-height: 44px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 12px;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.72);
		color: #66737a;
		font-weight: 800;
	}

	.search-box svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}

	button,
	input,
	textarea {
		font: inherit;
	}

	button {
		border-radius: 8px;
		border: 0;
		font-weight: 900;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.66;
	}

	.new-button,
	.save-button {
		min-height: 44px;
		padding: 0 15px;
		background: #1f8b7c;
		color: white;
	}

	.create-form {
		display: grid;
		gap: 14px;
		padding: 16px;
		border-radius: 8px;
		background: rgba(230, 246, 241, 0.8);
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.14);
	}

	h3 {
		font-size: 1rem;
		font-weight: 900;
	}

	label {
		display: grid;
		gap: 8px;
	}

	label > span {
		font-size: 0.9rem;
		font-weight: 900;
	}

	label small {
		justify-self: end;
		margin-top: -26px;
		color: #66737a;
		font-size: 0.82rem;
		font-weight: 800;
	}

	input:not([type='checkbox']),
	textarea {
		width: 100%;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #1f2428;
	}

	input:not([type='checkbox']) {
		min-height: 44px;
		padding: 0 12px;
	}

	textarea {
		min-height: 128px;
		resize: vertical;
		padding: 12px;
		line-height: 1.55;
	}

	input:focus,
	textarea:focus {
		outline: 3px solid rgba(31, 139, 124, 0.18);
		border-color: #1f8b7c;
	}

	.favorite-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.favorite-row input {
		width: 16px;
		height: 16px;
	}

	.form-error {
		margin: 0;
		padding: 10px 12px;
		border-radius: 8px;
		background: #fff0ee;
		color: #a2362e;
		font-weight: 800;
	}

	.form-actions {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
	}

	.cancel-button {
		min-height: 44px;
		padding: 0 15px;
		border: 1px solid rgba(35, 65, 70, 0.12);
		background: rgba(255, 255, 255, 0.72);
		color: #4d5a60;
	}

	.style-list {
		max-height: 480px;
		overflow: auto;
		display: grid;
		gap: 12px;
	}

	.style-card {
		display: grid;
		gap: 10px;
		padding: 15px;
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 10px 24px rgba(33, 50, 56, 0.06);
	}

	.style-card.selected {
		border-color: rgba(31, 139, 124, 0.42);
		background: #f8fdfb;
	}

	.card-head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 12px;
	}

	.card-head div {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.card-head strong {
		font-size: 0.98rem;
		font-weight: 900;
		line-height: 1.25;
	}

	.card-head span,
	.card-head small {
		padding: 4px 8px;
		border-radius: 999px;
		background: #edf5f3;
		color: #187064;
		font-size: 0.74rem;
		font-weight: 900;
		white-space: nowrap;
	}

	.style-card p {
		margin: 0;
		color: #5f6970;
		font-size: 0.9rem;
		line-height: 1.5;
		word-break: keep-all;
	}

	.prompt-preview {
		max-height: 92px;
		overflow: auto;
		padding: 10px;
		border-radius: 8px;
		background: rgba(237, 245, 243, 0.72);
		color: #4d5a60;
		font-size: 0.84rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.style-card > button {
		min-height: 42px;
		background: #dce9e7;
		color: #4d5a60;
	}

	.style-card.selected > button,
	.style-card > button:hover:not(:disabled) {
		background: #1f8b7c;
		color: white;
	}

	.hint {
		margin: 0;
		color: #66737a;
		font-size: 0.84rem;
		line-height: 1.5;
		word-break: keep-all;
	}

	@media (max-width: 560px) {
		.toolbar,
		.form-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
