<script>
	let { sessions = [], currentElapsedSeconds = 0 } = $props();

	const AUDIO_INPUT_PRICE = 32;
	const AUDIO_OUTPUT_PRICE = 64;
	const INPUT_TOKENS_PER_MINUTE = 150;
	const OUTPUT_TOKENS_PER_MINUTE = 200;

	let periodDays = $state(30);
	let updatedAt = $state(new Date());

	const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(value);
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
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);

	let filteredSessions = $derived.by(() => {
		const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

		return sessions.filter((session) => {
			const startedAt = new Date(session.startedAt).getTime();
			return Number.isFinite(startedAt) && startedAt >= cutoff;
		});
	});

	let totalMessages = $derived(
		filteredSessions.reduce((total, session) => total + session.messages.length, 0)
	);
	let completedSeconds = $derived(
		filteredSessions.reduce((total, session) => total + (session.durationSeconds ?? 0), 0)
	);
	let totalSeconds = $derived(completedSeconds + currentElapsedSeconds);
	let inputTokens = $derived(Math.round((totalSeconds / 60) * INPUT_TOKENS_PER_MINUTE));
	let outputTokens = $derived(Math.round((totalSeconds / 60) * OUTPUT_TOKENS_PER_MINUTE));
	let inputCost = $derived((inputTokens / 1_000_000) * AUDIO_INPUT_PRICE);
	let outputCost = $derived((outputTokens / 1_000_000) * AUDIO_OUTPUT_PRICE);
	let totalCost = $derived(inputCost + outputCost);
</script>

<section class="usage-panel" aria-labelledby="usage-title">
	<header>
		<div>
			<p>Usage</p>
			<h2 id="usage-title">API 사용량 관리</h2>
		</div>
		<span>추정치</span>
	</header>

	<p class="lead">OpenAI API 사용량과 예상 비용을 앱 기록 기준으로 확인해요.</p>

	<div class="summary-card">
		<div class="period-row">
			<label>
				<span>기간</span>
				<select bind:value={periodDays}>
					<option value={7}>최근 7일</option>
					<option value={30}>최근 30일</option>
					<option value={90}>최근 90일</option>
				</select>
			</label>
			<button type="button" onclick={() => (updatedAt = new Date())}>새로고침</button>
		</div>

		<div class="metric-grid">
			<article>
				<strong>{filteredSessions.length}</strong>
				<span>대화 세션</span>
			</article>
			<article>
				<strong>{formatMinutes(totalSeconds)}</strong>
				<span>음성 대화</span>
			</article>
			<article>
				<strong>{totalMessages}</strong>
				<span>메시지</span>
			</article>
		</div>

		<small>마지막 갱신: {formatDateTime(updatedAt)}</small>
	</div>

	<div class="cost-card">
		<h3>대화 비용 추정</h3>
		<p>
			음성 입력과 출력 토큰을 분당 사용량으로 환산한 대략적인 예상 비용입니다. 실제 비용은
			대화 길이, 침묵, 발화 속도, 모델 응답 길이에 따라 달라질 수 있어요.
		</p>

		<div class="model-card">
			<div class="model-title">
				<span aria-hidden="true"></span>
				<strong>GPT-Realtime-2 모델</strong>
			</div>

			<dl>
				<div>
					<dt>음성 입력</dt>
					<dd>{formatNumber(inputTokens)} tokens · {formatUsd(inputCost)}</dd>
				</div>
				<div>
					<dt>음성 출력</dt>
					<dd>{formatNumber(outputTokens)} tokens · {formatUsd(outputCost)}</dd>
				</div>
				<div class="total">
					<dt>예상 합계</dt>
					<dd>{formatUsd(totalCost)}</dd>
				</div>
			</dl>

			<small>
				단가 기준: 음성 입력 ${AUDIO_INPUT_PRICE}/1M tokens, 음성 출력 ${AUDIO_OUTPUT_PRICE}/1M
				tokens
			</small>
		</div>
	</div>
</section>

<style>
	.usage-panel {
		display: grid;
		gap: 18px;
	}

	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 16px;
	}

	header p,
	header h2,
	.lead,
	h3,
	dl {
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

	.lead,
	.cost-card p {
		color: #5f6970;
		line-height: 1.62;
		word-break: keep-all;
	}

	.summary-card,
	.cost-card,
	.model-card {
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.76);
		box-shadow: 0 14px 32px rgba(33, 50, 56, 0.07);
	}

	.summary-card,
	.cost-card {
		display: grid;
		gap: 16px;
		padding: 18px;
	}

	.period-row {
		display: flex;
		align-items: end;
		gap: 12px;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #1f2428;
		font-weight: 900;
	}

	select {
		min-height: 40px;
		padding: 0 32px 0 12px;
		border: 1px solid #d8e0e2;
		border-radius: 8px;
		background: #fbfefd;
		color: #1f2428;
		font: inherit;
		font-weight: 800;
	}

	button {
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

	.metric-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.metric-grid article {
		display: grid;
		gap: 5px;
		min-height: 94px;
		place-items: center;
		padding: 12px;
		border-radius: 8px;
		background: #edf5f3;
		text-align: center;
	}

	.metric-grid strong {
		color: #1f2428;
		font-size: 1.45rem;
		font-weight: 950;
		line-height: 1;
	}

	.metric-grid span,
	.summary-card small,
	.model-card small {
		color: #66737a;
		font-size: 0.82rem;
		line-height: 1.45;
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

	.model-title {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.model-title span {
		width: 34px;
		aspect-ratio: 1;
		border-radius: 50%;
		background: linear-gradient(135deg, #e7f3ef, #d9e7f7);
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	.model-title strong {
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

	@media (max-width: 560px) {
		.metric-grid {
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
