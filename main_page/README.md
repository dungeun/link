# Commerce-Ready Main Page Template

이 템플릿은 REVU Platform에서 캠페인 기능을 제외하고 추출한 커머스용 기본 템플릿입니다.

## 📦 포함된 기능

### 1. 사용자 시스템
- 회원가입/로그인
- 프로필 관리
- SNS 연동
- 팔로우/팔로잉
- 알림 설정

### 2. 관리자 시스템
- 언어팩 관리 (10개 언어 지원)
- UI 섹션 관리
- 번역 시스템
- 시스템 설정

### 3. 커뮤니티 기능
- 게시판 시스템
- 댓글/좋아요
- 신고 기능
- 다국어 지원

### 4. UI/UX 시스템
- 반응형 디자인
- 다크모드 지원 준비
- 컴포넌트 라이브러리
- 1920px 해상도 최적화

### 5. 카테고리 시스템 (커머스용)
- 계층형 카테고리
- 카테고리별 페이지
- SEO 최적화
- 커스텀 콘텐츠 블록

## 🚀 빠른 시작

### 1. 설치

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 데이터베이스 및 API 키 설정
```

### 2. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 데이터베이스 스키마 푸시
pnpm db:push

# 초기 데이터 시드 (선택사항)
pnpm db:seed
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

## 🏗️ 프로젝트 구조

```
main_page/
├── prisma/
│   └── schema.prisma       # 데이터베이스 스키마 (캠페인 제외)
├── public/
│   └── images/            # 정적 이미지 파일
├── src/
│   ├── app/
│   │   ├── admin/         # 관리자 페이지
│   │   ├── api/           # API 라우트
│   │   ├── community/     # 커뮤니티 페이지
│   │   ├── login/         # 로그인/회원가입
│   │   ├── mypage/        # 마이페이지
│   │   └── page.tsx       # 메인 페이지
│   ├── components/
│   │   ├── admin/         # 관리자 컴포넌트
│   │   ├── community/     # 커뮤니티 컴포넌트
│   │   ├── mypage/        # 마이페이지 컴포넌트
│   │   ├── ui/            # UI 컴포넌트 라이브러리
│   │   ├── Header.tsx     # 헤더
│   │   ├── Footer.tsx     # 푸터
│   │   └── HomePage.tsx   # 홈페이지 섹션들
│   ├── contexts/          # React Context
│   ├── hooks/             # Custom Hooks
│   └── lib/               # 유틸리티 함수
└── package.json
```

## 🔧 커머스 연동 가이드

### 1. 상품 모델 추가

`prisma/schema.prisma`에 상품 관련 모델 추가:

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  categoryId  String
  images      String[]
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category    Category @relation(fields: [categoryId], references: [id])
  
  @@map("products")
}
```

### 2. 장바구니/주문 시스템

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String
  items     CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@map("carts")
}

model Order {
  id         String   @id @default(cuid())
  userId     String
  totalAmount Float
  status     String
  items      OrderItem[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user       User     @relation(fields: [userId], references: [id])
  
  @@map("orders")
}
```

### 3. API 라우트 추가

`src/app/api/products/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true }
  });
  
  return NextResponse.json(products);
}
```

### 4. 상품 페이지 컴포넌트

`src/app/products/page.tsx`:

```typescript
import ProductGrid from '@/components/products/ProductGrid';

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">상품 목록</h1>
      <ProductGrid />
    </div>
  );
}
```

## 📝 주요 설정 파일

### 환경변수 (.env.local)

```env
# 데이터베이스
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# JWT
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# 결제 (Toss Payments)
TOSS_SECRET_KEY="..."
NEXT_PUBLIC_TOSS_CLIENT_KEY="..."
```

## 🌏 다국어 지원

10개 언어 지원:
- 한국어 (ko)
- 영어 (en)
- 일본어 (jp)
- 중국어 (zh)
- 스페인어 (es)
- 포르투갈어 (pt)
- 프랑스어 (fr)
- 독일어 (de)
- 이탈리아어 (it)
- 러시아어 (ru)

### 언어팩 관리
관리자 페이지에서 언어팩 관리 가능:
- `/admin/translations` - 번역 관리
- `/admin/language-packs` - 언어팩 관리

## 🎨 UI 커스터마이징

### 메인 페이지 섹션
`src/components/HomePage.tsx`에서 섹션 순서 및 내용 수정 가능

### 관리자에서 UI 섹션 관리
- Hero 배너
- 카테고리 섹션
- 퀵링크
- 프로모션 배너
- 추천 콘텐츠

## 📦 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
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

## 🔐 보안 설정

- JWT 기반 인증
- CORS 설정
- Rate Limiting
- SQL Injection 방지 (Prisma ORM)
- XSS 방지

## 📚 추가 문서

- [API 문서](./docs/API.md)
- [컴포넌트 가이드](./docs/COMPONENTS.md)
- [데이터베이스 스키마](./docs/SCHEMA.md)
- [배포 가이드](./docs/DEPLOYMENT.md)

## 🤝 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.

## 📄 라이선스

이 프로젝트는 상업적 사용이 가능한 템플릿입니다.