<script>
	let { check } = $props();
</script>

{#if check}
	<section class:closed={check.isClosed} class="safety-status" aria-label="연결 종료 확인">
		<div>
			<strong>{check.isClosed ? '연결이 완전히 종료됐어요' : '연결 종료를 확인하는 중이에요'}</strong>
			<p>{check.message}</p>
		</div>
		<ul>
			<li class:ok={check.peerConnectionClosed}>WebRTC 연결</li>
			<li class:ok={check.dataChannelClosed}>이벤트 채널</li>
			<li class:ok={check.localTracksStopped}>마이크 입력</li>
			<li class:ok={check.remoteAudioStopped}>응답 오디오</li>
		</ul>
	</section>
{/if}

<style>
	.safety-status {
		margin-top: 16px;
		display: grid;
		gap: 12px;
		padding: 14px;
		border-radius: 8px;
		background: #fff7eb;
		box-shadow: inset 0 0 0 1px rgba(154, 102, 21, 0.14);
	}

	.safety-status.closed {
		background: #eef8f5;
		box-shadow: inset 0 0 0 1px rgba(31, 139, 124, 0.14);
	}

	strong {
		display: block;
		color: #1f2428;
	}

	p {
		margin: 4px 0 0;
		color: #5f6970;
		line-height: 1.55;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		min-height: 34px;
		display: flex;
		align-items: center;
		padding: 0 10px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.72);
		color: #766445;
		font-size: 0.86rem;
		font-weight: 850;
	}

	li::before {
		content: '';
		width: 8px;
		aspect-ratio: 1;
		margin-right: 8px;
		border-radius: 50%;
		background: #d39c24;
	}

	li.ok {
		color: #187064;
	}

	li.ok::before {
		background: #1f8b7c;
	}

	@media (max-width: 520px) {
		ul {
			grid-template-columns: 1fr;
		}
	}
</style>
