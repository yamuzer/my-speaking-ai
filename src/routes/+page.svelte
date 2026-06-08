<script>
	import { onDestroy, untrack } from 'svelte';
	import ApiUsagePanel from '$lib/components/ApiUsagePanel.svelte';
	import CoachStylePanel from '$lib/components/CoachStylePanel.svelte';
	import ConnectionSafetyStatus from '$lib/components/ConnectionSafetyStatus.svelte';
	import ConversationLog from '$lib/components/ConversationLog.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import UserProfilePanel from '$lib/components/UserProfilePanel.svelte';
	import VoiceVisualizer from '$lib/components/VoiceVisualizer.svelte';
	import { saveConversationRecord } from '$lib/client/conversation-records.js';
	import { savePromptStyle } from '$lib/client/prompt-styles.js';
	import { defaultCoachStyles } from '$lib/coach-styles.js';
	import { createWaveformAnalyzer, RESTING_WAVE_BARS } from '$lib/realtime/audio-waveform.js';
	import { createRealtimeVoiceSession } from '$lib/realtime/realtime-session.js';

	let { data, form } = $props();

	let elapsedSeconds = $state(0);
	let statusMessage = $state('시작 버튼을 누르고 영어로 편하게 말해보세요.');
	let errorMessage = $state('');
	let isConnecting = $state(false);
	let isConnected = $state(false);
	let waveBars = $state([...RESTING_WAVE_BARS]);
	let conversationSessions = $state(untrack(() => data.conversationSessions ?? []));
	let activeSessionId = $state(untrack(() => data.conversationSessions?.[0]?.id ?? ''));
	let recordingSessionId = $state('');
	let assistantDraft = $state('');
	let debugEntries = $state([]);
	let closureCheck = $state();
	let selectedCoachStyleId = $state('friendly');
	let customCoachStyles = $state(untrack(() => data.promptStyles ?? []));
	let styleSaveMessage = $state('');
	let activeWorkspaceTab = $state('history');
	let activePage = $state(untrack(() => (form?.formName === 'profile' ? 'profile' : 'conversation')));
	let isMenuOpen = $state(false);
	let persistenceEnabled = $state(untrack(() => Boolean(data.persistenceEnabled)));
	let promptStylePersistenceEnabled = $state(
		untrack(() => Boolean(data.promptStylePersistenceEnabled))
	);

	let connectedStartedAt = 0;
	let timer;
	let closureCheckTimer;
	let realtimeSession;
	let waveformAnalyzer;

	const REALTIME_MODEL = 'gpt-realtime-2';
	const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';
	const ESTIMATED_CHARS_PER_TOKEN = 4;

	let coachStyles = $derived([...defaultCoachStyles, ...customCoachStyles]);
	let selectedCoachStyle = $derived(
		coachStyles.find((style) => style.id === selectedCoachStyleId) ?? coachStyles[0]
	);

	const selectCoachStyle = (styleId) => {
		selectedCoachStyleId = styleId;
	};

	const saveCustomCoachStyle = async ({ id, name, description, instructions, favorite }) => {
		const style = {
			id: id ?? crypto.randomUUID(),
			icon: '✨',
			name,
			badge: favorite ? '즐겨찾기' : '직접 설정',
			description,
			instructions,
			favorite,
			custom: true
		};

		if (!promptStylePersistenceEnabled) {
			styleSaveMessage = 'DB 연결이 없어 현재 브라우저에서만 임시 저장됩니다.';
			customCoachStyles = [
				style,
				...customCoachStyles.filter((coachStyle) => coachStyle.id !== style.id)
			];
			selectedCoachStyleId = style.id;
			return;
		}

		try {
			const savedStyle = await savePromptStyle(style);
			customCoachStyles = [
				savedStyle,
				...customCoachStyles.filter((coachStyle) => coachStyle.id !== savedStyle.id)
			];
			selectedCoachStyleId = savedStyle.id;
			styleSaveMessage = id ? '프롬프트 스타일을 수정했습니다.' : '프롬프트 스타일을 저장했습니다.';
		} catch (error) {
			styleSaveMessage =
				error instanceof Error ? error.message : '프롬프트 스타일 저장에 실패했습니다.';
		}
	};

	const buildCoachStylePayload = () => ({
		name: selectedCoachStyle.name,
		instructions: selectedCoachStyle.instructions,
		customInstructions: ''
	});

	const persistConversationRecord = async (session) => {
		if (!persistenceEnabled || !session?.id) {
			return;
		}

		try {
			await saveConversationRecord(session);
		} catch (error) {
			addDebugEntry({
				level: 'error',
				step: 'conversation.persist',
				message: '대화 기록을 DB에 저장하지 못했습니다.',
				detail: error instanceof Error ? error.message : String(error)
			});
		}
	};

	const formatSessionDate = (date) =>
		new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);

	const formatSessionTime = (date) =>
		new Intl.DateTimeFormat('ko-KR', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);

	const createConversationSession = (coachStyle) => {
		const now = new Date();

		return {
			id: crypto.randomUUID(),
			title: '영어회화 기록',
			startedAt: now.toISOString(),
			dateLabel: formatSessionDate(now),
			timeLabel: formatSessionTime(now),
			coachStyle: {
				name: coachStyle.name,
				badge: coachStyle.badge,
				description: coachStyle.description,
				customInstructions: coachStyle.custom ? coachStyle.instructions : ''
			},
			status: 'preparing',
			durationSeconds: 0,
			messages: []
		};
	};

	const startConversationSession = () => {
		const session = createConversationSession(selectedCoachStyle);
		conversationSessions = [session, ...conversationSessions];
		activeSessionId = session.id;
		recordingSessionId = session.id;
		persistConversationRecord(session);
		return session.id;
	};

	const setConversationSessionStatus = (sessionId, status) => {
		if (!sessionId) {
			return;
		}

		let updatedSession;
		conversationSessions = conversationSessions.map((session) => {
			if (session.id !== sessionId) {
				return session;
			}

			updatedSession = { ...session, status };
			return updatedSession;
		});

		if (updatedSession) {
			persistConversationRecord(updatedSession);
		}
	};

	const setConversationSessionDuration = (sessionId, durationSeconds) => {
		if (!sessionId) {
			return;
		}

		let updatedSession;
		conversationSessions = conversationSessions.map((session) => {
			if (session.id !== sessionId) {
				return session;
			}

			updatedSession = { ...session, durationSeconds };
			return updatedSession;
		});

		if (updatedSession) {
			persistConversationRecord(updatedSession);
		}
	};

	const selectConversationSession = (sessionId) => {
		activeSessionId = sessionId;
	};

	const openPage = (page) => {
		activePage = page;
		isMenuOpen = false;
	};

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

	const estimateTextTokens = (text) =>
		Math.max(1, Math.ceil(String(text ?? '').trim().length / ESTIMATED_CHARS_PER_TOKEN));

	const buildEstimatedUsage = (role, text) => {
		const tokens = estimateTextTokens(text);

		return {
			source: 'estimated',
			inputTokens: role === 'user' ? tokens : 0,
			outputTokens: role === 'assistant' ? tokens : 0,
			totalTokens: tokens
		};
	};

	const buildUsageMetadata = (role, text, usage) => {
		if (!usage) {
			return {
				model: role === 'user' ? TRANSCRIPTION_MODEL : REALTIME_MODEL,
				usage: buildEstimatedUsage(role, text)
			};
		}

		const inputDetails = usage.input_token_details ?? {};
		const outputDetails = usage.output_token_details ?? {};

		return {
			model: REALTIME_MODEL,
			usage: {
				source: 'api',
				inputTokens: Number(usage.input_tokens ?? 0),
				outputTokens: Number(usage.output_tokens ?? 0),
				totalTokens: Number(usage.total_tokens ?? 0),
				inputAudioTokens: Number(inputDetails.audio_tokens ?? 0),
				inputTextTokens: Number(inputDetails.text_tokens ?? 0),
				outputAudioTokens: Number(outputDetails.audio_tokens ?? 0),
				outputTextTokens: Number(outputDetails.text_tokens ?? 0)
			}
		};
	};

	const addConversationItem = (role, text, metadata = {}) => {
		const trimmed = text?.trim();

		if (!trimmed) {
			return;
		}

		const sessionId = recordingSessionId || activeSessionId || startConversationSession();
		const message = {
			id: crypto.randomUUID(),
			role,
			text: trimmed,
			time: formatSessionTime(new Date()),
			...buildUsageMetadata(role, trimmed),
			...metadata
		};

		let updatedSession;
		conversationSessions = conversationSessions.map((session) => {
			if (session.id !== sessionId) {
				return session;
			}

			updatedSession = {
				...session,
				status: session.status === 'preparing' ? 'active' : session.status,
				messages: [...session.messages, message]
			};
			return updatedSession;
		});

		if (updatedSession) {
			persistConversationRecord(updatedSession);
		}
	};

	const applyRealtimeUsageToLatestTurn = (usage) => {
		if (!usage || !recordingSessionId) {
			return;
		}

		let updatedSession;
		conversationSessions = conversationSessions.map((session) => {
			if (session.id !== recordingSessionId) {
				return session;
			}

			const messages = [...session.messages];
			const lastAssistantIndex = messages.findLastIndex((message) => message.role === 'assistant');
			const lastUserIndex = messages.findLastIndex((message, index) => {
				return message.role === 'user' && (lastAssistantIndex === -1 || index < lastAssistantIndex);
			});
			const usageMetadata = buildUsageMetadata('assistant', messages[lastAssistantIndex]?.text, usage);

			if (lastAssistantIndex !== -1) {
				messages[lastAssistantIndex] = {
					...messages[lastAssistantIndex],
					model: REALTIME_MODEL,
					usage: {
						...usageMetadata.usage,
						inputTokens: 0,
						inputAudioTokens: 0,
						inputTextTokens: 0
					}
				};
			}

			if (lastUserIndex !== -1) {
				messages[lastUserIndex] = {
					...messages[lastUserIndex],
					model: REALTIME_MODEL,
					transcriptionModel: TRANSCRIPTION_MODEL,
					usage: {
						...usageMetadata.usage,
						outputTokens: 0,
						outputAudioTokens: 0,
						outputTextTokens: 0
					}
				};
			}

			updatedSession = { ...session, messages };
			return updatedSession;
		});

		if (updatedSession) {
			persistConversationRecord(updatedSession);
		}
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
			applyRealtimeUsageToLatestTurn(event.response?.usage ?? event.usage);
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

		const sessionId = startConversationSession();
		isConnecting = true;
		statusMessage = '실시간 영어 코치와 연결하고 있어요.';

		try {
			realtimeSession = await createRealtimeVoiceSession({
				coachStyle: buildCoachStylePayload(),
				onDebug: addDebugEntry,
				onEvent: handleRealtimeEvent,
				onOpen: () => {
					setConversationSessionStatus(sessionId, 'active');
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
			setConversationSessionStatus(sessionId, 'failed');
			stopRealtimeSession();
		} finally {
			isConnecting = false;
		}
	};

	const stopRealtimeSession = () => {
		const finalElapsedSeconds = elapsedSeconds;
		stopSessionTimer();
		window.clearTimeout(closureCheckTimer);
		const sessionToClose = realtimeSession;
		const check = sessionToClose?.close();
		if (sessionToClose) {
			setConversationSessionStatus(recordingSessionId, 'ended');
			setConversationSessionDuration(recordingSessionId, finalElapsedSeconds);
		}
		recordingSessionId = '';
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
	<title>실시간 영어회화 AI</title>
</svelte:head>

<main class="recorder-page">
	<section class="recorder-panel" aria-labelledby="page-title">
		<div class="account-bar">
			<button class="brand-button" type="button" onclick={() => openPage('conversation')}>
				My Speaking AI
			</button>

			<div class="menu-area">
				<button
					class="menu-button"
					type="button"
					aria-label="메뉴 열기"
					aria-expanded={isMenuOpen}
					onclick={() => (isMenuOpen = !isMenuOpen)}
				>
					<span></span>
					<span></span>
					<span></span>
				</button>

				{#if isMenuOpen}
					<nav class="menu-popover" aria-label="사용자 메뉴">
						<p>안녕하세요, {data.user.email}님</p>
						<button type="button" onclick={() => openPage('profile')}>사용자 정보</button>
						<button type="button" onclick={() => openPage('usage')}>사용량 통계</button>
						<form method="POST" action="/auth/logout">
							<button type="submit">로그아웃</button>
						</form>
					</nav>
				{/if}
			</div>
		</div>

		{#if activePage === 'usage'}
			<ApiUsagePanel
				sessions={conversationSessions}
				currentElapsedSeconds={isConnected || isConnecting ? elapsedSeconds : 0}
				currentSessionId={recordingSessionId}
				{persistenceEnabled}
				onOpenConversation={() => {
					activePage = 'conversation';
					activeWorkspaceTab = 'history';
				}}
			/>
		{:else if activePage === 'profile'}
			<UserProfilePanel profile={data.profile} profileForm={form} user={data.user} />
		{:else}
			<div class="intro">
				<div class="title-row">
					<p class="eyebrow">Real-time English Coach</p>
					<span class:online={isConnected} class:pending={isConnecting} class="session-chip">
						{isConnecting ? '연결 중' : isConnected ? '대화 중' : '준비됨'}
					</span>
				</div>
				<h1 id="page-title">실시간 영어회화 AI</h1>
				<p>AI와 바로 말하며 영어 대화를 연습하세요.</p>
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

			<section class="workspace-tabs" aria-label="대화 관리">
				<div class="tab-list" role="tablist" aria-label="대화 관리 탭">
					<button
						class:active={activeWorkspaceTab === 'history'}
						type="button"
						role="tab"
						aria-selected={activeWorkspaceTab === 'history'}
						aria-controls="history-panel"
						id="history-tab"
						onclick={() => (activeWorkspaceTab = 'history')}
					>
						대화 기록
					</button>
					<button
						class:active={activeWorkspaceTab === 'style'}
						type="button"
						role="tab"
						aria-selected={activeWorkspaceTab === 'style'}
						aria-controls="style-panel"
						id="style-tab"
						onclick={() => (activeWorkspaceTab = 'style')}
					>
						AI 코치 스타일
					</button>
				</div>

				{#if activeWorkspaceTab === 'history'}
					<div id="history-panel" role="tabpanel" aria-labelledby="history-tab">
						<ConversationLog
							sessions={conversationSessions}
							{activeSessionId}
							{recordingSessionId}
							{assistantDraft}
							onSelect={selectConversationSession}
						/>
					</div>
				{:else}
					<div id="style-panel" role="tabpanel" aria-labelledby="style-tab">
						<CoachStylePanel
							styles={coachStyles}
							selectedStyleId={selectedCoachStyleId}
							disabled={isConnected || isConnecting}
							onSelect={selectCoachStyle}
							onSave={saveCustomCoachStyle}
							saveMessage={styleSaveMessage}
						/>
					</div>
				{/if}
			</section>

			<DebugPanel entries={debugEntries} onClear={() => (debugEntries = [])} />
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Pretendard Variable', Pretendard, 'Noto Sans KR', Inter, ui-sans-serif, system-ui,
			-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #eef6f3;
		color: #1f2428;
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

	form {
		margin: 0;
	}

	.recorder-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 40px 18px;
		background:
			linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0 38%, transparent 38%),
			linear-gradient(135deg, #eef6f3 0%, #f8fbff 47%, #fff4ec 100%);
	}

	.recorder-panel {
		width: min(100%, 760px);
		padding: clamp(24px, 5vw, 44px);
		border: 1px solid rgba(35, 65, 70, 0.1);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.9);
		box-shadow:
			0 30px 90px rgba(33, 50, 56, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.72);
		backdrop-filter: blur(18px);
	}

	.account-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 18px;
		color: #5f6970;
		font-size: 0.9rem;
		font-weight: 800;
	}

	.brand-button,
	.menu-button,
	.menu-popover button {
		min-height: 0;
		box-shadow: none;
	}

	.brand-button {
		justify-items: start;
		padding: 0;
		background: transparent;
		color: #1f2428;
		font-size: 1rem;
		font-weight: 950;
	}

	.menu-area {
		position: relative;
	}

	.menu-button {
		width: 36px;
		aspect-ratio: 1;
		display: grid;
		place-content: center;
		gap: 4px;
		border: 0;
		border-radius: 8px;
		background: transparent;
	}

	.menu-button span {
		width: 18px;
		height: 2px;
		border-radius: 999px;
		background: #4d5a60;
	}

	.menu-button:hover {
		background: #edf5f3;
		transform: none;
	}

	.menu-popover {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 10;
		width: min(78vw, 260px);
		overflow: hidden;
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 18px 42px rgba(33, 50, 56, 0.16);
	}

	.menu-popover p {
		margin: 0;
		padding: 14px 16px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.08);
		color: #4d5a60;
		font-size: 0.82rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.menu-popover button {
		width: 100%;
		justify-content: start;
		padding: 13px 16px;
		border-radius: 0;
		background: transparent;
		color: #1f2428;
		font-size: 0.9rem;
		text-align: left;
	}

	.menu-popover button:hover {
		background: #edf5f3;
		color: #187064;
		transform: none;
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
		color: #187064;
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
		background: #edf5f3;
		color: #66737a;
		font-size: 0.76rem;
		font-weight: 900;
		line-height: 1;
	}

	.session-chip.online {
		background: #e6f6f1;
		color: #187064;
	}

	.session-chip.pending {
		background: #fff4e6;
		color: #9a6615;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.15rem, 7vw, 3.55rem);
		line-height: 1.02;
		font-weight: 900;
		overflow-wrap: anywhere;
	}

	.intro p:last-child {
		margin: 0;
		max-width: 620px;
		color: #5f6970;
		font-size: 1.02rem;
		line-height: 1.6;
		text-wrap: balance;
		word-break: keep-all;
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
		background: #1f8b7c;
		color: white;
		box-shadow: 0 14px 34px rgba(31, 139, 124, 0.24);
	}

	.primary:hover {
		background: #176f65;
		transform: translateY(-1px);
		box-shadow: 0 18px 38px rgba(31, 139, 124, 0.28);
	}

	.stop {
		background: #a2362e;
		color: white;
		box-shadow: 0 14px 32px rgba(162, 54, 46, 0.22);
	}

	.stop:hover {
		background: #862c27;
		transform: translateY(-1px);
	}

	.status,
	.error {
		margin: 18px 0 0;
		line-height: 1.58;
		padding: 13px 15px;
		border-radius: 8px;
		font-size: 0.95rem;
		text-align: center;
	}

	.status {
		color: #47605e;
		background: #eef8f5;
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.1);
	}

	.error {
		color: #a2362e;
		background: #fff0ee;
		font-weight: 700;
		box-shadow: inset 0 0 0 1px rgba(162, 54, 46, 0.1);
	}

	.workspace-tabs {
		margin-top: 24px;
		display: grid;
		gap: 16px;
	}

	.tab-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		padding: 6px;
		border-radius: 8px;
		background: rgba(237, 245, 243, 0.7);
		box-shadow: inset 0 0 0 1px rgba(35, 65, 70, 0.08);
	}

	.tab-list button {
		min-height: 42px;
		border-radius: 8px;
		background: transparent;
		color: #66737a;
		box-shadow: none;
		font-size: 0.92rem;
	}

	.tab-list button:hover,
	.tab-list button.active {
		background: white;
		color: #187064;
		box-shadow: 0 8px 22px rgba(33, 50, 56, 0.08);
		transform: none;
	}

	@media (max-width: 560px) {
		.recorder-page {
			padding: 18px 12px;
			place-items: start center;
		}
	}
</style>
