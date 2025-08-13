# 🎯 Template Usage Guide - 빠른 시작 가이드

## 개요
이 가이드는 Revu Platform Template을 새 프로젝트에 빠르게 적용하는 방법을 설명합니다.

## ⚡ 5분 빠른 설치

### 1단계: 새 프로젝트 생성
```bash
npx create-next-app@14.2.7 my-platform --typescript --tailwind --app
cd my-platform
```

### 2단계: 템플릿 적용
```bash
# 템플릿 압축 해제 (압축 파일이 있는 경우)
tar -xzf revu-platform-template.tar.gz

# 또는 폴더에서 직접 복사
cp -r template-export/* ./

# 설정 파일 적용
cp package.template.json package.json
cp .env.template .env
```

### 3단계: 환경 설정
```bash
# .env 파일 편집 - 데이터베이스 URL 설정
DATABASE_URL="postgresql://username:password@localhost:5432/myplatform?schema=public"
JWT_SECRET="your-strong-jwt-secret-here"
```

### 4단계: 설치 및 실행
```bash
npm install
npx prisma generate
npx prisma migrate dev
node language-pack/seed-language-pack.js
npm run dev
```

**🎉 완료! http://localhost:3000 에서 확인하세요**

## 📁 템플릿 구조 이해

### 핵심 디렉토리
```
template-export/
├── admin-pages/           # 어드민 시스템 페이지들
├── main-sections/         # 메인 페이지 섹션 컴포넌트
├── language-pack/         # 다국어 시스템 및 시드 데이터
├── components/           # 재사용 가능한 UI 컴포넌트
├── api-routes/          # 백엔드 API 라우트들
├── database/            # 데이터베이스 스키마
├── lib/                 # 유틸리티 함수들
├── hooks/               # React 커스텀 훅들
└── contexts/            # React 컨텍스트들
```

### 설정 파일들
- `package.template.json` → `package.json`
- `.env.template` → `.env`
- `database/schema.prisma` → `prisma/schema.prisma`

## 🎨 커스터마이징 우선순위

### 1순위: 브랜딩
```bash
# 로고 및 브랜드명 변경
src/components/Header.tsx        # 헤더 로고
src/components/Footer.tsx        # 푸터 브랜드명
public/logo.svg                  # 로고 파일
```

### 2순위: 언어팩 설정
```bash
# 어드민에서 언어 설정 (최초 1회만)
http://localhost:3000/admin/translations
# 3개 언어 선택: 한국어, 영어, 일본어
```

### 3순위: 메인 페이지 섹션
```bash
# UI 설정에서 섹션 편집
http://localhost:3000/admin/ui-config
# 히어로, 카테고리, 퀵링크 등 설정
```

## 📋 체크리스트

### 설치 완료 체크
- [ ] Next.js 프로젝트 생성 완료
- [ ] 템플릿 파일 복사 완료
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 연결 확인
- [ ] 언어팩 시드 데이터 추가
- [ ] 개발 서버 실행 성공

### 기본 설정 체크
- [ ] 어드민 계정 로그인 (admin@example.com / admin123!)
- [ ] 언어팩 3개 언어 설정 완료
- [ ] 메인 페이지 섹션 표시 확인
- [ ] 헤더/푸터 정상 작동 확인

### 커스터마이징 체크
- [ ] 브랜드 로고 및 명칭 변경
- [ ] 색상 테마 적용
- [ ] 주요 텍스트 번역 확인
- [ ] 카테고리 및 메뉴 수정

## 🔧 일반적인 커스터마이징

### 브랜드 색상 변경
```css
/* globals.css 또는 tailwind.config.js */
:root {
  --primary: 59 130 246;      # Blue-500
  --primary-foreground: 255 255 255;
}

/* 또는 Tailwind 설정 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-brand-color',
      }
    }
  }
}
```

### 새 카테고리 추가
```javascript
// language-pack/seed-language-pack.js 에 추가
{
  key: 'category.music',
  ko: '음악',
  en: 'Music', 
  jp: '音楽'
}

// UI Config에서 카테고리 메뉴에 추가
{
  id: 'cat-music',
  name: 'category.music',
  categoryId: 'music',
  icon: '🎵',
  order: 12,
  visible: true
}
```

### 새 API 엔드포인트 추가
```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello World' });
}
```

## 🚀 배포 준비

### 프로덕션 환경 변수
```env
# 프로덕션용 .env 업데이트
DATABASE_URL="postgresql://prod-user:prod-pass@prod-host:5432/prod-db"
JWT_SECRET="super-strong-production-jwt-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 또는 정적 배포 (Vercel/Netlify)
npm run build
```

## 📚 도움이 필요할 때

### 상세 문서
1. [설치 가이드](./INSTALLATION_GUIDE.md) - 자세한 설치 과정
2. [어드민 매뉴얼](./ADMIN_MANUAL.md) - 관리자 기능 완전 가이드
3. [언어팩 가이드](./LANGUAGE_PACK_MANUAL.md) - 다국어 시스템 가이드
4. [메인 섹션 가이드](./MAIN_SECTIONS_MANUAL.md) - UI 커스터마이징

### 디버깅 팁
```bash
# 데이터베이스 상태 확인
npx prisma studio

# 로그 확인
npm run dev    # 콘솔에서 로그 확인

# 캐시 클리어
# 브라우저 새로고침 (Ctrl+F5)
```

### 일반적인 문제 해결
1. **데이터베이스 연결 오류** → DATABASE_URL 확인
2. **언어팩 표시 안됨** → 시드 스크립트 실행 확인
3. **어드민 로그인 안됨** → JWT_SECRET 설정 확인
4. **빌드 오류** → Node.js 버전 18.17+ 확인

## 🎯 성공적인 프로젝트를 위한 팁

### 1. 단계별 접근
1. **기본 설치** → 템플릿 정상 작동 확인
2. **브랜딩** → 로고, 색상, 텍스트 변경
3. **기능 확장** → 필요한 기능 추가
4. **최적화** → 성능 및 SEO 개선

### 2. 보안 고려사항
- JWT_SECRET은 강력한 랜덤 문자열 사용
- 데이터베이스 접근 권한 최소화
- API 엔드포인트에 적절한 검증 추가
- 민감한 정보 로깅 금지

### 3. 성능 최적화
- 이미지는 Next.js Image 컴포넌트 사용
- API 응답에 캐싱 헤더 추가
- 불필요한 의존성 제거
- 번들 크기 모니터링

---

🚀 **Template을 활용해서 멋진 플랫폼을 빠르게 구축하세요!**

💡 **Tip**: 작은 변경부터 시작해서 점진적으로 확장하는 것이 성공적인 커스터마이징의 비결입니다.