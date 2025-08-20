# Vercel 환경 변수 설정 가이드

## 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 선택
3. Settings → Environment Variables 메뉴로 이동

### 2. 필수 환경 변수 (반드시 설정 필요)

#### JWT 인증 관련 (빌드 오류 해결)
```
JWT_SECRET = "your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET = "your-super-secret-refresh-key-minimum-32-chars"
JWT_EXPIRES_IN = "7d"
JWT_REFRESH_EXPIRES_IN = "30d"
```

💡 **JWT_SECRET 생성 방법:**
```bash
# 터미널에서 실행
openssl rand -base64 32
```

#### 데이터베이스 (Supabase)
```
DATABASE_URL = "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL = "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

#### Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL = "https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
```

#### 애플리케이션 설정
```
NEXT_PUBLIC_API_URL = "https://your-project.vercel.app"
NEXT_PUBLIC_APP_URL = "https://your-project.vercel.app"
NODE_ENV = "production"
```

### 3. 선택적 환경 변수

#### Redis (캐싱을 위해 권장)
```
REDIS_URL = "redis://username:password@host:6379/0"
```
또는 Vercel KV 사용 시:
```
KV_URL = "redis://default:password@host:6379"
KV_REST_API_URL = "https://your-redis-endpoint.upstash.io"
KV_REST_API_TOKEN = "your-redis-token"
```

#### 결제 시스템 (Toss Payments)
```
TOSS_SECRET_KEY = "live_sk_..."  # 프로덕션 키
NEXT_PUBLIC_TOSS_CLIENT_KEY = "live_ck_..."  # 프로덕션 키
```

#### 보안 설정
```
NEXTAUTH_URL = "https://your-project.vercel.app"
NEXTAUTH_SECRET = "generated-secret-key"
ENCRYPTION_KEY = "32-character-encryption-key"
```

#### 성능 설정
```
ENABLE_DEBUG_LOGS = "false"
CACHE_TTL_DEFAULT = "300000"
ENABLE_PERFORMANCE_MONITORING = "true"
```

### 4. 환경 변수 설정 방법

1. **Vercel 대시보드에서 추가:**
   - Settings → Environment Variables
   - "Add New" 클릭
   - Key와 Value 입력
   - Environment 선택 (Production, Preview, Development)
   - "Save" 클릭

2. **Vercel CLI 사용:**
```bash
vercel env add JWT_SECRET production
```

3. **.env.production 파일 사용 (권장하지 않음):**
   - 보안상 이유로 시크릿은 Vercel 대시보드에서 직접 설정 권장

### 5. 환경 변수 확인

설정 후 확인:
```bash
vercel env ls
```

### 6. 재배포

환경 변수 설정 후 재배포:
```bash
vercel --prod
```

또는 Vercel 대시보드에서 "Redeploy" 클릭

## 중요 사항

⚠️ **보안 주의사항:**
- JWT_SECRET은 최소 32자 이상의 안전한 문자열 사용
- 프로덕션 환경에서는 모든 시크릿을 강력한 값으로 설정
- 환경 변수 값을 코드나 로그에 노출하지 않도록 주의

⚠️ **빌드 오류 해결:**
- JWT_SECRET이 없으면 빌드가 실패합니다
- 모든 필수 환경 변수를 설정한 후 재배포하세요

## 문제 해결

### 빌드 오류: "JWT_SECRET environment variable is required"
→ JWT_SECRET 환경 변수를 Vercel 대시보드에 추가

### 데이터베이스 연결 오류
→ DATABASE_URL이 올바른지 확인

### Supabase 인증 오류
→ SUPABASE_SERVICE_ROLE_KEY와 NEXT_PUBLIC_SUPABASE_ANON_KEY 확인

## 지원

추가 도움이 필요하시면:
- Vercel 문서: https://vercel.com/docs/environment-variables
- Supabase 문서: https://supabase.com/docs