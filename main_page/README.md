# Main Page Template - 다국어 지원 관리자 시스템

## 개요

이 템플릿은 다국어 지원과 UI 설정이 가능한 관리자 시스템을 포함한 Next.js 기반의 웹 애플리케이션 템플릿입니다.

## 주요 기능

### 1. 다국어 지원 시스템
- **10개 언어 지원**: 한국어, 영어, 일본어, 중국어, 스페인어, 포르투갈어, 프랑스어, 독일어, 이탈리아어, 러시아어
- **실시간 언어 전환**: 사용자가 선택한 언어로 즉시 전환
- **관리자 번역 관리**: 어드민 페이지에서 모든 텍스트 번역 관리
- **자동 번역 지원**: Google Translate API 연동 (옵션)
- **언어팩 시스템**: 네임스페이스별 언어팩 관리

### 2. UI 설정 시스템
- **동적 섹션 관리**: UI 섹션 추가/수정/삭제
- **컴포넌트 설정**: 각 컴포넌트의 속성 설정
- **스타일 커스터마이징**: JSON 기반 스타일 설정
- **실시간 미리보기**: 변경사항 즉시 확인

### 3. 관리자 기능
- **번역 관리**: 모든 UI 텍스트 번역 관리
- **언어팩 관리**: 언어별 텍스트 일괄 관리
- **UI 섹션 관리**: 페이지 구성 요소 관리
- **메뉴 관리**: 네비게이션 메뉴 설정
- **시스템 설정**: 전역 설정 관리

## 설치 방법

### 1. 의존성 설치
```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Google Translate API (선택사항)
GOOGLE_TRANSLATE_API_KEY="your-api-key"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 3. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# (선택사항) Prisma Studio 실행
npx prisma studio
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 프로젝트 구조

```
main_page/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # 관리자 페이지
│   │   │   ├── translations/     # 번역 관리
│   │   │   ├── language-packs/   # 언어팩 관리
│   │   │   └── ui-config/        # UI 설정 관리
│   │   ├── api/                  # API 라우트
│   │   │   ├── admin/            # 관리자 API
│   │   │   ├── language-packs/   # 언어팩 API
│   │   │   └── ui-config/        # UI 설정 API
│   │   └── page.tsx              # 메인 페이지
│   ├── components/               # React 컴포넌트
│   │   ├── admin/               # 관리자 컴포넌트
│   │   ├── ui/                  # UI 컴포넌트
│   │   ├── Header.tsx           # 헤더
│   │   ├── Footer.tsx           # 푸터
│   │   └── LanguageSelector.tsx # 언어 선택기
│   ├── contexts/                # React Context
│   │   └── LanguageContext.tsx  # 언어 Context
│   ├── lib/                     # 유틸리티
│   │   ├── services/            # 서비스 레이어
│   │   │   ├── translation.service.ts
│   │   │   └── google-translate.service.ts
│   │   └── utils/               # 유틸리티 함수
│   │       └── language.ts      # 언어 관련 유틸
│   └── styles/                  # 스타일 파일
├── prisma/
│   └── schema.prisma            # Prisma 스키마
├── public/                      # 정적 파일
├── package.json                 # 프로젝트 설정
└── README.md                    # 문서

```

## 주요 컴포넌트

### LanguageContext
언어 설정을 전역적으로 관리하는 Context Provider

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div>
      <p>{t('welcome')}</p>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
```

### LanguageSelector
언어 선택 드롭다운 컴포넌트

```tsx
import LanguageSelector from '@/components/LanguageSelector';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

### AdminLayout
관리자 페이지 레이아웃

```tsx
import AdminLayout from '@/components/admin/AdminLayout';

function AdminPage() {
  return (
    <AdminLayout>
      {/* 관리자 콘텐츠 */}
    </AdminLayout>
  );
}
```

## API 엔드포인트

### 언어팩 API
- `GET /api/language-packs` - 언어팩 목록 조회
- `POST /api/language-packs` - 언어팩 생성
- `PUT /api/language-packs/[id]` - 언어팩 수정
- `DELETE /api/language-packs/[id]` - 언어팩 삭제

### UI 설정 API
- `GET /api/ui-config` - UI 설정 조회
- `POST /api/ui-config` - UI 설정 생성
- `PUT /api/ui-config/[id]` - UI 설정 수정
- `DELETE /api/ui-config/[id]` - UI 설정 삭제

### 번역 API
- `GET /api/admin/translations` - 번역 목록 조회
- `POST /api/admin/translations` - 번역 생성/수정
- `GET /api/admin/translations/settings` - 번역 설정 조회
- `PUT /api/admin/translations/settings` - 번역 설정 수정

## 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `ui_sections` - UI 섹션 설정
- `ui_texts` - UI 텍스트 (다국어)
- `language_packs` - 언어팩 데이터
- `translation_settings` - 번역 설정
- `menu_items` - 메뉴 아이템
- `system_configs` - 시스템 설정

## 커스터마이징

### 새로운 언어 추가
1. `src/lib/utils/language.ts`에서 언어 목록에 추가
2. 관리자 페이지에서 새 언어로 번역 추가
3. `TranslationSettings`에서 활성화

### UI 섹션 추가
1. 관리자 페이지에서 새 섹션 생성
2. 필요한 텍스트와 스타일 설정
3. 컴포넌트에서 해당 섹션 데이터 사용

### 메뉴 항목 추가
1. 데이터베이스에 `MenuItem` 추가
2. 다국어 라벨 설정
3. 권한 및 표시 조건 설정

## 보안 고려사항

- JWT 토큰 기반 인증
- 환경 변수로 민감한 정보 관리
- SQL Injection 방지 (Prisma ORM)
- XSS 방지 (React 자동 이스케이핑)
- CORS 설정
- Rate Limiting (추가 구현 필요)

## 성능 최적화

- 언어팩 캐싱
- 정적 생성 (SSG) 활용
- 이미지 최적화
- 코드 스플리팅
- 번들 사이즈 최적화

## 배포

### Vercel 배포
```bash
vercel
```

### Docker 배포
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 문제 해결

### 데이터베이스 연결 오류
- DATABASE_URL 환경 변수 확인
- PostgreSQL 서버 실행 상태 확인
- 네트워크 연결 확인

### 번역이 표시되지 않음
- 언어팩 데이터 존재 여부 확인
- LanguageContext Provider 래핑 확인
- 브라우저 캐시 초기화

### 관리자 페이지 접근 불가
- 사용자 권한 확인 (UserType.ADMIN)
- JWT 토큰 유효성 확인
- 미들웨어 설정 확인

## 라이선스

MIT License

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.