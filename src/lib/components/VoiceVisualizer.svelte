<script>
	import { formatTime } from '$lib/realtime/time.js';

	let { isConnected, isConnecting, elapsedSeconds, waveBars } = $props();
</script>

<div class:recording={isConnected} class:connecting={isConnecting} class="recorder-visual" aria-live="polite">
	<div class="mic-badge" aria-label={isConnected ? '실시간 연결됨' : '마이크 대기 중'}>
		<svg class="mic-icon" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"></path>
			<path d="M19 11a7 7 0 0 1-14 0"></path>
			<path d="M12 18v3"></path>
			<path d="M8 21h8"></path>
		</svg>
	</div>

	<div class="waveform" aria-label="실시간 음성 파형">
		{#each waveBars as height, index (`wave-${index}`)}
			<span style={`--bar-height: ${height}%`}></span>
		{/each}
	</div>

	<div class="meter-copy">
		<p>{isConnecting ? '연결 중' : isConnected ? '대화 중' : '시작 대기'}</p>
		<strong>{formatTime(elapsedSeconds)}</strong>
	</div>
</div>

<style>
	.recorder-visual {
		margin-top: 30px;
		display: grid;
		align-items: center;
		justify-items: center;
		gap: 22px;
		padding: clamp(20px, 4vw, 30px);
		border-radius: 8px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 249, 247, 0.92)),
			#fbfefd;
		border: 1px solid rgba(31, 139, 124, 0.14);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 14px 34px rgba(33, 50, 56, 0.06);
	}

	.mic-badge {
		width: clamp(126px, 28vw, 154px);
		aspect-ratio: 1;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background:
			radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.98), rgba(240, 250, 247, 0.96)),
			white;
		border: 1px solid rgba(31, 139, 124, 0.24);
		box-shadow:
			0 20px 46px rgba(31, 139, 124, 0.15),
			inset 0 0 0 10px rgba(31, 139, 124, 0.055);
	}

	.mic-icon {
		width: 76px;
		height: 76px;
		fill: none;
		stroke: #1f8b7c;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.9;
	}

	.recording .mic-badge,
	.connecting .mic-badge {
		animation: mic-pulse 1.15s ease-in-out infinite;
	}

	.waveform {
		width: min(100%, 360px);
		height: 112px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 18px 24px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(241, 249, 247, 0.78)),
			white;
		border-radius: 8px;
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.08);
	}

	.waveform span {
		width: 9px;
		height: var(--bar-height);
		min-height: 14px;
		border-radius: 999px;
		background: linear-gradient(180deg, #61c8b7, #1f8b7c);
		opacity: 0.5;
		transform-origin: center;
		transition: height 90ms linear;
	}

	.recording .waveform span {
		opacity: 1;
	}

	.meter-copy {
		text-align: center;
	}

	.meter-copy p,
	.meter-copy strong {
		margin: 0;
	}

	.meter-copy p {
		color: #5f6970;
		font-size: 0.92rem;
		font-weight: 850;
	}

	.meter-copy strong {
		display: block;
		font-size: 2.08rem;
		line-height: 1.1;
		font-weight: 870;
		font-variant-numeric: tabular-nums;
	}

	@keyframes mic-pulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow:
				0 20px 46px rgba(31, 139, 124, 0.15),
				0 0 0 0 rgba(31, 139, 124, 0.23);
		}

		50% {
			transform: scale(1.06);
			box-shadow:
				0 20px 46px rgba(31, 139, 124, 0.18),
				0 0 0 18px rgba(31, 139, 124, 0);
		}
	}
</style>
