# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성
1. https://supabase.com 접속
2. GitHub 또는 이메일로 가입
3. 무료 플랜으로 시작 (2개 프로젝트 무료)

### 1.2 새 프로젝트 생성
1. Dashboard에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: revu-platform (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: Seoul (ap-northeast-2) 또는 가까운 지역 선택
   - **Pricing Plan**: Free tier로 시작

## 2. 데이터베이스 연결 정보 확인

### 2.1 Settings → Database
프로젝트 대시보드에서 Settings → Database 메뉴로 이동

### 2.2 Connection String 복사
**Connection Pooling** (Transaction Mode) - Vercel 배포용:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Direct Connection** - 마이그레이션용:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## 3. Prisma 설정

### 3.1 schema.prisma 수정
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3.2 환경 변수 설정
`.env.local` 파일에 추가:
```bash
# Supabase Database
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase API (선택사항)
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## 4. 데이터베이스 마이그레이션

### 4.1 스키마 푸시 (개발용)
```bash
npx prisma db push
```

### 4.2 마이그레이션 실행 (프로덕션)
```bash
npx prisma migrate deploy
```

### 4.3 초기 데이터 시딩
```bash
# 샘플 데이터
npm run db:seed

# 한국어 데이터
npm run db:seed-korean

# 실제 계정 생성
npm run db:seed-real
```

## 5. Supabase 특수 기능 활용 (선택사항)

### 5.1 Row Level Security (RLS)
SQL Editor에서 실행:
```sql
-- RLS 활성화
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;

-- 정책 생성 예시
CREATE POLICY "Users can view own profile" 
ON "User" FOR SELECT 
USING (auth.uid()::text = id);
```

### 5.2 Realtime 구독
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// 실시간 구독 예시
const subscription = supabase
  .channel('campaigns')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'Campaign' },
    (payload) => console.log('New campaign:', payload)
  )
  .subscribe()
```

### 5.3 Storage 활용
Supabase Storage를 이미지 업로드에 활용:
```javascript
// 이미지 업로드
const { data, error } = await supabase.storage
  .from('campaigns')
  .upload(`${campaignId}/${file.name}`, file)

// Public URL 가져오기
const { data: { publicUrl } } = supabase.storage
  .from('campaigns')
  .getPublicUrl(`${campaignId}/${file.name}`)
```

## 6. Vercel 배포 설정

### 6.1 Vercel 환경 변수
Vercel 프로젝트 설정에서 추가:
```bash
DATABASE_URL=[Supabase Connection Pooling URL]
DIRECT_URL=[Supabase Direct Connection URL]
NEXT_PUBLIC_SUPABASE_URL=[Supabase Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase Anon Key]
```

### 6.2 빌드 명령어
```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

## 7. 백업 및 복구

### 7.1 백업 생성
Supabase Dashboard → Database → Backups에서 자동 백업 확인

### 7.2 수동 백업
```bash
pg_dump [DIRECT_URL] > backup.sql
```

### 7.3 복구
```bash
psql [DIRECT_URL] < backup.sql
```

## 8. 모니터링

### 8.1 Database 모니터링
- Dashboard → Database → Performance
- 쿼리 성능, 인덱스 사용률 확인

### 8.2 API 로그
- Dashboard → Logs → API
- 실시간 API 요청 모니터링

## 9. 성능 최적화

### 9.1 Connection Pooling
- Vercel과 같은 서버리스 환경에서는 반드시 Connection Pooling URL 사용
- `?pgbouncer=true` 파라미터 필수

### 9.2 인덱스 생성
SQL Editor에서:
```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_campaign_status ON "Campaign"(status);
CREATE INDEX idx_application_user ON "Application"("userId");
CREATE INDEX idx_application_campaign ON "Application"("campaignId");
```

### 9.3 쿼리 최적화
- Prisma의 `include` 대신 `select` 사용
- 필요한 필드만 선택하여 데이터 전송량 감소

## 10. 트러블슈팅

### Connection 에러
- Connection Pooling URL 확인
- 비밀번호에 특수문자가 있다면 URL 인코딩 필요

### 마이그레이션 실패
- DIRECT_URL 사용 여부 확인
- 데이터베이스 권한 확인

### 느린 쿼리
- Dashboard → Database → Query Performance 확인
- 인덱스 추가 고려

## 11. 비용 관리

### 무료 플랜 제한
- 500MB 데이터베이스
- 2GB 대역폭/월
- 50,000 MAU (Monthly Active Users)
- 실시간 메시지 200만개/월

### Pro 플랜 ($25/월)
- 8GB 데이터베이스
- 250GB 대역폭/월
- 무제한 MAU
- 자동 백업

## 12. 보안 권장사항

### 12.1 환경 변수 보안
- Service Role Key는 서버 사이드에서만 사용
- Anon Key는 클라이언트 사이드 가능

### 12.2 RLS 정책
- 프로덕션에서는 반드시 RLS 활성화
- 각 테이블별 적절한 정책 설정

### 12.3 API 보안
- Rate limiting 설정
- CORS 정책 구성

## 참고 링크
- [Supabase 문서](https://supabase.com/docs)
- [Supabase + Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase + Prisma 가이드](https://supabase.com/partners/integrations/prisma)
- [Connection Pooling 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)