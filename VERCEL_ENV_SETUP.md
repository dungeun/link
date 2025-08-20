# Vercel 환경 변수 설정 가이드

## 필수 환경 변수 목록

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Database (Supabase)
```
DATABASE_URL=postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### 2. JWT 인증
```
JWT_SECRET=LinkPickPlatform2024!SuperSecretJWTKey#RevuPlatformProduction$
JWT_REFRESH_SECRET=LinkPickPlatform2024!RefreshSecretKey#RevuPlatformRefresh$
```

### 3. Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://hibktfylqdamdzigznkt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjIzODQsImV4cCI6MjA2ODIzODM4NH0.FzlCpOSA2qV_gjAbUOEnSQ62O8F73InDAJj_oTyJ2VE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2MjM4NCwiZXhwIjoyMDY4MjM4Mzg0fQ.LLIFiN0-lLZp9lryWhOnh4rHDbLGKdGeG9lCCIqVv1s
```

### 4. Toss Payments
```
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

### 5. Redis
```
REDIS_URL=redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395
KV_URL=redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395
```

### 6. Application
```
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 7. Vercel Blob Storage
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_I3OTDOKFZvApv5dF_EIJqUWcncdb0ADYIyF9GdakWxrKOoz
```

### 8. Performance & Logging
```
LOG_LEVEL=silent
NEXT_PUBLIC_LOG_LEVEL=silent
DISABLE_CONSOLE_LOG=true
ENABLE_CACHE=true
CACHE_TTL=3600
```

## 설정 방법

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings 탭 클릭
4. Environment Variables 섹션으로 이동
5. 위의 각 환경 변수를 추가:
   - Key: 변수명 (예: JWT_SECRET)
   - Value: 변수값
   - Environment: Production, Preview, Development 모두 선택
6. "Save" 클릭

## 중요 사항

⚠️ **보안 주의사항:**
- 이 파일은 GitHub에 커밋하지 마세요
- 환경 변수는 Vercel 대시보드에서만 설정하세요
- Production 환경에서는 실제 값으로 변경 필요:
  - `NEXT_PUBLIC_API_URL`과 `NEXT_PUBLIC_APP_URL`을 실제 도메인으로 변경
  - Toss Payments는 실제 운영 키로 변경 (현재는 테스트 키)

## 환경 변수 설정 후

1. Vercel에서 자동으로 재배포가 시작됩니다
2. 재배포가 완료되면 사이트가 정상 작동합니다

## 문제 해결

만약 여전히 오류가 발생한다면:
1. 모든 환경 변수가 정확히 입력되었는지 확인
2. Vercel 대시보드에서 "Redeploy" 클릭
3. Function Logs에서 오류 메시지 확인