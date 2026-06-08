<script>
	let { sessions, activeSessionId, recordingSessionId, assistantDraft, onSelect } = $props();

	let activeSession = $derived(
		sessions.find((session) => session.id === activeSessionId) ?? sessions[0]
	);
	let activeMessages = $derived(activeSession?.messages ?? []);
	let showAssistantDraft = $derived(Boolean(assistantDraft && activeSession?.id === recordingSessionId));
	let visibleMessageCount = $derived(activeMessages.length + (showAssistantDraft ? 1 : 0));

	const statusLabels = {
		preparing: '준비 중',
		active: '대화 중',
		ended: '종료됨',
		failed: '실패'
	};

	const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Number(value ?? 0));
	const estimateTextTokens = (text) =>
		Math.max(1, Math.ceil(String(text ?? '').trim().length / 4));

	const getUsageRows = (item) => {
		const usage = item.usage ?? {};
		const estimatedTokens = estimateTextTokens(item.text);
		const hasUsage = Boolean(item.usage);
		const rows = [];

		if (item.role === 'user') {
			rows.push({
				label: '입력',
				model: item.model ?? 'gpt-realtime-2',
				tokens: usage.inputTokens ?? usage.totalTokens ?? estimatedTokens,
				detail: usage.inputAudioTokens
					? `audio ${formatNumber(usage.inputAudioTokens)}`
					: usage.inputTextTokens
						? `text ${formatNumber(usage.inputTextTokens)}`
						: usage.source === 'estimated' || !hasUsage
							? '추정'
							: ''
			});

			if (item.transcriptionModel) {
				rows.push({
					label: '전사',
					model: item.transcriptionModel,
					tokens: 0,
					detail: '모델 사용'
				});
			}

			return rows;
		}

		rows.push({
			label: '출력',
			model: item.model ?? 'gpt-realtime-2',
			tokens: usage.outputTokens ?? usage.totalTokens ?? estimatedTokens,
			detail: usage.outputAudioTokens
				? `audio ${formatNumber(usage.outputAudioTokens)}`
				: usage.outputTextTokens
					? `text ${formatNumber(usage.outputTextTokens)}`
					: usage.source === 'estimated' || !hasUsage
						? '추정'
						: ''
		});

		return rows;
	};
</script>

<section class="conversation" aria-label="대화 기록">
	<header>
		<div>
			<p>Conversation</p>
			<h2>대화 기록</h2>
		</div>
		<span>{sessions.length}개 세션</span>
	</header>

	<div class="history-layout">
		<aside class="session-list" aria-label="대화 세션 목록">
			{#if sessions.length}
				{#each sessions as session (session.id)}
					<button
						class:active={session.id === activeSession?.id}
						type="button"
						onclick={() => onSelect?.(session.id)}
					>
						<strong>{session.title}</strong>
						<time>{session.dateLabel} · {session.timeLabel}</time>
						<span>스타일: {session.coachStyle?.name ?? '기본'}</span>
						<span>{session.messages.length}개 메시지</span>
						<small class={session.status}>{statusLabels[session.status] ?? '기록됨'}</small>
					</button>
				{/each}
			{:else}
				<div class="empty-session">
					<strong>세션 없음</strong>
					<p>대화를 시작하면 새 기록이 만들어집니다.</p>
				</div>
			{/if}
		</aside>

		<div class="chat-panel">
			<div class="chat-heading">
				<div>
					<strong>{activeSession?.title ?? '새 대화 기록'}</strong>
					<p>
						{#if activeSession}
							{activeSession.dateLabel} · {activeSession.timeLabel}
						{:else}
							아직 선택된 세션이 없습니다.
						{/if}
					</p>
				</div>
				<span>{visibleMessageCount}개</span>
			</div>

			{#if activeSession?.coachStyle}
				<div class="style-summary">
					<strong>AI 코치 스타일</strong>
					<p>
						{activeSession.coachStyle.name}
						{#if activeSession.coachStyle.badge}
							<span>{activeSession.coachStyle.badge}</span>
						{/if}
					</p>
					{#if activeSession.coachStyle.customInstructions}
						<small>직접 설정: {activeSession.coachStyle.customInstructions}</small>
					{/if}
				</div>
			{/if}

			<div class="chat-log">
				{#if activeMessages.length || showAssistantDraft}
					{#each activeMessages as item (item.id)}
						<article class:item-user={item.role === 'user'} class:item-assistant={item.role === 'assistant'} class="chat-item">
							<div class="avatar" aria-hidden="true">{item.role === 'user' ? '나' : 'AI'}</div>
							<div class="bubble">
								<span>{item.role === 'user' ? '내 음성' : 'AI 코치'} · {item.time}</span>
								<p>{item.text}</p>
								<div class="usage-meta" aria-label="모델 및 토큰 사용량">
									{#each getUsageRows(item) as row}
										<small>
											<b>{row.label}</b>
											<em>{row.model}</em>
											{#if row.tokens}
												<i>{formatNumber(row.tokens)} tokens</i>
											{/if}
											{#if row.detail}
												<i>{row.detail}</i>
											{/if}
										</small>
									{/each}
								</div>
							</div>
						</article>
					{/each}

					{#if showAssistantDraft}
						<article class="chat-item item-assistant draft">
							<div class="avatar" aria-hidden="true">AI</div>
							<div class="bubble">
								<span>AI 코치 · 작성 중</span>
								<p>{assistantDraft}</p>
							</div>
						</article>
					{/if}
				{:else}
					<div class="empty-state">
						<strong>아직 대화 내용이 없어요</strong>
						<p>말을 시작하면 내 음성과 AI 답변이 이 세션에 기록됩니다.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.conversation {
		display: grid;
		gap: 16px;
	}

	header,
	.chat-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 16px;
	}

	header p,
	header h2,
	.chat-heading p {
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

	header > span,
	.chat-heading > span {
		min-height: 30px;
		display: inline-grid;
		place-items: center;
		padding: 0 10px;
		border-radius: 999px;
		background: #edf5f3;
		color: #66737a;
		font-size: 0.78rem;
		font-weight: 900;
		white-space: nowrap;
	}

	.history-layout {
		display: grid;
		grid-template-columns: minmax(190px, 0.42fr) minmax(0, 1fr);
		gap: 14px;
	}

	.session-list {
		max-height: 430px;
		overflow: auto;
		display: grid;
		align-content: start;
		gap: 10px;
		padding: 12px;
		border-radius: 8px;
		background: rgba(237, 245, 243, 0.62);
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	.session-list button {
		display: grid;
		gap: 6px;
		width: 100%;
		min-height: 118px;
		padding: 13px;
		border: 1px solid rgba(35, 65, 70, 0.09);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.82);
		color: #1f2428;
		font: inherit;
		text-align: left;
		cursor: pointer;
		box-shadow: 0 10px 24px rgba(33, 50, 56, 0.06);
	}

	.session-list button:hover,
	.session-list button.active {
		border-color: rgba(31, 139, 124, 0.38);
		background: #f8fdfb;
	}

	.session-list strong {
		font-size: 0.95rem;
		font-weight: 900;
		line-height: 1.3;
	}

	time,
	.session-list span,
	.chat-heading p {
		color: #66737a;
		font-size: 0.82rem;
		line-height: 1.4;
	}

	.session-list small {
		justify-self: start;
		padding: 4px 8px;
		border-radius: 999px;
		background: #edf5f3;
		color: #66737a;
		font-size: 0.75rem;
		font-weight: 900;
	}

	.session-list small.active {
		background: #e6f6f1;
		color: #187064;
	}

	.session-list small.ended {
		background: #eef2f4;
		color: #66737a;
	}

	.session-list small.failed {
		background: #fff0ee;
		color: #a2362e;
	}

	.chat-panel {
		display: grid;
		gap: 12px;
		min-width: 0;
	}

	.chat-heading {
		min-height: 48px;
		padding: 0 4px;
	}

	.chat-heading strong {
		color: #1f2428;
		font-size: 1rem;
		font-weight: 900;
	}

	.style-summary {
		display: grid;
		gap: 5px;
		padding: 12px 14px;
		border-radius: 8px;
		background: #f8fdfb;
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.12);
	}

	.style-summary strong {
		color: #187064;
		font-size: 0.76rem;
		font-weight: 950;
		text-transform: uppercase;
	}

	.style-summary p,
	.style-summary small {
		margin: 0;
		color: #1f2428;
		line-height: 1.45;
		word-break: keep-all;
	}

	.style-summary p {
		font-weight: 900;
	}

	.style-summary p span {
		display: inline-grid;
		place-items: center;
		min-height: 22px;
		margin-left: 6px;
		padding: 0 7px;
		border-radius: 999px;
		background: #e6f6f1;
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		vertical-align: middle;
	}

	.style-summary small {
		color: #5f6970;
	}

	.chat-log {
		max-height: 430px;
		overflow: auto;
		display: grid;
		align-content: start;
		gap: 12px;
		min-height: 280px;
		padding: 16px;
		border-radius: 8px;
		background: linear-gradient(180deg, rgba(248, 251, 255, 0.86), rgba(241, 249, 247, 0.76));
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	.chat-item {
		display: flex;
		align-items: end;
		gap: 10px;
	}

	.item-user {
		justify-content: flex-end;
	}

	.item-user .avatar {
		order: 2;
		background: #1f8b7c;
		color: white;
	}

	.item-assistant {
		justify-content: flex-start;
	}

	.avatar {
		width: 34px;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #e9eff8;
		color: #4d5a60;
		font-size: 0.78rem;
		font-weight: 900;
	}

	.bubble {
		max-width: min(78%, 520px);
		margin: 0;
		padding: 14px 16px;
		border-radius: 8px;
		color: #1f2428;
		line-height: 1.62;
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.05);
		word-break: keep-all;
		overflow-wrap: anywhere;
	}

	.bubble span {
		display: block;
		margin-bottom: 4px;
		color: #66737a;
		font-size: 0.76rem;
		font-weight: 950;
		text-transform: uppercase;
	}

	.bubble p {
		margin: 0;
	}

	.usage-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.usage-meta small {
		min-height: 24px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0 8px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.72);
		color: #4d5a60;
		font-size: 0.72rem;
		font-weight: 850;
		line-height: 1;
		text-transform: none;
	}

	.usage-meta b,
	.usage-meta em,
	.usage-meta i {
		font-style: normal;
	}

	.usage-meta b {
		color: #187064;
		font-weight: 950;
	}

	.usage-meta i {
		color: #66737a;
	}

	.item-user .bubble {
		background: #eef8f5;
	}

	.item-assistant .bubble {
		background: #f7faff;
	}

	.draft {
		opacity: 0.72;
	}

	.empty-state,
	.empty-session {
		display: grid;
		place-items: center;
		padding: 24px;
		text-align: center;
	}

	.empty-state {
		min-height: 220px;
	}

	.empty-session {
		min-height: 160px;
	}

	.empty-state strong,
	.empty-session strong {
		color: #1f2428;
		font-size: 1rem;
	}

	.empty-state p,
	.empty-session p {
		max-width: 24rem;
		margin: 8px 0 0;
		color: #5f6970;
		line-height: 1.55;
		word-break: keep-all;
	}

	@media (max-width: 720px) {
		.history-layout {
			grid-template-columns: 1fr;
		}

		.session-list {
			grid-auto-flow: column;
			grid-auto-columns: minmax(190px, 72%);
			overflow-x: auto;
			overflow-y: hidden;
			max-height: none;
		}
	}

	@media (max-width: 560px) {
		.chat-log {
			padding: 12px;
		}

		.bubble {
			max-width: min(82%, 520px);
		}
	}
</style>
