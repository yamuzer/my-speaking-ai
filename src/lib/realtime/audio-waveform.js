export const RESTING_WAVE_BARS = [18, 24, 16, 30, 22, 34, 20, 28, 16, 32, 24, 18];

const WAVE_BAR_COUNT = RESTING_WAVE_BARS.length;

export const createWaveformAnalyzer = (mediaStream, onUpdate) => {
	const audioContext = new AudioContext();
	const analyser = audioContext.createAnalyser();
	let animationFrame;
	let isStopped = false;

	analyser.fftSize = 256;
	analyser.smoothingTimeConstant = 0.68;

	const audioSource = audioContext.createMediaStreamSource(mediaStream);
	const frequencyData = new Uint8Array(analyser.frequencyBinCount);
	const binsPerBar = Math.floor(frequencyData.length / WAVE_BAR_COUNT);

	audioSource.connect(analyser);

	const update = () => {
		if (isStopped) {
			return;
		}

		analyser.getByteFrequencyData(frequencyData);

		const bars = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
			const start = index * binsPerBar;
			const end = index === WAVE_BAR_COUNT - 1 ? frequencyData.length : start + binsPerBar;
			const slice = frequencyData.slice(start, end);
			const average = slice.reduce((total, value) => total + value, 0) / slice.length || 0;

			return Math.round(Math.min(100, Math.max(10, average * 1.45)));
		});

		onUpdate(bars);
		animationFrame = requestAnimationFrame(update);
	};

	update();

	return {
		stop() {
			isStopped = true;
			globalThis.cancelAnimationFrame?.(animationFrame);
			audioSource.disconnect();
			analyser.disconnect();

			if (audioContext.state !== 'closed') {
				void audioContext.close();
			}
		}
	};
};
