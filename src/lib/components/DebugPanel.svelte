<script>
	let { entries, onClear } = $props();
</script>

<details class="debug-panel">
	<summary>
		<span>API Debug</span>
		<button type="button" onclick={onClear}>로그 지우기</button>
	</summary>

	{#if entries.length}
		<ol>
			{#each entries as entry (entry.id)}
				<li class={entry.level}>
					<time>{entry.time}</time>
					<strong>{entry.step}</strong>
					<p>{entry.message}</p>
					{#if entry.detail}
						<pre>{entry.detail}</pre>
					{/if}
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty">아직 API 통신 로그가 없습니다.</p>
	{/if}
</details>

<style>
	.debug-panel {
		margin-top: 24px;
		border-top: 1px solid rgba(35, 65, 70, 0.1);
		padding-top: 18px;
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		cursor: pointer;
		color: #1f2428;
		font-weight: 920;
	}

	summary::marker {
		color: #1f8b7c;
	}

	summary button {
		min-height: 34px;
		padding: 0 12px;
		border-radius: 8px;
		border: 1px solid rgba(35, 65, 70, 0.12);
		background: #f4fbf8;
		color: #4d5a60;
		font-size: 0.82rem;
		font-weight: 850;
		cursor: pointer;
	}

	ol {
		max-height: 280px;
		overflow: auto;
		display: grid;
		gap: 10px;
		margin: 14px 0 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 12px;
		border-radius: 8px;
		background: #f8fbff;
		border-left: 4px solid #9aaeb1;
	}

	li.success {
		border-left-color: #1f8b7c;
	}

	li.error {
		border-left-color: #a2362e;
	}

	li.event {
		border-left-color: #d39c24;
	}

	time {
		display: block;
		color: #66737a;
		font-size: 0.76rem;
		font-weight: 800;
	}

	strong {
		display: block;
		margin-top: 4px;
	}

	p {
		margin: 4px 0 0;
		color: #5f6970;
		line-height: 1.5;
	}

	pre {
		margin: 10px 0 0;
		padding: 10px;
		overflow: auto;
		border-radius: 8px;
		background: #232722;
		color: #f5f7f2;
		font-size: 0.78rem;
		white-space: pre-wrap;
	}

	.empty {
		margin: 12px 0 0;
		color: #66737a;
	}
</style>
