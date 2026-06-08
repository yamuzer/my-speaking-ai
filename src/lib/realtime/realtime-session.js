const REALTIME_URL = 'https://api.openai.com/v1/realtime/calls';

const getEphemeralKey = async (onDebug, coachStyle) => {
	onDebug?.({
		level: 'event',
		step: 'token.request',
		message: '서버에 Realtime client secret 발급을 요청합니다.'
	});

	const response = await fetch('/api/realtime-token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ coachStyle })
	});
	const data = await response.json();

	if (!response.ok) {
		onDebug?.({
			level: 'error',
			step: 'token.response',
			message: `Client secret 발급 실패: HTTP ${response.status}`,
			detail: data?.error
		});
		throw new Error(data?.error ?? 'Realtime 임시 키를 만들지 못했어요.');
	}

	onDebug?.({
		level: 'success',
		step: 'token.response',
		message: 'Client secret 발급 성공. 키 값은 보안상 표시하지 않습니다.'
	});

	return data.value;
};

export const createRealtimeVoiceSession = async ({ coachStyle, onDebug, onEvent, onLocalStream, onOpen }) => {
	const ephemeralKey = await getEphemeralKey(onDebug, coachStyle);
	onDebug?.({
		level: 'event',
		step: 'webrtc.peer',
		message: 'RTCPeerConnection과 data channel을 생성합니다.'
	});

	const peerConnection = new RTCPeerConnection();
	const dataChannel = peerConnection.createDataChannel('oai-events');
	const remoteAudio = new Audio();

	remoteAudio.autoplay = true;
	remoteAudio.playsInline = true;

	peerConnection.ontrack = (event) => {
		onDebug?.({
			level: 'success',
			step: 'webrtc.remote_audio',
			message: '모델 음성 출력 트랙을 수신했습니다.'
		});
		remoteAudio.srcObject = event.streams[0];
	};

	dataChannel.addEventListener('open', () => {
		onDebug?.({
			level: 'success',
			step: 'data_channel.open',
			message: 'Realtime 이벤트 data channel이 열렸습니다.'
		});
		onOpen?.();
	});

	dataChannel.addEventListener('close', () => {
		onDebug?.({
			level: 'event',
			step: 'data_channel.close',
			message: 'Realtime 이벤트 data channel이 닫혔습니다.'
		});
	});

	dataChannel.addEventListener('error', () => {
		onDebug?.({
			level: 'error',
			step: 'data_channel.error',
			message: 'Realtime 이벤트 data channel에서 오류가 발생했습니다.'
		});
	});

	dataChannel.addEventListener('message', (message) => {
		const event = JSON.parse(message.data);
		onDebug?.({
			level: event.type === 'error' ? 'error' : 'event',
			step: `event.${event.type}`,
			message: 'Realtime 서버 이벤트를 수신했습니다.',
			detail: event.type === 'error' ? JSON.stringify(event.error, null, 2) : undefined
		});
		onEvent?.(event);
	});

	onDebug?.({
		level: 'event',
		step: 'media.request',
		message: '브라우저 마이크 권한을 요청합니다.'
	});

	const stream = await navigator.mediaDevices.getUserMedia({
		audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		}
	});

	onDebug?.({
		level: 'success',
		step: 'media.response',
		message: '마이크 스트림을 가져왔습니다.'
	});

	onLocalStream?.(stream);
	peerConnection.addTrack(stream.getAudioTracks()[0], stream);

	onDebug?.({
		level: 'event',
		step: 'sdp.offer',
		message: 'WebRTC offer SDP를 생성합니다.'
	});

	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);

	onDebug?.({
		level: 'event',
		step: 'sdp.exchange',
		message: 'OpenAI Realtime API에 SDP offer를 전송합니다.'
	});

	const sdpResponse = await fetch(REALTIME_URL, {
		method: 'POST',
		body: offer.sdp,
		headers: {
			Authorization: `Bearer ${ephemeralKey}`,
			'Content-Type': 'application/sdp'
		}
	});

	if (!sdpResponse.ok) {
		const errorText = await sdpResponse.text();
		onDebug?.({
			level: 'error',
			step: 'sdp.exchange',
			message: `SDP 교환 실패: HTTP ${sdpResponse.status}`,
			detail: errorText
		});
		throw new Error(errorText);
	}

	onDebug?.({
		level: 'success',
		step: 'sdp.answer',
		message: 'OpenAI Realtime API에서 SDP answer를 받았습니다.'
	});

	await peerConnection.setRemoteDescription({
		type: 'answer',
		sdp: await sdpResponse.text()
	});

	onDebug?.({
		level: 'success',
		step: 'session.ready',
		message: 'WebRTC Realtime 세션 연결이 완료됐습니다.'
	});

	const inspectClosure = () => {
		const peerConnectionClosed = ['closed', 'failed', 'disconnected'].includes(
			peerConnection.connectionState
		);
		const dataChannelClosed = dataChannel.readyState === 'closed' || dataChannel.readyState === 'closing';
		const localTracksStopped = stream.getTracks().every((track) => track.readyState === 'ended');
		const remoteAudioStopped = !remoteAudio.srcObject;

		return {
			peerConnectionClosed,
			dataChannelClosed,
			localTracksStopped,
			remoteAudioStopped,
			isClosed: peerConnectionClosed && dataChannelClosed && localTracksStopped && remoteAudioStopped
		};
	};

	return {
		close() {
			onDebug?.({
				level: 'event',
				step: 'session.close',
				message: 'Realtime 세션 리소스를 정리합니다.'
			});
			if (dataChannel.readyState !== 'closed') {
				dataChannel.close();
			}
			peerConnection.getSenders().forEach((sender) => {
				sender.track?.stop();
			});
			stream.getTracks().forEach((track) => track.stop());
			remoteAudio.pause();
			remoteAudio.srcObject = null;
			peerConnection.close();

			const closure = inspectClosure();
			onDebug?.({
				level: closure.isClosed ? 'success' : 'event',
				step: 'session.closed_check',
				message: closure.isClosed
					? 'WebRTC, data channel, 마이크 트랙이 모두 종료됐습니다.'
					: '일부 리소스가 아직 종료 중입니다.',
				detail: JSON.stringify(closure, null, 2)
			});

			return closure;
		},
		inspectClosure
	};
};
