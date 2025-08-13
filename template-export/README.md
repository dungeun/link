# Revu Platform Template 📚

## 개요
이 템플릿은 Revu Platform의 핵심 기능들을 다른 프로젝트에 재사용할 수 있도록 모듈화한 패키지입니다.

## 포함된 기능
- ✅ **완전한 어드민 시스템** - 대시보드, 캠페인/인플루언서 관리, 번역 시스템
- ✅ **다국어 지원 시스템** - 3개 언어 제한, 자동 번역, 캐싱 최적화
- ✅ **6개 메인 페이지 섹션** - 히어로, 카테고리, 퀵링크, 프로모션, 랭킹, 추천
- ✅ **인증 시스템** - JWT, NextAuth 통합, 권한 관리
- ✅ **UI Config API** - 동적 프론트엔드 설정 관리
- ✅ **성능 최적화** - 캐싱, API 최적화, 반응형 디자인

## 빠른 시작

### 1. 새 Next.js 프로젝트 생성
```bash
npx create-next-app@14.2.7 my-platform --typescript --tailwind --app
cd my-platform
```

### 2. 템플릿 적용
```bash
# 템플릿 파일들 복사
cp -r ../template-export/* ./

# 패키지 설정 적용
cp package.template.json package.json
cp .env.template .env
```

### 3. 설치 및 설정
```bash
npm install
npx prisma generate
npx prisma migrate dev
node language-pack/seed-language-pack.js
npm run dev
```

## 폴더 구조
```
template-export/
├── README.md                      # 이 파일
├── INSTALLATION_GUIDE.md          # 자세한 설치 가이드
├── admin-pages/                   # 어드민 페이지 컴포넌트들
├── main-sections/                 # 메인 페이지 섹션들
├── language-pack/                 # 언어팩 시스템
├── components/                    # 공통 컴포넌트
├── api-routes/                    # API 라우트들
├── database/                      # 데이터베이스 스키마 및 시드
├── config/                        # 설정 파일들
└── documentation/                 # 상세 문서들
```

## 상세 문서
- 📋 [설치 가이드](./INSTALLATION_GUIDE.md)
- 🛠️ [어드민 시스템 매뉴얼](./ADMIN_MANUAL.md)  
- 🌐 [언어팩 시스템 가이드](./LANGUAGE_PACK_MANUAL.md)
- 📄 [메인 페이지 섹션 가이드](./MAIN_SECTIONS_MANUAL.md)

## 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT, NextAuth
- **Language**: 다국어 지원 (한국어, 영어, 일본어)

## 라이센스
MIT License

---

🚀 **템플릿을 사용해서 멋진 프로젝트를 만들어보세요!**