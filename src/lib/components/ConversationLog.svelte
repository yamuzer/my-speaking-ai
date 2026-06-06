<script>
	let { conversation, assistantDraft } = $props();
</script>

{#if conversation.length || assistantDraft}
	<div class="conversation" aria-label="대화 기록">
		{#each conversation as item, index (`${item.role}-${index}`)}
			<p class={item.role}>
				<span>{item.role === 'user' ? 'You' : 'Coach'}</span>
				{item.text}
			</p>
		{/each}

		{#if assistantDraft}
			<p class="assistant draft">
				<span>Coach</span>
				{assistantDraft}
			</p>
		{/if}
	</div>
{/if}

<style>
	.conversation {
		margin-top: 26px;
		display: grid;
		gap: 10px;
		padding-top: 24px;
		border-top: 1px solid rgba(34, 31, 28, 0.1);
	}

	.conversation p {
		margin: 0;
		padding: 14px 16px;
		border-radius: 8px;
		color: #282521;
		line-height: 1.62;
		box-shadow: inset 0 0 0 1px rgba(34, 31, 28, 0.04);
	}

	.conversation span {
		display: block;
		margin-bottom: 4px;
		font-size: 0.76rem;
		font-weight: 950;
		text-transform: uppercase;
	}

	.user {
		background: #edf5ef;
	}

	.assistant {
		background: #fff0ec;
	}

	.draft {
		opacity: 0.72;
	}
</style>
