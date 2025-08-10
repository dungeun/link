# 🎯 CMS Template 사용 가이드

REVU Platform에서 추출한 CMS 템플릿을 새 프로젝트에 적용하는 방법입니다.

## 🚀 빠른 시작

### 1단계: 프로젝트 복사
```bash
# 전체 템플릿 복사
cp -r cms-template/* your-new-project/src/

# 또는 선택적 복사
cp cms-template/admin/AdminLayout.tsx your-new-project/src/components/
cp cms-template/config/* your-new-project/src/config/
```

### 2단계: 필수 패키지 설치
```bash
npm install @heroicons/react @prisma/client jsonwebtoken
npm install -D @types/jsonwebtoken
```

### 3단계: 환경 변수 설정
```env
# .env.local
DATABASE_URL="your_database_url"
JWT_SECRET="your_jwt_secret_key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 📋 주요 컴포넌트 사용법

### 1. AdminLayout 적용

```tsx
// app/admin/layout.tsx
import AdminLayout from '@/components/AdminLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
```

### 2. 권한 체크 Hook

```tsx
// 컴포넌트에서 사용
import { useAuth } from '@/hooks/useAuth'

function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  
  if (user?.type !== 'ADMIN') {
    return <div>관리자 권한이 필요합니다</div>
  }
  
  return <div>관리자 페이지</div>
}
```

### 3. UI 섹션 관리

```tsx
// components/HomeSections.tsx
import { defaultSections, sortSectionsByOrder, getEnabledSections } from '@/config/ui-sections'

function HomeSections() {
  const [sections, setSections] = useState(defaultSections)
  const enabledSections = getEnabledSections(sections)
  const sortedSections = sortSectionsByOrder(enabledSections)
  
  return (
    <div>
      {sortedSections.map(section => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  )
}
```

## 🔧 커스터마이징

### 네비게이션 메뉴 수정

```typescript
// config/admin-navigation.ts 편집
export const adminMenuItems: MenuItem[] = [
  {
    name: '새로운 메뉴',
    href: '/admin/new-menu',
    icon: 'NewIcon',
    permission: 'admin.new',
  },
  // ... 기존 메뉴들
]
```

### 새로운 섹션 타입 추가

```typescript
// config/ui-sections.ts 편집
export const sectionTypes = {
  // 기존 타입들...
  CUSTOM: 'custom',
} as const;

// components/sections/CustomSection.tsx 생성
export function CustomSection({ config }: { config: any }) {
  return (
    <div>
      <h2>{config.title}</h2>
      {/* 커스텀 섹션 내용 */}
    </div>
  )
}
```

## 🗄️ 데이터베이스 스키마

### 필수 테이블

```sql
-- 사용자 테이블
CREATE TABLE User (
  id String PRIMARY KEY,
  email String UNIQUE,
  type UserType, -- ADMIN, BUSINESS, USER
  name String?,
  -- 추가 필드들...
);

-- UI 섹션 설정 테이블
CREATE TABLE UISection (
  id String PRIMARY KEY,
  name String,
  type String,
  enabled Boolean DEFAULT true,
  "order" Int,
  config Json?,
  -- 기타 필드들...
);
```

### Prisma 스키마 예시

```prisma
enum UserType {
  ADMIN
  BUSINESS
  USER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  type      UserType @default(USER)
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model UISection {
  id      String  @id @default(cuid())
  name    String
  type    String
  enabled Boolean @default(true)
  order   Int
  config  Json?
}
```

## 🔐 API 엔드포인트

### 인증 API

```typescript
// app/api/auth/login/route.ts
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // 사용자 인증 로직
  const user = await authenticateUser(email, password)
  
  if (user) {
    const token = jwt.sign(
      { userId: user.id, type: user.type },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    
    return Response.json({ token, user })
  }
  
  return Response.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

### UI 섹션 관리 API

```typescript
// app/api/admin/ui-sections/route.ts
export async function GET() {
  const sections = await prisma.uISection.findMany({
    orderBy: { order: 'asc' }
  })
  
  return Response.json(sections)
}

export async function PUT(request: Request) {
  const sections = await request.json()
  
  // 순서 업데이트 로직
  for (const section of sections) {
    await prisma.uISection.update({
      where: { id: section.id },
      data: { order: section.order, enabled: section.enabled }
    })
  }
  
  return Response.json({ success: true })
}
```

## 📱 반응형 디자인

### Tailwind CSS 클래스 패턴

```tsx
// 모바일 우선 반응형 디자인
<div className="
  grid grid-cols-1     // 모바일: 1열
  md:grid-cols-2       // 태블릿: 2열  
  lg:grid-cols-3       // 데스크톱: 3열
  xl:grid-cols-4       // 대형 화면: 4열
  gap-4 p-4
">
  {items.map(item => (
    <div key={item.id} className="
      bg-white rounded-lg shadow-md p-4
      hover:shadow-lg transition-shadow
    ">
      {item.content}
    </div>
  ))}
</div>
```

## 🎨 스타일링 가이드

### CSS 변수 활용

```css
/* globals.css */
:root {
  --primary-color: #3B82F6;
  --secondary-color: #8B5CF6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
}

.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md;
  background-color: var(--primary-color);
}
```

### 다크모드 지원

```tsx
// 다크모드 토글
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

## 🚀 성능 최적화

### 이미지 최적화

```tsx
import Image from 'next/image'

function OptimizedImage({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      priority // 중요한 이미지인 경우
      placeholder="blur" // 로딩 시 블러 효과
      blurDataURL="data:image/..." // base64 블러 이미지
    />
  )
}
```

### 동적 임포트

```tsx
import dynamic from 'next/dynamic'

// 큰 컴포넌트는 동적 로딩
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>로딩 중...</div>,
  ssr: false // 클라이언트만 렌더링
})
```

## 🔍 SEO 설정

### 메타데이터 설정

```tsx
// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Your CMS',
    default: 'Your CMS Platform'
  },
  description: 'Powerful CMS platform built with Next.js',
  keywords: ['CMS', 'Admin', 'Dashboard'],
}

// 개별 페이지
export const metadata: Metadata = {
  title: '관리자 대시보드',
  description: '시스템 전체 현황을 관리하는 대시보드',
}
```

## 📊 분석 및 모니터링

### Google Analytics 연동

```tsx
// components/Analytics.tsx
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = `${pathname}${searchParams}`
    
    // Google Analytics 페이지 뷰 추적
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        page_path: url,
      })
    }
  }, [pathname, searchParams])

  return null
}
```

## 🛡️ 보안 고려사항

### JWT 토큰 보안

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    // 토큰이 유효한 경우 계속 진행
    return NextResponse.next()
  } catch (error) {
    // 토큰이 무효한 경우 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/business/:path*']
}
```

## 🚀 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
```

### Docker 배포

```dockerfile
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 문제 해결

### 자주 발생하는 문제

1. **권한 오류**: `user?.type !== 'ADMIN'` 체크 확인
2. **이미지 로딩 실패**: Next.js Image 도메인 설정 확인
3. **JWT 토큰 만료**: 토큰 갱신 로직 구현
4. **빌드 오류**: TypeScript 타입 체크 및 의존성 확인

### 디버깅 팁

```tsx
// 개발 환경에서만 디버그 정보 표시
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4 bg-black text-white p-2 text-xs">
    User: {JSON.stringify(user)}
    Auth: {isAuthenticated ? 'Yes' : 'No'}
  </div>
)}
```

---

더 자세한 정보나 도움이 필요하면 개발팀에 문의하세요! 🚀