<script>
	let { isOpen = false, policyType = 'privacy' } = $props();

	const policies = {
		privacy: {
			title: '개인정보 처리방침',
			version: '2026-06-08',
			content: `
## 개인정보 처리방침

### 1. 개인정보의 처리 목적
본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행합니다.

- 계정 관리 및 서비스 제공
- 사용자 맞춤형 영어 학습 경험 제공
- 학습 진도 추적 및 성능 분석
- 서비스 품질 개선 및 사용 현황 통계 분석
- 사용자 페르소나 분석을 통한 서비스 최적화

### 2. 처리하는 개인정보의 항목
다음과 같은 개인정보를 처리합니다:

- 계정 정보: 이메일, 이름/닉네임
- 프로필 정보: 연령대, 직업, 영어 수준, 학습 목표, 학습 목적, 연습 빈도
- 학습 기록: 대화 내용, 연습 이력, 성과 데이터
- 서비스 이용 기록: 접속 시간, 기능 사용 현황

### 3. 개인정보 보유 및 이용 기간
개인정보는 수집 목적의 달성 또는 관련 법령의 규정에 의하여 보존할 필요가 있을 때까지 보유 및 이용됩니다. 다만, 관련 법령에서 정한 일정 기간 동안 보존되어야 하는 경우는 해당 기간 동안 보존합니다.

- 계약 또는 약정 해지 시까지: 회원정보
- 3년: 거래 관련 메시지 및 통신 기록

### 4. 개인정보의 제3자 제공
원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외입니다:
- 사용자의 명시적 동의가 있는 경우
- 법령의 규정에 의거하거나 수사 기관의 정당한 요청이 있는 경우
- 기타 법률에서 정한 경우

### 5. 개인정보의 안전성 확보
개인정보의 안전성 확보를 위해 다음과 같은 기술적 조치를 취하고 있습니다:
- SSL 암호화를 통한 안전한 데이터 전송
- 접근 권한 관리 및 정기적 보안 감시
- 개인정보 취급자의 교육 및 관리
- 보안 패치 및 업데이트 정기 적용

### 6. 개인정보 이용자의 권리
이용자는 언제든지 개인정보 공개, 정정, 이용정지, 삭제를 요청할 수 있으며, 요청에 대해 지체 없이 필요한 조치를 이행하겠습니다.

### 7. 개인정보 담당자 및 상담
개인정보에 관한 문의 사항은 다음의 담당자로 연락주시기 바랍니다.
- 담당부서: 고객지원팀
- 연락처: support@speaking-ai.com

### 8. 정책 변경
본 개인정보 처리방침은 법령의 변경이나 회사의 정책 변경에 따라 수정될 수 있습니다. 변경이 있을 시 사전에 공지하여 동의를 구합니다.

최종 수정일: 2026-06-08
			`
		},
		terms: {
			title: '서비스 이용약관',
			version: '2026-06-08',
			content: `
## 서비스 이용약관

### 제1조 목적
본 약관은 실시간 영어 회화 코칭 서비스(이하 "서비스")의 이용 조건 및 절차, 회원과 회사의 권리 의무 관계를 규정하는 것을 목적으로 합니다.

### 제2조 용어의 정의
본 약관에서 사용하는 용어의 정의는 다음과 같습니다:
- "회사": 서비스를 제공하는 사업자
- "회원": 서비스에 가입하여 이용하는 자
- "서비스": 회사가 제공하는 모든 온라인 기반 영어 회화 학습 서비스
- "콘텐츠": 서비스에서 제공되는 모든 형태의 학습 자료 및 데이터

### 제3조 약관의 효력 및 변경
1. 본 약관은 회원이 서비스 가입 시 동의함으로써 효력이 발생합니다.
2. 회사는 합리적인 사유가 있을 때 본 약관을 변경할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다.
3. 회원이 변경된 약관에 동의하지 않으면 서비스 이용을 중단할 수 있습니다.

### 제4조 회원가입 및 계정 관리
1. 회원은 정확한 정보를 제공하여 회원가입을 신청합니다.
2. 회사는 관계 법령에 따라 회원가입 신청을 승인합니다.
3. 회원은 자신의 계정 비밀번호에 대한 보안을 유지해야 하며, 불법 사용에 대해 책임집니다.

### 제5조 서비스 이용 조건
1. 회원은 본 약관을 준수하여 서비스를 이용합니다.
2. 서비스의 이용은 일일 사용 한도 내에서 제공됩니다.
3. API 사용량은 회원의 플랜에 따라 제한될 수 있습니다.

### 제6조 서비스 내용
본 서비스는 다음을 포함합니다:
- 실시간 음성 기반 영어 회화 연습
- 맞춤형 피드백 및 성능 평가
- 학습 기록 저장 및 진도 추적
- 개인 맞춤 학습 추천

### 제7조 이용 요금
1. 서비스 이용에 필요한 요금은 회사에서 정한 바에 따릅니다.
2. 요금은 변경될 수 있으며, 변경 시 사전 공지됩니다.
3. 결제 관련 분쟁은 결제 수단 제공 업체의 규정을 따릅니다.

### 제8조 이용 제한 및 서비스 중단
1. 회사는 다음의 경우 회원의 서비스 이용을 제한할 수 있습니다:
   - 타인의 권리를 침해하거나 법령을 위반하는 경우
   - 서비스의 정상적 운영을 방해하는 경우
   - 부정행위가 적발된 경우

2. 서버 점검, 긴급 상황 등의 이유로 일시적으로 서비스 제공을 중단할 수 있습니다.

### 제9조 회원의 의무
1. 회원은 본 약관의 조항을 준수합니다.
2. 회원은 서비스 이용 과정에서 타인의 권리를 침해하지 않습니다.
3. 회원은 서비스를 상업적 목적으로 무단 이용할 수 없습니다.

### 제10조 책임의 한계
1. 회사는 천재지변, 전쟁, 테러 등 불가항력적 사유로 인한 서비스 중단으로 발생한 손해에 대해 책임지지 않습니다.
2. 회원의 부주의나 서비스 외의 다른 원인으로 발생한 손해는 회사에서 책임지지 않습니다.

### 제11조 분쟁 해결
본 약관과 관련된 분쟁은 대한민국 법을 준거법으로 하며, 관할권은 회사의 본사 소재지 법원에 속합니다.

### 제12조 약관의 해석
본 약관의 해석에 있어 의문이 있을 때는 관계 법령 및 거래 관례에 따라 해석됩니다.

### 제13조 기타
본 약관에서 정하지 아니한 사항은 관계 법령 및 일반 거래 관례에 따릅니다.

최종 수정일: 2026-06-08
			`
		}
	};

	let policy = $derived(policies[policyType] ?? policies.privacy);
	const policyBlocks = $derived(
		policy.content
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				if (line.startsWith('### ')) {
					return { type: 'h3', text: line.slice(4) };
				}

				if (line.startsWith('## ')) {
					return { type: 'h2', text: line.slice(3) };
				}

				if (line.startsWith('- ')) {
					return { type: 'li', text: line.slice(2) };
				}

				return { type: 'p', text: line };
			})
	);

	const handleClose = () => {
		isOpen = false;
	};
</script>

{#if isOpen}
	<div class="policy-modal" role="dialog" aria-modal="true" aria-labelledby="policy-title">
		<button class="backdrop" type="button" onclick={handleClose} aria-label="닫기"></button>
		<div class="modal-content">
			<header>
				<h2 id="policy-title">{policy.title}</h2>
				<button class="close-button" type="button" onclick={handleClose} aria-label="닫기">
					✕
				</button>
			</header>

			<div class="policy-body">
				<div class="version-info">
					<small>버전 {policy.version}</small>
				</div>
				<div class="policy-text">
					{#each policyBlocks as block, index (`${block.type}-${index}-${block.text}`)}
						{#if block.type === 'h2'}
							<h2>{block.text}</h2>
						{:else if block.type === 'h3'}
							<h3>{block.text}</h3>
						{:else if block.type === 'li'}
							<p class="list-item">{block.text}</p>
						{:else}
							<p>{block.text}</p>
						{/if}
					{/each}
				</div>
			</div>

			<footer>
				<button class="close-action-button" type="button" onclick={handleClose}>닫기</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.policy-modal {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: rgba(0, 0, 0, 0.4);
		cursor: pointer;
	}

	.modal-content {
		position: relative;
		display: flex;
		flex-direction: column;
		max-height: 90vh;
		max-width: 600px;
		width: 90%;
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 20px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.12);
	}

	h2 {
		margin: 0;
		color: #1f2428;
		font-size: 1.28rem;
		font-weight: 950;
		flex: 1;
	}

	.close-button {
		min-height: 40px;
		min-width: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		color: #4d5a60;
		font-size: 1.5rem;
		cursor: pointer;
		border-radius: 8px;
		transition: background 0.2s;
	}

	.close-button:hover {
		background: rgba(31, 139, 124, 0.1);
		color: #1f8b7c;
	}

	.policy-body {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
	}

	.version-info {
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(35, 65, 70, 0.08);
	}

	.version-info small {
		color: #66737a;
		font-size: 0.78rem;
	}

	.policy-text {
		color: #1f2428;
		font-size: 0.95rem;
		line-height: 1.6;
		word-break: keep-all;
	}

	.policy-text h2 {
		margin: 18px 0 10px 0;
		color: #1f8b7c;
		font-size: 1.1rem;
		font-weight: 950;
		border-bottom: 2px solid rgba(31, 139, 124, 0.2);
		padding-bottom: 6px;
	}

	.policy-text h3 {
		margin: 14px 0 8px 0;
		color: #187064;
		font-size: 0.98rem;
		font-weight: 900;
	}

	.policy-text p {
		margin: 8px 0;
	}

	.policy-text .list-item {
		position: relative;
		margin-left: 18px;
	}

	.policy-text .list-item::before {
		position: absolute;
		left: -14px;
		content: '-';
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 16px 20px;
		border-top: 1px solid rgba(35, 65, 70, 0.12);
		background: rgba(255, 255, 255, 0.5);
	}

	.close-action-button {
		min-height: 40px;
		padding: 0 20px;
		border: 1px solid rgba(35, 65, 70, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.72);
		color: #4d5a60;
		font: inherit;
		font-weight: 900;
		cursor: pointer;
		transition: background 0.2s;
	}

	.close-action-button:hover {
		background: rgba(31, 139, 124, 0.1);
		color: #1f8b7c;
	}

	@media (max-width: 600px) {
		.modal-content {
			max-height: 95vh;
			width: 95%;
		}

		header {
			padding: 16px;
		}

		h2 {
			font-size: 1.1rem;
		}

		.policy-body {
			padding: 16px;
		}

		.policy-text {
			font-size: 0.9rem;
		}
	}
</style>
