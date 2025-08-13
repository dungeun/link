# 📦 Revu Platform Template 설치 가이드

## 사전 요구사항
- Node.js 18.17+ 
- PostgreSQL 14+
- npm 또는 yarn

## 단계별 설치

### 1. 새 Next.js 프로젝트 생성
```bash
npx create-next-app@14.2.7 my-platform --typescript --tailwind --app
cd my-platform
```

### 2. 템플릿 압축 해제 (압축 파일을 받은 경우)
```bash
tar -xzf revu-platform-template.tar.gz
```

### 3. 템플릿 파일 복사
```bash
# 모든 템플릿 파일을 프로젝트에 복사
cp -r template-export/* ./

# 패키지 설정 파일 적용
cp package.template.json package.json

# 환경 변수 설정 파일 복사
cp .env.template .env
```

### 4. 환경 변수 설정
`.env` 파일을 편집하여 데이터베이스와 다른 서비스를 설정하세요:

```env
# 데이터베이스 설정
DATABASE_URL="postgresql://username:password@localhost:5432/myplatform?schema=public"

# JWT 토큰 시크릿
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Translate API (선택사항)
GOOGLE_TRANSLATE_API_KEY="your-google-translate-api-key"

# 파일 업로드 설정
UPLOAD_BASE_URL="http://localhost:3000"
```

### 5. 의존성 설치
```bash
npm install
```

### 6. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev

# 언어팩 시드 데이터 추가
node language-pack/seed-language-pack.js
```

### 7. 개발 서버 시작
```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요!

## 초기 설정

### 어드민 계정 생성
1. http://localhost:3000/admin/dashboard 로 접속
2. 초기 어드민 계정으로 로그인:
   - Email: admin@example.com
   - Password: admin123!

### 언어팩 설정
1. 어드민 대시보드 → 번역 관리
2. 3개 언어 선택 (한국어, 영어, 일본어)
3. **주의**: 언어는 한 번 설정하면 변경할 수 없습니다

### UI 설정
1. 어드민 대시보드 → UI 설정
2. 헤더, 푸터, 메인 섹션 설정 가능
3. 실시간 미리보기 지원

## 배포 준비

### 프로덕션 빌드
```bash
npm run build
npm start
```

### 환경 변수 업데이트
프로덕션 환경에서는 다음 환경 변수들을 업데이트하세요:
- `DATABASE_URL` - 프로덕션 데이터베이스
- `NEXTAUTH_URL` - 실제 도메인
- `JWT_SECRET` - 강력한 시크릿 키

### 보안 체크리스트
- [ ] JWT_SECRET이 강력한 랜덤 문자열인지 확인
- [ ] 데이터베이스 접근 권한이 제한되어 있는지 확인  
- [ ] API 엔드포인트에 적절한 인증이 있는지 확인
- [ ] 파일 업로드 제한이 설정되어 있는지 확인

## 문제 해결

### 일반적인 문제
1. **데이터베이스 연결 오류**
   - DATABASE_URL이 올바른지 확인
   - PostgreSQL이 실행 중인지 확인

2. **언어팩 로딩 실패**
   - 시드 스크립트가 실행되었는지 확인
   - 데이터베이스에 LanguagePack 테이블이 있는지 확인

3. **빌드 오류**
   - Node.js 버전이 18.17+ 인지 확인
   - 패키지 설치가 완료되었는지 확인

### 로그 확인
```bash
# API 로그 확인 (콘솔에 출력)
npm run dev

# 데이터베이스 상태 확인
npx prisma studio
```

## 다음 단계
- [어드민 시스템 매뉴얼](./ADMIN_MANUAL.md) 읽기
- [언어팩 시스템 가이드](./LANGUAGE_PACK_MANUAL.md) 읽기
- [메인 섹션 가이드](./MAIN_SECTIONS_MANUAL.md) 읽기

---
✅ 설치가 완료되었습니다! 이제 플랫폼을 원하는 대로 커스터마이징하세요.