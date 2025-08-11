# Vercel 배포 가이드

## 1. 사전 준비사항

### 필수 서비스
- **Vercel 계정**: https://vercel.com 가입
- **데이터베이스**: Supabase (https://supabase.com)
  - 무료 플랜: 500MB, 2개 프로젝트
  - Connection Pooling 지원
- **Redis**: 다음 중 선택
  - Vercel KV (추천)
  - Upstash Redis

## 2. 프로젝트 설정

### 2.1 GitHub 연동
1. GitHub에 프로젝트 푸시
2. Vercel 대시보드에서 "New Project" 클릭
3. GitHub 저장소 선택

### 2.2 프로젝트 설정
- **Framework Preset**: Next.js
- **Root Directory**: ./
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 3. 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가:

### 필수 환경 변수

```bash
# Supabase 데이터베이스
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase API (선택사항 - Storage, Realtime 사용시)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# JWT 인증
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters"

# Toss Payments
TOSS_SECRET_KEY="test_sk_your_secret_key"
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_your_client_key"

# 애플리케이션 URL
NEXT_PUBLIC_API_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# 환경 설정
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
```

### Vercel KV 사용시 (자동 추가됨)
```bash
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

### Upstash Redis 사용시
```bash
REDIS_URL="redis://default:password@host:6379"
```

### 선택 사항
```bash
# Google Translate API
GOOGLE_TRANSLATE_API_KEY="your-api-key"
```

## 4. 데이터베이스 설정 (Supabase)

### 4.1 Supabase 프로젝트 생성
1. https://supabase.com 에서 프로젝트 생성
2. Settings → Database에서 Connection String 복사
3. Connection Pooling (Transaction Mode) URL 사용

### 4.2 Prisma 설정
`prisma/schema.prisma`에 directUrl 추가:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4.3 데이터베이스 마이그레이션
배포 후 터미널에서:
```bash
npx prisma db push --accept-data-loss
# 또는
npx prisma migrate deploy
```

## 5. Redis 캐시 설정

### 5.1 Vercel KV 사용시 (추천)
1. Vercel 대시보드 → Storage → Create Database
2. KV 선택
3. 자동으로 환경 변수 추가됨

### 5.2 Upstash Redis 사용시
1. https://upstash.com 에서 Redis 생성
2. 연결 정보를 REDIS_URL에 설정

## 6. 배포

### 6.1 자동 배포
- main/master 브랜치에 푸시하면 자동 배포
- Pull Request 생성시 Preview 배포 생성

### 6.2 수동 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# Production 배포
vercel --prod
```

## 7. 배포 후 설정

### 7.1 도메인 설정
1. Vercel 대시보드 → Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 (CNAME 또는 A 레코드)

### 7.2 데이터 시딩
```bash
# 로컬에서 Production DB에 연결
DATABASE_URL="your-production-db-url" npm run db:seed
```

### 7.3 관리자 계정 생성
```bash
# 로컬에서 실행
DATABASE_URL="your-production-db-url" ts-node prisma/seed-real-accounts.ts
```

## 8. 모니터링

### 8.1 Vercel Analytics
- 프로젝트 → Analytics 탭에서 확인
- Web Vitals, 트래픽 모니터링

### 8.2 로그 확인
- Functions 탭에서 API 로그 확인
- Runtime Logs에서 에러 확인

## 9. 트러블슈팅

### 빌드 실패시
- `prisma generate` 명령이 build command에 포함되어 있는지 확인
- Node.js 버전 확인 (18.x 이상)

### 데이터베이스 연결 실패
- DATABASE_URL의 SSL 설정 확인
- IP 화이트리스트 확인 (외부 DB 사용시)

### 이미지 업로드 문제
- Vercel은 임시 파일 시스템만 제공
- 영구 저장소는 S3, Cloudinary 등 사용 필요

### Function 타임아웃
- 기본 10초, Pro 플랜 60초 제한
- vercel.json에서 maxDuration 설정

## 10. 성능 최적화

### 10.1 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 포맷 자동 변환

### 10.2 캐싱 전략
- Vercel KV로 API 응답 캐싱
- Static Generation 활용

### 10.3 Edge Functions
- 지역별 엣지 실행으로 레이턴시 감소
- middleware.ts 활용

## 11. 보안 설정

### 11.1 환경 변수 보안
- Production 환경 변수는 암호화 저장
- Preview 배포용 별도 환경 변수 설정 가능

### 11.2 CORS 설정
- vercel.json의 headers 섹션 활용
- API 라우트별 CORS 설정

## 12. 비용 관리

### 무료 플랜 제한
- 100GB 대역폭/월
- 100시간 빌드 시간/월
- 1000개 이미지 최적화/월

### Pro 플랜 ($20/월)
- 1TB 대역폭/월
- 400시간 빌드 시간/월
- Function 실행 시간 60초

## 참고 링크
- [Vercel 문서](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)