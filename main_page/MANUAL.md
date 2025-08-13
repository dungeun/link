# 메인페이지 템플릿 사용 매뉴얼

## 목차
1. [설치 및 설정](#설치-및-설정)
2. [기본 사용법](#기본-사용법)
3. [다국어 시스템](#다국어-시스템)
4. [관리자 기능](#관리자-기능)
5. [UI 커스터마이징](#ui-커스터마이징)
6. [확장 방법](#확장-방법)
7. [문제 해결](#문제-해결)

## 설치 및 설정

### 1. 프로젝트 생성
```bash
# 새 프로젝트 디렉토리로 파일 복사
cp -r main_page my-new-project
cd my-new-project

# 의존성 설치
npm install
```

### 2. 환경 변수 설정
```bash
# .env.example을 .env.local로 복사
cp .env.example .env.local

# 환경 변수 수정
nano .env.local
```

필수 환경 변수:
- `DATABASE_URL`: PostgreSQL 데이터베이스 URL
- `JWT_SECRET`: JWT 토큰 서명용 비밀키

### 3. 데이터베이스 초기화
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# 기본 데이터 시드 (선택사항)
npx prisma db seed
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 기본 사용법

### 페이지 구조
```
http://localhost:3000/          # 메인 페이지
http://localhost:3000/admin     # 관리자 페이지
http://localhost:3000/login     # 로그인 페이지 (추가 구현 필요)
```

### 첫 관리자 계정 생성
데이터베이스에 직접 관리자 계정을 생성하거나, 회원가입 후 데이터베이스에서 권한을 변경하세요.

```sql
-- 사용자를 관리자로 변경
UPDATE users SET type = 'ADMIN' WHERE email = 'admin@example.com';
```

## 다국어 시스템

### 언어 추가
1. **관리자 페이지** → **번역 관리**에서 새 언어 추가
2. `src/lib/utils/language.ts`에서 언어 목록 확인
3. 각 텍스트에 대해 새 언어로 번역 추가

### 컴포넌트에서 번역 사용
```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('page.title')}</h1>
      <p>{t('page.description')}</p>
    </div>
  );
}
```

### 번역 키 규칙
- 페이지별: `page.title`, `page.description`
- 컴포넌트별: `component.button.text`
- 공통: `common.save`, `common.cancel`

## 관리자 기능

### 번역 관리
1. **관리자 페이지** → **번역 관리**
2. 새 키 추가 또는 기존 키 수정
3. 모든 지원 언어에 대해 번역 입력
4. 저장 후 실시간 반영

### 언어팩 관리
1. **관리자 페이지** → **언어팩 관리**
2. 네임스페이스별 언어팩 관리
3. 일괄 업로드/다운로드 기능
4. 버전 관리 및 백업

### UI 섹션 관리
1. **관리자 페이지** → **UI 설정**
2. 새 섹션 추가 또는 기존 섹션 수정
3. 섹션별 텍스트, 스타일, 속성 설정
4. 활성화/비활성화 제어

## UI 커스터마이징

### 새 섹션 추가
1. **관리자 페이지에서 섹션 생성**:
   - 섹션 키: `hero_banner`
   - 제목: `Hero Banner`
   - 타입: `banner`

2. **컴포넌트에서 사용**:
```tsx
import { useUIConfig } from '@/hooks/useUIConfig';

function HeroBanner() {
  const { getSection } = useUIConfig();
  const heroData = getSection('hero_banner');
  
  if (!heroData?.isActive) return null;
  
  return (
    <section style={heroData.style}>
      <h1>{heroData.texts.title}</h1>
      <p>{heroData.texts.description}</p>
    </section>
  );
}
```

### 스타일 설정
UI 섹션의 스타일은 JSON 형태로 저장됩니다:

```json
{
  "backgroundColor": "#f8f9fa",
  "padding": "2rem",
  "textAlign": "center",
  "borderRadius": "8px"
}
```

### 동적 속성 설정
섹션별 동적 속성 설정:

```json
{
  "autoplay": true,
  "interval": 5000,
  "showDots": true,
  "showArrows": false
}
```

## 확장 방법

### 새 API 엔드포인트 추가
1. `src/app/api/` 디렉토리에 새 폴더 생성
2. `route.ts` 파일에 HTTP 메서드 구현:

```typescript
// src/app/api/my-endpoint/route.ts
export async function GET(request: NextRequest) {
  // GET 로직
}

export async function POST(request: NextRequest) {
  // POST 로직
}
```

### 새 관리자 페이지 추가
1. `src/app/admin/my-page/page.tsx` 생성
2. 관리자 레이아웃 사용:

```tsx
import AdminLayout from '@/components/admin/AdminLayout';

export default function MyAdminPage() {
  return (
    <AdminLayout>
      <h1>My Admin Page</h1>
      {/* 콘텐츠 */}
    </AdminLayout>
  );
}
```

### 새 데이터베이스 모델 추가
1. `schema.prisma`에 새 모델 추가:

```prisma
model MyModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("my_models")
}
```

2. 마이그레이션 실행:
```bash
npx prisma migrate dev --name add_my_model
```

### 새 언어 추가
1. `src/lib/utils/language.ts`에서 언어 목록에 추가:

```typescript
export const supportedLanguages = [
  // 기존 언어들...
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];
```

2. 관리자 페이지에서 새 언어로 번역 추가

## 보안 강화

### JWT 토큰 보안
- 환경 변수 `JWT_SECRET`을 강력한 값으로 설정
- 토큰 만료 시간 적절히 설정
- Refresh Token 구현 고려

### 데이터베이스 보안
- 데이터베이스 접근 권한 최소화
- 정기적인 백업 수행
- SQL Injection 방지 (Prisma 사용으로 자동 방지)

### API 보안
- Rate Limiting 구현
- CORS 설정 검토
- 입력 값 검증 강화

## 성능 최적화

### 캐싱 전략
1. **언어팩 캐싱**: Redis 또는 메모리 캐시 사용
2. **정적 리소스**: CDN 사용
3. **데이터베이스 쿼리**: 쿼리 최적화 및 인덱스 추가

### 번들 사이즈 최적화
1. **Dynamic Import**: 필요한 시점에만 로드
2. **Tree Shaking**: 사용하지 않는 코드 제거
3. **Image Optimization**: Next.js Image 컴포넌트 사용

## 배포 가이드

### Vercel 배포
1. GitHub 저장소에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 활성화

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

### 환경별 설정
- **개발**: `.env.local`
- **테스트**: `.env.test`
- **운영**: 환경 변수 또는 `.env.production`

## 문제 해결

### 일반적인 문제

**1. 데이터베이스 연결 오류**
```bash
# 데이터베이스 상태 확인
npx prisma db pull

# 연결 문자열 확인
echo $DATABASE_URL
```

**2. 번역이 표시되지 않음**
- 브라우저 개발자 도구에서 네트워크 탭 확인
- 언어팩 API 응답 확인
- LanguageContext가 올바르게 설정되었는지 확인

**3. 관리자 페이지 접근 불가**
```sql
-- 사용자 권한 확인
SELECT email, type FROM users WHERE email = 'your-email@example.com';

-- 관리자 권한 부여
UPDATE users SET type = 'ADMIN' WHERE email = 'your-email@example.com';
```

**4. 빌드 오류**
```bash
# 의존성 다시 설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 오류 확인
npm run lint
```

### 로그 확인
```bash
# 개발 서버 로그 확인
npm run dev

# 프로덕션 로그 확인
npm run build
npm start
```

### 디버깅 팁
1. **Chrome DevTools** 사용
2. **React Developer Tools** 설치
3. **Network 탭**에서 API 호출 확인
4. **Console**에서 오류 메시지 확인

## 추가 리소스

### 유용한 링크
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Query 문서](https://tanstack.com/query/latest)

### 커뮤니티
- GitHub Issues
- Discord 채널
- Stack Overflow

---

이 매뉴얼에 없는 내용이나 추가 질문이 있으시면 이슈를 생성해주세요.