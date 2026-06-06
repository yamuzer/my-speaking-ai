<script>
	import { onDestroy } from 'svelte';
	import ConnectionSafetyStatus from '$lib/components/ConnectionSafetyStatus.svelte';
	import ConversationLog from '$lib/components/ConversationLog.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import VoiceVisualizer from '$lib/components/VoiceVisualizer.svelte';
	import { createWaveformAnalyzer, RESTING_WAVE_BARS } from '$lib/realtime/audio-waveform.js';
	import { createRealtimeVoiceSession } from '$lib/realtime/realtime-session.js';

	let elapsedSeconds = $state(0);
	let statusMessage = $state('시작 버튼을 누르고 영어로 편하게 말해보세요.');
	let errorMessage = $state('');
	let isConnecting = $state(false);
	let isConnected = $state(false);
	let waveBars = $state([...RESTING_WAVE_BARS]);
	let conversation = $state([]);
	let assistantDraft = $state('');
	let debugEntries = $state([]);
	let closureCheck = $state();

	let connectedStartedAt = 0;
	let timer;
	let closureCheckTimer;
	let realtimeSession;
	let waveformAnalyzer;

	const addDebugEntry = ({ level = 'event', step, message, detail }) => {
		debugEntries = [
			...debugEntries.slice(-39),
			{
				id: crypto.randomUUID(),
				time: new Date().toLocaleTimeString(),
				level,
				step,
				message,
				detail
			}
		];
	};

	const addConversationItem = (role, text) => {
		const trimmed = text?.trim();

		if (!trimmed) {
			return;
		}

		conversation = [...conversation.slice(-5), { role, text: trimmed }];
	};

	const stopWaveform = () => {
		waveformAnalyzer?.stop();
		waveformAnalyzer = undefined;
		waveBars = [...RESTING_WAVE_BARS];
	};

	const handleRealtimeEvent = (event) => {
		if (event.type === 'input_audio_buffer.speech_started') {
			statusMessage = '듣고 있어요. 편하게 영어로 말해 주세요.';
			return;
		}

		if (event.type === 'input_audio_buffer.speech_stopped') {
			statusMessage = '답변을 준비하고 있어요.';
			return;
		}

		if (event.type === 'conversation.item.input_audio_transcription.completed') {
			addConversationItem('user', event.transcript);
			return;
		}

		if (event.type === 'response.output_audio_transcript.delta') {
			assistantDraft += event.delta ?? '';
			return;
		}

		if (event.type === 'response.output_audio_transcript.done') {
			addConversationItem('assistant', assistantDraft || event.transcript);
			assistantDraft = '';
			statusMessage = '좋아요. 이어서 말하면 바로 답해드릴게요.';
			return;
		}

		if (event.type === 'response.done') {
			statusMessage = '좋아요. 이어서 말하면 바로 답해드릴게요.';
			return;
		}

		if (event.type === 'error') {
			errorMessage = event.error?.message ?? 'Realtime 세션에서 오류가 발생했어요.';
		}
	};

	const startSessionTimer = () => {
		connectedStartedAt = Date.now();
		timer = window.setInterval(() => {
			elapsedSeconds = (Date.now() - connectedStartedAt) / 1000;
		}, 250);
	};

	const stopSessionTimer = () => {
		window.clearInterval(timer);
		timer = undefined;
		elapsedSeconds = 0;
	};

	const buildClosureCheck = (check) =>
		check
			? {
					...check,
					message: check.isClosed
						? '마이크 입력과 실시간 연결을 모두 닫았습니다. 새 요청이 시작되기 전까지 추가 음성 통신은 이루어지지 않습니다.'
						: '브라우저가 일부 연결을 닫는 중입니다. 잠시 후에도 이 상태가 유지되면 새로고침해 주세요.'
				}
			: undefined;

	const startRealtimeSession = async () => {
		errorMessage = '';
		assistantDraft = '';
		window.clearTimeout(closureCheckTimer);
		closureCheck = undefined;
		addDebugEntry({
			step: 'session.start',
			message: '사용자가 실시간 대화 시작을 눌렀습니다.'
		});

		if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
			errorMessage = '이 브라우저에서는 실시간 음성 대화를 지원하지 않아요.';
			addDebugEntry({
				level: 'error',
				step: 'browser.support',
				message: errorMessage
			});
			return;
		}

		isConnecting = true;
		statusMessage = '실시간 영어 코치와 연결하고 있어요.';

		try {
			realtimeSession = await createRealtimeVoiceSession({
				onDebug: addDebugEntry,
				onEvent: handleRealtimeEvent,
				onOpen: () => {
					statusMessage = '연결됐어요. 영어로 말하면 바로 답해드려요.';
				},
				onLocalStream: (stream) => {
					waveformAnalyzer = createWaveformAnalyzer(stream, (bars) => {
						waveBars = bars;
					});
				}
			});

			isConnected = true;
			startSessionTimer();
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: '실시간 대화를 시작하지 못했어요. API 키와 네트워크를 확인해 주세요.';
			addDebugEntry({
				level: 'error',
				step: 'session.start',
				message: '실시간 대화 시작 중 예외가 발생했습니다.',
				detail: errorMessage
			});
			stopRealtimeSession();
		} finally {
			isConnecting = false;
		}
	};

	const stopRealtimeSession = () => {
		stopSessionTimer();
		window.clearTimeout(closureCheckTimer);
		const sessionToClose = realtimeSession;
		const check = sessionToClose?.close();
		realtimeSession = undefined;
		stopWaveform();
		isConnected = false;
		isConnecting = false;
		closureCheck = buildClosureCheck(check);
		statusMessage = closureCheck?.isClosed
			? '대화가 완전히 종료됐어요. 원하면 다시 시작할 수 있습니다.'
			: '대화가 종료됐어요. 원하면 다시 시작할 수 있습니다.';

		if (sessionToClose && !closureCheck?.isClosed) {
			closureCheckTimer = window.setTimeout(() => {
				closureCheck = buildClosureCheck(sessionToClose.inspectClosure());
				addDebugEntry({
					level: closureCheck?.isClosed ? 'success' : 'event',
					step: 'ui.closed_check',
					message: closureCheck?.isClosed
						? 'UI 재검증 결과, 실시간 연결이 완전히 종료된 상태입니다.'
						: 'UI 재검증 결과, 일부 연결이 아직 종료 중으로 표시됩니다.',
					detail: JSON.stringify(closureCheck, null, 2)
				});
				statusMessage = closureCheck?.isClosed
					? '대화가 완전히 종료됐어요. 원하면 다시 시작할 수 있습니다.'
					: statusMessage;
			}, 400);
		}
	};

	onDestroy(() => {
		if (typeof window === 'undefined') {
			return;
		}

		stopRealtimeSession();
		window.clearTimeout(closureCheckTimer);
	});
</script>

<svelte:head>
	<title>실시간 영어회화 코치</title>
</svelte:head>

<main class="recorder-page">
	<section class="recorder-panel" aria-labelledby="page-title">
		<div class="intro">
			<div class="title-row">
				<p class="eyebrow">Real-time English Coach</p>
				<span class:online={isConnected} class:pending={isConnecting} class="session-chip">
					{isConnecting ? '연결 중' : isConnected ? '대화 중' : '준비됨'}
				</span>
			</div>
			<h1 id="page-title">실시간 영어회화 코치</h1>
			<p>버튼을 누르고 영어로 말해보세요. 코치가 자연스럽게 대화를 이어가며 짧게 피드백해드려요.</p>
		</div>

		<VoiceVisualizer
			{isConnected}
			{isConnecting}
			{elapsedSeconds}
			{waveBars}
		/>

		<div class="controls">
			{#if isConnected || isConnecting}
				<button class="stop" type="button" onclick={stopRealtimeSession}>대화 종료</button>
			{:else}
				<button class="primary" type="button" onclick={startRealtimeSession}>실시간 대화 시작</button>
			{/if}
		</div>

		<p class="status" aria-live="polite">{statusMessage}</p>
		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}

		<ConnectionSafetyStatus check={closureCheck} />
		<ConversationLog {conversation} {assistantDraft} />
		<DebugPanel entries={debugEntries} onClear={() => (debugEntries = [])} />
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Pretendard Variable', Pretendard, 'Noto Sans KR', Inter, ui-sans-serif, system-ui,
			-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #f6f3ed;
		color: #201f1b;
		letter-spacing: 0;
		text-rendering: geometricprecision;
	}

	button {
		font: inherit;
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			background 160ms ease;
	}

	.recorder-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 40px 18px;
		background:
			radial-gradient(circle at 16% 12%, rgba(207, 68, 57, 0.14), transparent 24rem),
			radial-gradient(circle at 84% 10%, rgba(42, 117, 85, 0.12), transparent 23rem),
			linear-gradient(135deg, #f6f3ed 0%, #edf3ed 50%, #fff8f1 100%);
	}

	.recorder-panel {
		width: min(100%, 760px);
		padding: clamp(24px, 5vw, 44px);
		border: 1px solid rgba(34, 31, 28, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.92);
		box-shadow:
			0 30px 90px rgba(38, 34, 30, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.72);
		backdrop-filter: blur(18px);
	}

	.intro {
		display: grid;
		gap: 14px;
		padding-bottom: 2px;
		justify-items: center;
		text-align: center;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.eyebrow {
		margin: 0;
		color: #a63a32;
		font-size: 0.74rem;
		font-weight: 900;
		text-transform: uppercase;
		line-height: 1;
	}

	.session-chip {
		display: inline-flex;
		align-items: center;
		min-height: 30px;
		padding: 0 11px;
		border-radius: 999px;
		background: #f2eee7;
		color: #625b52;
		font-size: 0.76rem;
		font-weight: 900;
		line-height: 1;
	}

	.session-chip.online {
		background: #eaf5ee;
		color: #24724d;
	}

	.session-chip.pending {
		background: #fff2d8;
		color: #8b5d12;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.15rem, 7vw, 3.55rem);
		line-height: 1.02;
		font-weight: 860;
	}

	.intro p:last-child {
		margin: 0;
		max-width: 620px;
		color: #68645c;
		font-size: 1.02rem;
		line-height: 1.72;
	}

	.controls {
		display: grid;
		gap: 12px;
		margin-top: 20px;
	}

	button {
		min-height: 56px;
		display: inline-grid;
		place-items: center;
		border-radius: 8px;
		border: 0;
		font-weight: 900;
		cursor: pointer;
	}

	.primary {
		background: #cf4439;
		color: white;
		box-shadow: 0 14px 34px rgba(207, 68, 57, 0.24);
	}

	.primary:hover {
		background: #b93830;
		transform: translateY(-1px);
		box-shadow: 0 18px 38px rgba(207, 68, 57, 0.28);
	}

	.stop {
		background: #a9352f;
		color: white;
		box-shadow: 0 14px 32px rgba(169, 53, 47, 0.22);
	}

	.stop:hover {
		background: #8f2c28;
		transform: translateY(-1px);
	}

	.status,
	.error {
		margin: 18px 0 0;
		line-height: 1.58;
		padding: 13px 15px;
		border-radius: 8px;
		font-size: 0.95rem;
	}

	.status {
		color: #4d574e;
		background: #f3f7f1;
		box-shadow: inset 0 0 0 1px rgba(42, 117, 85, 0.08);
	}

	.error {
		color: #9c3029;
		background: #fff0ee;
		font-weight: 700;
		box-shadow: inset 0 0 0 1px rgba(207, 68, 57, 0.1);
	}

	@media (max-width: 560px) {
		.recorder-page {
			padding: 18px 12px;
			place-items: start center;
		}
	}
</style>
