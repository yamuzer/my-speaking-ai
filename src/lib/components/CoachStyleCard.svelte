<script>
	let { disabled, onEdit, onSelect, selected = false, style, variant = 'custom' } = $props();

	let isDefault = $derived(variant === 'default');
</script>

<article class:selected class:default-card={isDefault} class="style-card">
	{#if isDefault}
		<div class="default-card-head">
			<span class="style-icon" aria-hidden="true">{style.icon ?? '🎙️'}</span>
			<div>
				<strong>{style.name}</strong>
				<small>{style.badge}</small>
			</div>
		</div>

		<p>{style.description}</p>

		<button type="button" disabled={disabled} onclick={() => onSelect?.(style.id)}>
			{selected ? '선택됨' : '선택하기'}
		</button>
	{:else}
		<div class="card-head">
			<div>
				<span class="custom-icon" aria-hidden="true">{style.icon ?? '✨'}</span>
				<strong>{style.name}</strong>
				<span>{style.badge}</span>
			</div>
			{#if style.favorite}
				<small>즐겨찾기</small>
			{/if}
		</div>

		<p>{style.description}</p>
		<div class="prompt-preview">{style.instructions}</div>

		<div class="card-actions">
			<button type="button" disabled={disabled} onclick={() => onSelect?.(style.id)}>
				{selected ? '선택됨' : '이 스타일 사용하기'}
			</button>
			<button class="edit-button" type="button" disabled={disabled} onclick={() => onEdit?.(style)}>
				수정
			</button>
		</div>
	{/if}
</article>

<style>
	.style-card {
		display: grid;
		gap: 10px;
		padding: 15px;
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 10px 24px rgba(33, 50, 56, 0.06);
	}

	.default-card {
		min-height: 184px;
		grid-template-rows: auto 1fr auto;
	}

	.style-card.selected {
		border-color: rgba(31, 139, 124, 0.42);
		background: #f8fdfb;
	}

	.default-card.selected {
		box-shadow:
			0 12px 28px rgba(31, 139, 124, 0.14),
			inset 0 0 0 1px rgba(31, 139, 124, 0.22);
	}

	.default-card-head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 10px;
	}

	.style-icon {
		width: 44px;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: #eef8f5;
		font-size: 1.45rem;
		line-height: 1;
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.12);
	}

	.default-card-head div {
		min-width: 0;
		display: grid;
		gap: 6px;
	}

	.default-card-head strong,
	.card-head strong {
		font-size: 0.98rem;
		font-weight: 900;
		line-height: 1.25;
	}

	.default-card-head strong {
		word-break: keep-all;
	}

	.default-card-head small {
		width: fit-content;
		padding: 4px 8px;
		border-radius: 999px;
		background: #edf5f3;
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1;
		white-space: nowrap;
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

	.custom-icon {
		font-size: 1.1rem;
		line-height: 1;
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

	button {
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.66;
	}

	.style-card > button,
	.card-actions button {
		min-height: 42px;
		background: #dce9e7;
		color: #4d5a60;
	}

	.style-card.selected > button,
	.style-card > button:hover:not(:disabled),
	.card-actions button:hover:not(:disabled) {
		background: #1f8b7c;
		color: white;
	}

	.card-actions {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 8px;
	}

	.card-actions .edit-button {
		min-width: 72px;
		border: 1px solid rgba(35, 65, 70, 0.12);
		background: rgba(255, 255, 255, 0.72);
	}
</style>
