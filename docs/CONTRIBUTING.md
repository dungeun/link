# 🤝 LinkPick 기여 가이드

LinkPick 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 📋 목차

- [행동 강령](#행동-강령)
- [기여 방법](#기여-방법)
- [개발 환경 설정](#개발-환경-설정)
- [코드 스타일](#코드-스타일)
- [커밋 메시지 규칙](#커밋-메시지-규칙)
- [Pull Request 프로세스](#pull-request-프로세스)
- [이슈 제출](#이슈-제출)

## 행동 강령

이 프로젝트는 모든 참여자가 존중받고 환영받는 환경을 만들기 위해 노력합니다. 모든 기여자는 다음을 준수해야 합니다:

- 서로를 존중하고 예의 바르게 대하기
- 건설적인 비평과 피드백 제공하기
- 다양성과 포용성을 존중하기

## 기여 방법

### 1. 이슈 확인

- 기존 이슈를 확인하여 중복되지 않도록 합니다
- 작업하고 싶은 이슈가 있다면 댓글로 알려주세요
- 새로운 기능이나 버그를 발견했다면 이슈를 생성해주세요

### 2. Fork & Clone

```bash
# 저장소 Fork
# GitHub에서 Fork 버튼 클릭

# Fork한 저장소 클론
git clone https://github.com/YOUR_USERNAME/revu-platform.git
cd revu-platform

# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/original-org/revu-platform.git
```

### 3. 브랜치 생성

```bash
# 최신 코드 동기화
git checkout main
git pull upstream main

# 새 브랜치 생성
git checkout -b feature/your-feature-name
# 또는
git checkout -b fix/bug-description
```

## 개발 환경 설정

### 필수 도구

- Node.js 18.0.0+
- pnpm 또는 npm
- Docker & Docker Compose (선택사항)
- VS Code (권장)

### VS Code 확장 프로그램

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 초기 설정

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local

# 데이터베이스 시작 (Docker)
docker-compose -f docker-compose.dev.yml up -d

# 데이터베이스 마이그레이션
pnpm prisma migrate dev

# 개발 서버 시작
pnpm dev
```

## 코드 스타일

### TypeScript

- Strict mode 사용
- 명시적 타입 선언 권장
- any 타입 사용 금지

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### React/Next.js

- 함수형 컴포넌트 사용
- Custom hooks는 `use` 접두사 사용
- Props interface 명시적 선언

```typescript
// ✅ Good
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={styles[variant]}>
      {label}
    </button>
  )
}
```

### Prisma

- 모델명은 PascalCase
- 필드명은 camelCase
- 관계 설정 시 명시적 이름 사용

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  profile   Profile?
  campaigns Campaign[] @relation("UserCampaigns")
}
```

### CSS/Tailwind

- Tailwind 클래스 우선 사용
- 커스텀 CSS는 모듈 CSS 사용
- 반응형 디자인 필수

```tsx
// ✅ Good
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
    제목
  </h1>
</div>
```

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다.

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

### 예시

```bash
feat(auth): JWT 리프레시 토큰 구현

- 리프레시 토큰 발급 및 검증 로직 추가
- 토큰 만료 시 자동 갱신 기능 구현
- Redis를 사용한 토큰 블랙리스트 관리

Closes #123
```

## Pull Request 프로세스

### 1. PR 전 체크리스트

- [ ] 코드가 로컬에서 정상 작동하는가?
- [ ] 모든 테스트가 통과하는가?
- [ ] TypeScript 타입 체크가 통과하는가?
- [ ] ESLint 규칙을 준수하는가?
- [ ] 커밋 메시지가 규칙을 따르는가?

```bash
# 체크 명령어
pnpm type-check
pnpm lint
pnpm test
```

### 2. PR 생성

```markdown
## 변경 사항
- 구체적인 변경 내용 설명

## 관련 이슈
Closes #123

## 테스트
- [ ] 단위 테스트 추가/수정
- [ ] 통합 테스트 추가/수정
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경 시)
변경 전/후 스크린샷

## 체크리스트
- [ ] 코드 리뷰 요청 전 자체 리뷰 완료
- [ ] 문서 업데이트 필요 여부 확인
- [ ] Breaking change 여부 확인
```

### 3. 코드 리뷰

- 리뷰어의 피드백에 적극적으로 응답
- 요청된 변경사항 반영
- 필요시 추가 설명 제공

## 이슈 제출

### 버그 리포트

```markdown
## 버그 설명
버그에 대한 명확한 설명

## 재현 방법
1. '...' 페이지로 이동
2. '...' 버튼 클릭
3. '...' 입력
4. 오류 발생

## 예상 동작
정상적으로 작동했을 때의 예상 결과

## 스크린샷
가능하다면 스크린샷 첨부

## 환경
- OS: [예: macOS 12.0]
- 브라우저: [예: Chrome 100]
- Node.js 버전: [예: 18.0.0]
```

### 기능 제안

```markdown
## 기능 설명
제안하는 기능에 대한 명확한 설명

## 해결하려는 문제
이 기능이 해결하려는 문제나 필요성

## 제안하는 해결책
구체적인 구현 방안 (선택사항)

## 대안
고려해본 다른 방법들
```

## 도움 요청

질문이나 도움이 필요하시면:

- GitHub Issues에 질문 남기기
- 디스코드 채널 참여 (준비 중)
- 이메일: dev@linkpick.com

감사합니다! 🙏