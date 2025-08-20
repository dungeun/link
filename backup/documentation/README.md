# LinkPick - 인플루언서 마케팅 플랫폼

<div align="center">
  <img src="/public/logo.svg" alt="LinkPick Logo" width="200"/>
  
  **AI 기반 인플루언서 마케팅 매칭 플랫폼**
  
  [![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
  [![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
</div>

## 📋 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [환경 변수](#-환경-변수)
- [데이터베이스](#-데이터베이스)
- [배포](#-배포)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

## 🎯 소개

LinkPick은 브랜드와 인플루언서를 연결하는 AI 기반 마케팅 플랫폼입니다. 정밀한 매칭 알고리즘을 통해 최적의 파트너를 찾고, 투명한 성과 분석으로 캠페인의 성공을 보장합니다.

### 핵심 가치

- **🤖 AI 기반 매칭**: 브랜드 특성과 타겟 오디언스를 분석하여 최적의 인플루언서 추천
- **📊 실시간 성과 분석**: 캠페인 진행 상황과 ROI를 실시간으로 추적
- **🔒 안전한 에스크로**: 캠페인 완료 시까지 대금을 안전하게 보관
- **💬 원활한 커뮤니케이션**: 실시간 메시징과 협업 도구 제공

## ✨ 주요 기능

### 브랜드를 위한 기능

- **캠페인 관리**: 캠페인 생성, 수정, 모니터링
- **인플루언서 검색**: 카테고리, 팔로워 수, 참여율 기반 검색
- **성과 분석**: 실시간 통계 및 ROI 분석
- **결제 관리**: 안전한 에스크로 시스템

### 인플루언서를 위한 기능

- **캠페인 탐색**: 맞춤형 캠페인 추천
- **포트폴리오 관리**: 프로필 및 콘텐츠 관리
- **수익 관리**: 투명한 정산 시스템
- **성장 도구**: 참여율 분석 및 성장 가이드

### 관리자 기능

- **사용자 관리**: 회원 승인 및 상태 관리
- **캠페인 검토**: 캠페인 승인 및 모니터링
- **통계 대시보드**: 플랫폼 전체 통계
- **UI 설정**: 동적 UI 구성 관리

## 🛠 기술 스택

### Frontend

- **Framework**: Next.js 14.2.0 (App Router)
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.0
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand 4.4.7
- **API Client**: Axios + React Query

### Backend

- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (자체 구현)
- **Caching**: Redis (ioredis)
- **File Upload**: Local Storage / Cloud Storage

### DevOps

- **Container**: Docker
- **Development**: Docker Compose
- **Type Checking**: TypeScript
- **Linting**: ESLint + Next.js config

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- PostgreSQL 15 이상
- Redis 7.0 이상 (선택사항)
- pnpm 또는 npm

### 설치

1. **저장소 클론**

```bash
git clone https://github.com/your-org/revu-platform.git
cd revu-platform
```

2. **의존성 설치**

```bash
pnpm install
# 또는
npm install
```

3. **환경 변수 설정**

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 필요한 환경 변수를 설정합니다.

4. **데이터베이스 설정**

```bash
# Docker를 사용하는 경우
docker-compose -f docker-compose.dev.yml up -d

# 데이터베이스 마이그레이션
pnpm prisma migrate dev

# 시드 데이터 추가 (선택사항)
pnpm db:seed
```

5. **개발 서버 실행**

```bash
pnpm dev
# 또는
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 빠른 시작 (Docker)

```bash
# 개발 환경 전체 실행
docker-compose -f docker-compose.dev.yml up

# 백그라운드 실행
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 프로젝트 구조

```
revu-platform/
├── prisma/              # Prisma 스키마 및 마이그레이션
│   ├── schema.prisma    # 데이터베이스 스키마
│   └── migrations/      # 마이그레이션 파일
├── public/              # 정적 파일
├── src/                 # 소스 코드
│   ├── app/            # Next.js App Router
│   │   ├── (auth)/     # 인증 페이지
│   │   ├── admin/      # 관리자 페이지
│   │   ├── api/        # API 라우트
│   │   ├── business/   # 비즈니스 페이지
│   │   └── campaigns/  # 캠페인 페이지
│   ├── components/     # React 컴포넌트
│   ├── hooks/          # Custom React Hooks
│   ├── lib/            # 유틸리티 및 라이브러리
│   │   ├── auth/       # 인증 관련
│   │   ├── cache/      # Redis 캐싱
│   │   ├── db/         # 데이터베이스 연결
│   │   └── services/   # 비즈니스 로직
│   └── types/          # TypeScript 타입 정의
├── .env.example        # 환경 변수 예제
├── docker-compose.dev.yml # 개발 환경 Docker 설정
├── next.config.js      # Next.js 설정
├── package.json        # 프로젝트 의존성
└── tsconfig.json       # TypeScript 설정
```

## 📚 API 문서

### 인증 API

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "type": "INFLUENCER" | "BUSINESS"
}
```

### 캠페인 API

#### 캠페인 목록 조회
```http
GET /api/campaigns?page=1&limit=10&filter=active
```

#### 캠페인 상세 조회
```http
GET /api/campaigns/:id
```

#### 캠페인 생성 (비즈니스)
```http
POST /api/business/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "신제품 런칭 캠페인",
  "description": "...",
  "platform": "Instagram",
  "budget": 1000000,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

> 📖 전체 API 문서는 개발 서버 실행 후 `/api-docs`에서 확인할 수 있습니다.

## 🔐 환경 변수

`.env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/linkpick"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key"

# Redis (선택사항)
REDIS_URL="redis://localhost:6379"

# Application
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🗄 데이터베이스

### 주요 모델

- **User**: 사용자 (인플루언서, 비즈니스, 관리자)
- **Profile**: 인플루언서 프로필
- **BusinessProfile**: 비즈니스 프로필
- **Campaign**: 캠페인 정보
- **CampaignApplication**: 캠페인 지원
- **Payment**: 결제 정보
- **Settlement**: 정산 정보

### 마이그레이션

```bash
# 새 마이그레이션 생성
pnpm prisma migrate dev --name feature_name

# 마이그레이션 적용
pnpm prisma migrate deploy

# 데이터베이스 리셋
pnpm prisma migrate reset
```

## 🚢 배포

### Vercel 배포

#### 1. 환경 변수 설정 (필수)

⚠️ **중요**: 환경 변수가 없으면 빌드가 실패합니다!

```bash
# 시크릿 키 생성
node scripts/generate-secrets.js
```

생성된 키들을 Vercel 대시보드에 추가:
1. https://vercel.com 로그인
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 필수 변수 추가:
   - `JWT_SECRET` (생성된 값 사용)
   - `JWT_REFRESH_SECRET` (생성된 값 사용)
   - `DATABASE_URL` (Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

📖 자세한 가이드: [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)

#### 2. 배포 실행

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod

# 또는 Git Push로 자동 배포
git push origin main
```

### Docker 배포

```bash
# 프로덕션 이미지 빌드
docker build -t linkpick:latest .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env.production linkpick:latest
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코드 스타일

- ESLint 규칙을 준수합니다
- TypeScript strict mode를 사용합니다
- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- 이메일: support@linkpick.com
- 웹사이트: https://linkpick.com
- GitHub Issues: https://github.com/your-org/revu-platform/issues

---

<div align="center">
  Made with ❤️ by LinkPick Team
</div>