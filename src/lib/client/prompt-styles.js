export async function savePromptStyle(style) {
	const response = await fetch('/api/prompt-styles', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ style })
	});
	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.error ?? '프롬프트 스타일 저장에 실패했습니다.');
	}

	return data.style ?? style;
}
