<script>
	import { untrack } from 'svelte';

	let { disabled, initialStyle, onCancel, onSave } = $props();

	let name = $state(untrack(() => initialStyle?.name ?? ''));
	let description = $state(untrack(() => initialStyle?.description ?? ''));
	let instructions = $state(untrack(() => initialStyle?.instructions ?? ''));
	let favorite = $state(untrack(() => Boolean(initialStyle?.favorite)));
	let errorMessage = $state('');

	let isEditing = $derived(Boolean(initialStyle?.id));

	const saveStyle = async () => {
		const trimmedName = name.trim();
		const trimmedDescription = description.trim();
		const trimmedInstructions = instructions.trim();

		if (!trimmedName || !trimmedDescription || !trimmedInstructions) {
			errorMessage = '이름, 설명, 프롬프트 내용을 모두 입력해 주세요.';
			return;
		}

		await onSave?.({
			id: initialStyle?.id,
			name: trimmedName,
			description: trimmedDescription,
			instructions: trimmedInstructions,
			favorite
		});
	};
</script>

<section class="create-form" aria-label="새 AI 코치 스타일 만들기">
	<h3>{isEditing ? '프롬프트 스타일 수정' : '프롬프트 스타일 저장'}</h3>

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
		<button class="save-button" type="button" disabled={disabled} onclick={saveStyle}>
			{isEditing ? '수정 완료' : '저장하기'}
		</button>
		<button class="cancel-button" type="button" onclick={onCancel}>취소</button>
	</div>
</section>

<style>
	.create-form {
		display: grid;
		gap: 14px;
		padding: 16px;
		border-radius: 8px;
		background: rgba(230, 246, 241, 0.8);
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.14);
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 900;
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

	.save-button {
		min-height: 44px;
		padding: 0 15px;
		background: #1f8b7c;
		color: white;
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

	@media (max-width: 560px) {
		.form-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
