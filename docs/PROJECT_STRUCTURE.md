# 📁 프로젝트 구조 (정리 완료)

## 🎯 루트 폴더 구조

```
revu-platform/
│
├── 📂 src/                    # 소스 코드
│   ├── app/                   # Next.js App Router
│   ├── components/            # React 컴포넌트
│   ├── contexts/              # React Context
│   ├── hooks/                 # Custom Hooks
│   ├── lib/                   # 유틸리티 함수
│   ├── types/                 # TypeScript 타입
│   └── middleware.ts          # Next.js 미들웨어
│
├── 📂 public/                 # 정적 파일
│   ├── images/                # 이미지 파일
│   ├── uploads/               # 업로드된 파일
│   └── favicon.ico            # 파비콘
│
├── 📂 prisma/                 # 데이터베이스
│   ├── schema.prisma          # Prisma 스키마
│   └── migrations/            # 마이그레이션 파일
│
├── 📂 scripts/                # 유틸리티 스크립트
│   ├── deploy.sh              # 배포 스크립트
│   └── ...                    # 기타 스크립트
│
├── 📂 docs/                   # 프로젝트 문서
│   ├── ARCHITECTURE.md        # 아키텍처 문서
│   └── ...                    # 기타 문서
│
├── 📂 tests/                  # 테스트 파일
│   └── e2e/                   # E2E 테스트
│
├── 📂 backup/                 # 백업된 파일들 (정리됨)
│   ├── old-docs/              # 기타 문서들
│   ├── test-scripts/          # 테스트 스크립트
│   ├── misc-files/            # 기타 파일들
│   ├── images/                # 불필요한 이미지
│   ├── data-files/            # SQL, 데이터 파일
│   └── shell-scripts/         # 쉘 스크립트
│
├── 📄 package.json            # 프로젝트 설정
├── 📄 tsconfig.json           # TypeScript 설정
├── 📄 tailwind.config.js      # Tailwind CSS 설정
├── 📄 next.config.js          # Next.js 설정
├── 📄 jest.config.js          # Jest 테스트 설정
├── 📄 postcss.config.js       # PostCSS 설정
├── 📄 playwright.config.ts    # Playwright 테스트 설정
│
├── 📄 README.md               # 프로젝트 설명
├── 📄 CONTRIBUTING.md         # 기여 가이드
├── 📄 DEPLOYMENT.md           # 배포 가이드
│
├── 📄 Dockerfile              # Docker 이미지
├── 📄 docker-compose.dev.yml  # Docker Compose 개발
│
├── 📄 .gitignore              # Git 제외 파일
├── 📄 .env.example            # 환경변수 예제
└── 📄 components.json         # 컴포넌트 설정
```

## ✅ 정리 결과

### 이동된 파일 통계
- **이미지 파일**: 3개 → `backup/images/`
- **SQL/데이터 파일**: 2개 → `backup/data-files/`
- **쉘 스크립트**: 2개 → `backup/shell-scripts/`
- **테스트 스크립트**: 12개 → `backup/test-scripts/`
- **기타 스크립트**: 15개 → `backup/misc-files/`
- **문서 파일**: 8개 → `backup/old-docs/`

### 루트 폴더 현황
- **필수 설정 파일**: ✅ 유지
- **소스 코드 폴더**: ✅ 정리됨
- **백업 폴더**: ✅ 체계적으로 구성
- **불필요한 파일**: ❌ 모두 제거

## 📌 주요 파일 위치

### 개발 관련
- **소스 코드**: `/src/`
- **컴포넌트**: `/src/components/`
- **API 라우트**: `/src/app/api/`
- **데이터베이스 스키마**: `/prisma/schema.prisma`

### 설정 파일
- **환경 변수**: `.env.local`, `.env.production`
- **TypeScript**: `tsconfig.json`
- **패키지 관리**: `package.json`

### 문서
- **프로젝트 설명**: `README.md`
- **API 문서**: `SETTLEMENT_API_DOCUMENTATION.md`
- **배포 가이드**: `DEPLOYMENT.md`

## 🚀 새 프로젝트로 이동 시 필요한 파일

### 필수 파일/폴더
```bash
# 핵심 폴더
src/
prisma/
public/
package.json
tsconfig.json
next.config.js (생성 필요)

# 설정 파일
.env.example
.gitignore
tailwind.config.js
postcss.config.js
```

### 선택적 파일
```bash
# 문서
README.md
DEPLOYMENT.md

# 테스트
tests/
jest.config.js

# Docker
Dockerfile
docker-compose.dev.yml
```

---

**정리 완료**: 2025-08-15
**상태**: 루트 폴더가 깔끔하게 정리되어 프로젝트 구조가 명확해졌습니다.