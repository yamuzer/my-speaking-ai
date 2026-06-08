<script>
	import CoachStyleCard from './CoachStyleCard.svelte';
	import CoachStyleForm from './CoachStyleForm.svelte';

	let { styles, selectedStyleId, disabled, onSelect, onSave, saveMessage = '' } = $props();

	let isCreating = $state(false);
	let editingStyle = $state();

	let selectedStyle = $derived(styles.find((style) => style.id === selectedStyleId));
	let defaultStyles = $derived(styles.filter((style) => !style.custom));
	let customStyles = $derived(styles.filter((style) => style.custom));
	let formKey = $derived(editingStyle?.id ?? 'new-style');

	const closeForm = () => {
		isCreating = false;
		editingStyle = undefined;
	};

	const openCreateForm = () => {
		editingStyle = undefined;
		isCreating = true;
	};

	const openEditForm = (style) => {
		editingStyle = style;
		isCreating = true;
	};

	const saveStyle = async (style) => {
		await onSave?.(style);
		closeForm();
	};
</script>

<section class="style-panel" aria-labelledby="style-title">
	<header>
		<div>
			<p>Coach Style</p>
			<h2 id="style-title">AI 코치 스타일</h2>
		</div>
		<span>{selectedStyle ? `${selectedStyle.icon ?? '🎙️'} ${selectedStyle.name}` : '선택 없음'}</span>
	</header>

	<div class="toolbar">
		<div class="search-box" aria-hidden="true">
			<svg viewBox="0 0 24 24">
				<circle cx="11" cy="11" r="7"></circle>
				<path d="m16.5 16.5 4 4"></path>
			</svg>
			<span>스타일 검색</span>
		</div>
		<button class="new-button" type="button" disabled={disabled} onclick={openCreateForm}>
			새 스타일
		</button>
	</div>

	{#if isCreating}
		{#key formKey}
			<CoachStyleForm
				{disabled}
				initialStyle={editingStyle}
				onCancel={closeForm}
				onSave={saveStyle}
			/>
		{/key}
	{/if}

	{#if saveMessage}
		<p class="save-message">{saveMessage}</p>
	{/if}

	<section class="default-style-section" aria-label="기본 AI 코치 스타일">
		<div class="section-title">
			<h3>기본 스타일</h3>
			<span>2x2</span>
		</div>

		<div class="default-style-grid">
			{#each defaultStyles as style (style.id)}
				<CoachStyleCard
					{disabled}
					{style}
					selected={style.id === selectedStyleId}
					variant="default"
					onSelect={onSelect}
				/>
			{/each}
		</div>
	</section>

	{#if customStyles.length}
		<section class="custom-style-section" aria-label="직접 만든 AI 코치 스타일">
			<div class="section-title">
				<h3>직접 만든 스타일</h3>
				<span>{customStyles.length}개</span>
			</div>

			<div class="style-list">
				{#each customStyles as style (style.id)}
					<CoachStyleCard
						{disabled}
						{style}
						selected={style.id === selectedStyleId}
						onEdit={openEditForm}
						onSelect={onSelect}
					/>
				{/each}
			</div>
		</section>
	{/if}

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

	button {
		min-height: 44px;
		padding: 0 15px;
		border: 0;
		border-radius: 8px;
		background: #1f8b7c;
		color: white;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.66;
	}

	h3 {
		font-size: 1rem;
		font-weight: 900;
	}

	.section-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.section-title span {
		padding: 4px 8px;
		border-radius: 999px;
		background: #edf5f3;
		color: #187064;
		font-size: 0.74rem;
		font-weight: 900;
		white-space: nowrap;
	}

	.save-message {
		margin: 0;
		padding: 10px 12px;
		border-radius: 8px;
		background: #eef8f5;
		color: #187064;
		font-size: 0.86rem;
		font-weight: 800;
		line-height: 1.45;
	}

	.default-style-section,
	.custom-style-section {
		display: grid;
		gap: 12px;
	}

	.default-style-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.style-list {
		max-height: 480px;
		overflow: auto;
		display: grid;
		gap: 12px;
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
		.default-style-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
