<script>
	let {
		sessions = [],
		currentElapsedSeconds = 0,
		currentSessionId = '',
		persistenceEnabled = true,
		onOpenConversation
	} = $props();

	const AUDIO_INPUT_PRICE = 32;
	const AUDIO_OUTPUT_PRICE = 64;
	const INPUT_TOKENS_PER_MINUTE = 150;
	const OUTPUT_TOKENS_PER_MINUTE = 200;
	const MAX_VISIBLE_ROWS = 100;

	let periodDays = $state(30);
	let sortBy = $state('cost-desc');
	let updatedAt = $state(new Date());
	let selectedSessionId = $state('');

	const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(value));
	const formatUsd = (value) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: value < 1 ? 4 : 2,
			maximumFractionDigits: value < 1 ? 4 : 2
		}).format(value);
	const formatMinutes = (seconds) => `${Math.max(0, seconds / 60).toFixed(1)}분`;
	const formatDateTime = (date) =>
		new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Asia/Seoul'
		}).format(date);

	const getMessages = (session) => (Array.isArray(session?.messages) ? session.messages : []);
	const getDurationSeconds = (session) => {
		const duration = Number(session?.durationSeconds ?? 0);
		const activeDuration = session?.id === currentSessionId ? Number(currentElapsedSeconds ?? 0) : 0;
		return Math.max(duration, activeDuration, 0);
	};
	const estimateTokens = (seconds, tokensPerMinute) => Math.round((seconds / 60) * tokensPerMinute);
	const estimateCost = (seconds) => {
		const inputTokens = estimateTokens(seconds, INPUT_TOKENS_PER_MINUTE);
		const outputTokens = estimateTokens(seconds, OUTPUT_TOKENS_PER_MINUTE);
		return {
			inputTokens,
			outputTokens,
			inputCost: (inputTokens / 1_000_000) * AUDIO_INPUT_PRICE,
			outputCost: (outputTokens / 1_000_000) * AUDIO_OUTPUT_PRICE
		};
	};
	const getSessionCost = (session) => {
		const cost = estimateCost(getDurationSeconds(session));
		return cost.inputCost + cost.outputCost;
	};
	const getTitle = (session) => session?.title || session?.coachStyle?.name || '영어회화 기록';

	let periodSessions = $derived.by(() => {
		const cutoff = Date.now() - Number(periodDays) * 24 * 60 * 60 * 1000;

		return sessions.filter((session) => {
			const startedAt = new Date(session.startedAt).getTime();
			return Number.isFinite(startedAt) && startedAt >= cutoff;
		});
	});

	let filteredSessions = $derived.by(() => {
		return [...periodSessions].sort((a, b) => {
			if (sortBy === 'cost-desc') return getSessionCost(b) - getSessionCost(a);
			if (sortBy === 'duration-desc') return getDurationSeconds(b) - getDurationSeconds(a);
			if (sortBy === 'messages-desc') return getMessages(b).length - getMessages(a).length;
			if (sortBy === 'started-desc') return new Date(b.startedAt) - new Date(a.startedAt);
			return new Date(a.startedAt) - new Date(b.startedAt);
		});
	});

	let visibleSessions = $derived(filteredSessions.slice(0, MAX_VISIBLE_ROWS));
	let selectedSession = $derived(
		sessions.find((session) => session.id === selectedSessionId) ?? null
	);
	let totalMessages = $derived(
		periodSessions.reduce((total, session) => total + getMessages(session).length, 0)
	);
	let totalSeconds = $derived(
		periodSessions.reduce((total, session) => total + getDurationSeconds(session), 0)
	);
	let averageSessionSeconds = $derived(periodSessions.length ? totalSeconds / periodSessions.length : 0);
	let totalInputTokens = $derived(estimateTokens(totalSeconds, INPUT_TOKENS_PER_MINUTE));
	let totalOutputTokens = $derived(estimateTokens(totalSeconds, OUTPUT_TOKENS_PER_MINUTE));
	let inputCost = $derived((totalInputTokens / 1_000_000) * AUDIO_INPUT_PRICE);
	let outputCost = $derived((totalOutputTokens / 1_000_000) * AUDIO_OUTPUT_PRICE);
	let totalCost = $derived(inputCost + outputCost);

	const openSession = (session) => {
		selectedSessionId = session.id;
	};

	const handleRowKeydown = (event, session) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openSession(session);
		}
	};
</script>

<section class="usage-panel" aria-labelledby="usage-title">
	<header class="usage-header">
		<div>
			<p>Usage</p>
			<h2 id="usage-title">API 사용량 관리</h2>
			<span>OpenAI API 사용량과 예상 비용을 앱 기록 기준으로 확인해요.</span>
		</div>
		<strong>추정치</strong>
	</header>

	{#if !persistenceEnabled}
		<div class="notice" role="status">
			<strong>데이터베이스 연결이 필요합니다.</strong>
			<span>현재 브라우저에 남아 있는 대화만 임시로 집계하고 있어요.</span>
		</div>
	{/if}

	<section class="control-panel" aria-label="사용량 필터">
		<label>
			<span>기간</span>
			<select bind:value={periodDays}>
				<option value={7}>최근 7일</option>
				<option value={30}>최근 30일</option>
				<option value={90}>최근 90일</option>
			</select>
		</label>

		<label>
			<span>정렬</span>
			<select bind:value={sortBy}>
				<option value="cost-desc">비용 높은순</option>
				<option value="duration-desc">시간 긴순</option>
				<option value="messages-desc">메시지 많은순</option>
				<option value="started-desc">최근 시작순</option>
				<option value="started-asc">오래된 시작순</option>
			</select>
		</label>

		<button type="button" onclick={() => (updatedAt = new Date())}>새로고침</button>
	</section>

	<section class="metric-grid primary-metrics" aria-label="핵심 사용량">
		<article>
			<strong>{formatUsd(totalCost)}</strong>
			<span>예상 비용</span>
		</article>
		<article>
			<strong>{formatMinutes(totalSeconds)}</strong>
			<span>음성 대화</span>
		</article>
		<article>
			<strong>{formatNumber(totalMessages)}개</strong>
			<span>메시지</span>
		</article>
	</section>

	<section class="metric-grid secondary-metrics" aria-label="추가 사용량">
		<article>
			<strong>{formatNumber(periodSessions.length)}개</strong>
			<span>총 대화 세션</span>
		</article>
		<article>
			<strong>{formatMinutes(averageSessionSeconds)}</strong>
			<span>평균 세션 시간</span>
		</article>
	</section>

	<section class="cost-card" aria-labelledby="cost-title">
		<div>
			<h3 id="cost-title">대화 비용 추정</h3>
			<p>
				음성 입력과 출력 토큰을 분당 사용량으로 환산한 예상 비용입니다. 실제 비용은 발화
				속도와 모델 응답 길이에 따라 달라질 수 있어요.
			</p>
		</div>

		<div class="model-card">
			<strong>GPT-Realtime-2 모델</strong>
			<dl>
				<div>
					<dt>음성 입력</dt>
					<dd>{formatNumber(totalInputTokens)} tokens · {formatUsd(inputCost)}</dd>
				</div>
				<div>
					<dt>음성 출력</dt>
					<dd>{formatNumber(totalOutputTokens)} tokens · {formatUsd(outputCost)}</dd>
				</div>
				<div class="total">
					<dt>예상 합계</dt>
					<dd>{formatUsd(totalCost)}</dd>
				</div>
			</dl>
			<small>
				단가 기준: 입력 ${AUDIO_INPUT_PRICE}/1M tokens, 출력 ${AUDIO_OUTPUT_PRICE}/1M tokens ·
				한국 시간 기준 · 마지막 갱신 {formatDateTime(updatedAt)}
			</small>
		</div>
	</section>

	<section class="details-card" aria-labelledby="details-title">
		<div class="details-header">
			<div>
				<h3 id="details-title">대화별 상세 사용량</h3>
				<p>{formatNumber(filteredSessions.length)}개 대화가 기간에 포함됩니다.</p>
			</div>
		</div>

		{#if visibleSessions.length}
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th>대화 제목</th>
							<th>시작 시간</th>
							<th>소요 시간</th>
							<th>메시지</th>
							<th>예상 비용</th>
						</tr>
					</thead>
					<tbody>
						{#each visibleSessions as session (session.id)}
							<tr
								tabindex="0"
								role="button"
								aria-label={`${getTitle(session)} 상세 정보 열기`}
								onclick={() => openSession(session)}
								onkeydown={(event) => handleRowKeydown(event, session)}
							>
								<td>
									<strong>{getTitle(session)}</strong>
									<span>{session.coachStyle?.name ?? '기본 코치'}</span>
								</td>
								<td>
									<time datetime={session.startedAt}>{formatDateTime(new Date(session.startedAt))}</time>
								</td>
								<td>{formatMinutes(getDurationSeconds(session))}</td>
								<td>{formatNumber(getMessages(session).length)}개</td>
								<td>{formatUsd(getSessionCost(session))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if filteredSessions.length > MAX_VISIBLE_ROWS}
				<p class="limit-note">성능을 위해 최근 조건에 맞는 100개 대화만 표시합니다.</p>
			{/if}

			<button class="link-button" type="button" onclick={() => onOpenConversation?.()}>
				전체 대화 목록으로 이동
			</button>
		{:else}
			<div class="empty-state">
				<strong>데이터가 없습니다.</strong>
				<p>이 기간에 대화 기록이 없습니다.</p>
				<button type="button" onclick={() => onOpenConversation?.()}>처음부터 시작하기</button>
			</div>
		{/if}
	</section>
</section>

{#if selectedSession}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => event.currentTarget === event.target && (selectedSessionId = '')}
	>
		<div
			class="session-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="session-modal-title"
		>
			<header>
				<div>
					<p>Conversation</p>
					<h3 id="session-modal-title">{getTitle(selectedSession)}</h3>
				</div>
				<button type="button" aria-label="상세 정보 닫기" onclick={() => (selectedSessionId = '')}>
					닫기
				</button>
			</header>

			<div class="modal-metrics">
				<article>
					<strong>{formatMinutes(getDurationSeconds(selectedSession))}</strong>
					<span>소요 시간</span>
				</article>
				<article>
					<strong>{formatNumber(getMessages(selectedSession).length)}개</strong>
					<span>메시지</span>
				</article>
				<article>
					<strong>{formatUsd(getSessionCost(selectedSession))}</strong>
					<span>예상 비용</span>
				</article>
			</div>

			<dl class="session-details">
				<div>
					<dt>시작 시간</dt>
					<dd>{formatDateTime(new Date(selectedSession.startedAt))}</dd>
				</div>
				<div>
					<dt>코치 스타일</dt>
					<dd>{selectedSession.coachStyle?.name ?? '기본 코치'}</dd>
				</div>
				<div>
					<dt>상태</dt>
					<dd>{selectedSession.status ?? '기록됨'}</dd>
				</div>
			</dl>
		</div>
	</div>
{/if}

<style>
	.usage-panel {
		display: grid;
		gap: 18px;
	}

	.usage-header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 16px;
	}

	.usage-header p,
	.usage-header h2,
	.usage-header span,
	h3,
	p,
	dl {
		margin: 0;
	}

	.usage-header p,
	.session-modal header p {
		color: #187064;
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
	}

	.usage-header h2 {
		margin-top: 7px;
		color: #1f2428;
		font-size: clamp(1.7rem, 6vw, 2.55rem);
		font-weight: 950;
		line-height: 1.08;
		word-break: keep-all;
	}

	.usage-header span,
	.cost-card p,
	.details-header p,
	.empty-state p,
	.notice span {
		display: block;
		margin-top: 8px;
		color: #5f6970;
		line-height: 1.58;
		word-break: keep-all;
	}

	.usage-header > strong {
		min-height: 30px;
		display: inline-grid;
		place-items: center;
		padding: 0 10px;
		border-radius: 999px;
		background: #e6f6f1;
		color: #187064;
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.notice,
	.control-panel,
	.cost-card,
	.details-card,
	.metric-grid article,
	.model-card,
	.session-modal {
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.76);
		box-shadow: 0 14px 32px rgba(33, 50, 56, 0.07);
	}

	.notice {
		padding: 14px 16px;
		background: #fff9ed;
		color: #815f16;
	}

	.notice span {
		color: #7c6a45;
	}

	.control-panel {
		display: grid;
		grid-template-columns: repeat(2, minmax(160px, 1fr)) auto;
		gap: 12px;
		align-items: end;
		padding: 18px;
	}

	label {
		display: grid;
		gap: 7px;
		color: #1f2428;
		font-weight: 900;
	}

	label span {
		font-size: 0.84rem;
	}

	select {
		min-height: 42px;
		width: 100%;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #1f2428;
		font: inherit;
		padding: 0 32px 0 12px;
		font-weight: 800;
	}

	button {
		min-height: 42px;
		padding: 0 15px;
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

	.metric-grid {
		display: grid;
		gap: 10px;
	}

	.primary-metrics {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.secondary-metrics {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.metric-grid article {
		display: grid;
		gap: 6px;
		min-height: 100px;
		place-items: center;
		padding: 16px;
		background: #edf5f3;
		text-align: center;
	}

	.metric-grid strong,
	.modal-metrics strong {
		color: #1f2428;
		font-size: 1.45rem;
		font-weight: 950;
		line-height: 1;
	}

	.metric-grid span,
	.model-card small,
	.limit-note,
	.modal-metrics span,
	.session-details dt {
		color: #66737a;
		font-size: 0.82rem;
		line-height: 1.45;
	}

	.cost-card,
	.details-card {
		display: grid;
		gap: 16px;
		padding: 18px;
	}

	h3 {
		color: #1f2428;
		font-size: 1rem;
		font-weight: 950;
	}

	.model-card {
		display: grid;
		gap: 15px;
		padding: 18px;
		background: #f5f9fb;
	}

	.model-card > strong {
		color: #1f2428;
		font-size: 1.08rem;
		font-weight: 950;
	}

	dl {
		display: grid;
		gap: 10px;
	}

	dl div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.09);
	}

	dl div:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}

	dt {
		color: #4d5a60;
		font-weight: 850;
	}

	dd {
		margin: 0;
		color: #1f2428;
		font-weight: 900;
		text-align: right;
	}

	.total dt,
	.total dd {
		color: #187064;
		font-size: 1.04rem;
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		gap: 14px;
	}

	.table-scroll {
		overflow-x: auto;
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
	}

	table {
		width: 100%;
		min-width: 660px;
		border-collapse: collapse;
		background: #ffffff;
	}

	th,
	td {
		padding: 13px 14px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.08);
		text-align: left;
		vertical-align: middle;
	}

	th {
		color: #4d5a60;
		font-size: 0.78rem;
		font-weight: 950;
		background: #f5f9fb;
	}

	tbody tr {
		cursor: pointer;
	}

	tbody tr:hover,
	tbody tr:focus {
		outline: none;
		background: #edf5f3;
	}

	td strong,
	td span {
		display: block;
	}

	td strong {
		color: #1f2428;
		font-weight: 950;
	}

	td span {
		margin-top: 4px;
		color: #66737a;
		font-size: 0.82rem;
	}

	td:last-child {
		color: #187064;
		font-weight: 950;
	}

	.link-button {
		justify-self: start;
		background: #edf5f3;
		color: #187064;
	}

	.link-button:hover {
		background: #dcece8;
	}

	.empty-state {
		display: grid;
		gap: 10px;
		justify-items: center;
		padding: 34px 18px;
		border-radius: 8px;
		background: #f5f9fb;
		text-align: center;
	}

	.empty-state strong {
		color: #1f2428;
		font-size: 1.08rem;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 18px;
		background: rgba(18, 28, 31, 0.38);
	}

	.session-modal {
		width: min(100%, 560px);
		display: grid;
		gap: 18px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.98);
	}

	.session-modal header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 14px;
	}

	.session-modal h3 {
		margin-top: 7px;
		font-size: 1.4rem;
	}

	.session-modal header button {
		background: #edf5f3;
		color: #187064;
	}

	.modal-metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.modal-metrics article {
		display: grid;
		gap: 6px;
		place-items: center;
		min-height: 82px;
		border-radius: 8px;
		background: #edf5f3;
		text-align: center;
	}

	.session-details {
		padding-top: 2px;
	}

	@media (max-width: 760px) {
		.control-panel {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 560px) {
		.usage-header,
		.details-header,
		.session-modal header {
			align-items: stretch;
			flex-direction: column;
		}

		.control-panel,
		.primary-metrics,
		.secondary-metrics,
		.modal-metrics {
			grid-template-columns: 1fr;
		}

		dl div {
			align-items: start;
			flex-direction: column;
		}

		dd {
			text-align: left;
		}
	}
</style>
