export async function saveConversationRecord(session) {
	const response = await fetch('/api/conversation-records', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ session })
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.error ?? '대화 기록 저장에 실패했습니다.');
	}

	return response.json().catch(() => ({ ok: true }));
}
