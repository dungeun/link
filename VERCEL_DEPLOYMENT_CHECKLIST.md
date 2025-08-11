# Vercel 배포 체크리스트

프로젝트 URL: https://vercel.com/cheon43-gmailcoms-projects/link

## ✅ 완료된 작업

- [x] Supabase 프로젝트 생성
- [x] Redis Cloud 설정
- [x] 환경변수 파일 생성 (`.env.production`)
- [x] `vercel.json` 설정 파일 생성
- [x] Prisma schema에 `directUrl` 추가
- [x] GitHub 브랜치 생성 (`vercel-deployment`)

## 📋 Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 추가해야 합니다:

### 1. Supabase Database
```
DATABASE_URL = postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL = postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### 2. Supabase API Keys
```
NEXT_PUBLIC_SUPABASE_URL = https://hibktfylqdamdzigznkt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjIzODQsImV4cCI6MjA2ODIzODM4NH0.FzlCpOSA2qV_gjAbUOEnSQ62O8F73InDAJj_oTyJ2VE
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdDE7NTI2NjIzODQsImV4cCI6MjA2ODIzODM4NH0.LLIFiN0-lLZp9lryWhOnh4rHDbLGKdGeG9lCCIqVv1s
```

### 3. Redis Cloud
```
REDIS_URL = redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395
KV_URL = redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395
```

### 4. JWT Secrets (⚠️ 변경 필요!)
```
JWT_SECRET = [강력한 랜덤 문자열로 변경 필요]
JWT_REFRESH_SECRET = [다른 강력한 랜덤 문자열로 변경 필요]
```

**JWT Secret 생성 방법:**
```bash
openssl rand -base64 32
```

### 5. Toss Payments
```
TOSS_SECRET_KEY = test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
NEXT_PUBLIC_TOSS_CLIENT_KEY = test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

### 6. Application URLs
```
NEXT_PUBLIC_API_URL = https://link-coral-nine.vercel.app
NEXT_PUBLIC_APP_URL = https://link-coral-nine.vercel.app
```

### 7. Environment
```
NODE_ENV = production
NEXT_TELEMETRY_DISABLED = 1
```

## 🚀 배포 단계

### 1. Vercel에서 환경변수 설정
1. https://vercel.com/cheon43-gmailcoms-projects/link/settings/environment-variables 접속
2. 위의 모든 환경변수 추가
3. "Production", "Preview", "Development" 모두 체크

### 2. 데이터베이스 마이그레이션
로컬에서 실행:
```bash
# 환경변수 설정
export DATABASE_URL="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
export DIRECT_URL="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# 스키마 푸시
npx prisma db push

# 또는 마이그레이션 실행
npx prisma migrate deploy
```

### 3. 초기 데이터 시딩
```bash
# 샘플 데이터 생성
npm run db:seed-korean

# 관리자 계정 생성
npm run db:seed-real
```

### 4. 배포 트리거
```bash
# Git push로 자동 배포
git push origin vercel-deployment

# 또는 Vercel CLI로 수동 배포
vercel --prod
```

## 🔍 배포 후 확인사항

### 1. 기본 동작 확인
- [ ] 홈페이지 로딩 확인
- [ ] 로그인/회원가입 동작 확인
- [ ] 캠페인 목록 표시 확인

### 2. 데이터베이스 연결
- [ ] Supabase 대시보드에서 연결 확인
- [ ] Prisma Studio로 데이터 확인: `npx prisma studio`

### 3. Redis 캐시
- [ ] Redis Cloud 대시보드에서 연결 확인
- [ ] 캐시 동작 확인

### 4. 이미지 업로드
- [ ] 프로필 이미지 업로드 테스트
- [ ] 캠페인 이미지 업로드 테스트

### 5. 결제 시스템
- [ ] Toss Payments 테스트 결제 확인

## ⚠️ 주의사항

1. **JWT Secret 변경 필수**: 프로덕션 배포 전 반드시 강력한 랜덤 문자열로 변경
2. **Toss Payments**: 현재 테스트 키 사용 중, 실제 운영시 라이브 키로 변경 필요
3. **도메인 설정**: 커스텀 도메인 사용시 Vercel 대시보드에서 설정 필요
4. **CORS 설정**: 필요시 `vercel.json`에서 CORS 헤더 추가

## 📞 문제 발생시

### 빌드 에러
- Vercel 대시보드의 Build Logs 확인
- `prisma generate` 명령이 빌드 커맨드에 포함되어 있는지 확인

### 데이터베이스 연결 실패
- Connection Pooling URL 사용 여부 확인 (`?pgbouncer=true`)
- Supabase 대시보드에서 연결 상태 확인

### 500 에러
- Vercel Functions 로그 확인
- 환경변수가 모두 설정되어 있는지 확인

## 📚 참고 문서
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Prisma + Supabase 가이드](https://supabase.com/partners/integrations/prisma)
- [Redis Cloud 문서](https://redis.com/redis-enterprise-cloud/)