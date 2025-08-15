# 배포 체크리스트

## 환경 변수 설정

### 필수 환경 변수
- [ ] `DATABASE_URL` - PostgreSQL 연결 문자열
- [ ] `JWT_SECRET` - JWT 토큰 서명용 비밀 키
- [ ] `NEXTAUTH_SECRET` - NextAuth 세션 암호화 키
- [ ] `NEXTAUTH_URL` - 프로덕션 URL (예: https://revu-platform.com)
- [ ] `NODE_ENV=production`

### 결제 관련
- [ ] `NEXT_PUBLIC_TOSS_CLIENT_KEY` - 토스페이먼츠 클라이언트 키
- [ ] `TOSS_SECRET_KEY` - 토스페이먼츠 시크릿 키

### 파일 업로드
- [ ] `AWS_ACCESS_KEY_ID` - AWS S3 액세스 키 (옵션)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS S3 시크릿 키 (옵션)
- [ ] `AWS_REGION` - AWS 리전 (옵션)
- [ ] `S3_BUCKET_NAME` - S3 버킷 이름 (옵션)

### Redis 캐싱 (옵션)
- [ ] `REDIS_HOST` - Redis 서버 호스트
- [ ] `REDIS_PORT` - Redis 서버 포트
- [ ] `REDIS_PASSWORD` - Redis 비밀번호

## 데이터베이스 설정

```bash
# 프로덕션 DB 마이그레이션
npx prisma migrate deploy

# 프로덕션 DB 시드 (필요시)
npx prisma db seed
```

## 빌드 및 배포

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### Docker 배포
```bash
# Docker 이미지 빌드
docker build -t revu-platform .

# Docker 컨테이너 실행
docker run -p 3000:3000 --env-file .env.production revu-platform
```

### PM2 배포
```bash
# PM2 설치
npm install -g pm2

# 빌드
npm run build

# PM2로 실행
pm2 start npm --name "revu-platform" -- start
```

## 배포 후 확인 사항

### 기능 테스트
- [ ] 홈페이지 정상 로딩
- [ ] 회원가입/로그인 기능
- [ ] 관리자 로그인 및 대시보드 접속
- [ ] 캠페인 생성 및 조회
- [ ] 결제 기능 (테스트 모드)
- [ ] 파일 업로드 기능

### 성능 확인
- [ ] 페이지 로딩 속도
- [ ] API 응답 시간
- [ ] 에러 로그 확인

### 보안 확인
- [ ] HTTPS 설정
- [ ] CORS 설정
- [ ] 환경 변수 보안
- [ ] SQL 인젝션 방지
- [ ] XSS 방지

## 모니터링 설정

### 로그 수집
- [ ] 애플리케이션 로그
- [ ] 에러 로그
- [ ] 액세스 로그

### 알림 설정
- [ ] 서버 다운 알림
- [ ] 에러율 증가 알림
- [ ] 디스크 공간 부족 알림

## 백업 설정

### 데이터베이스 백업
- [ ] 일일 자동 백업
- [ ] 백업 파일 원격 저장
- [ ] 복원 테스트

### 파일 백업
- [ ] 업로드된 파일 백업
- [ ] 설정 파일 백업

## 롤백 계획

### 이전 버전으로 롤백
```bash
# Git 태그로 이전 버전 확인
git tag -l

# 특정 버전으로 롤백
git checkout v1.0.0
npm install
npm run build
```

### 데이터베이스 롤백
```bash
# 마이그레이션 롤백
npx prisma migrate resolve --rolled-back
```

## 주의사항

1. **Mock 인증 제거됨**: 모든 mock 인증 코드가 제거되었으므로 실제 JWT 기반 인증만 작동합니다.
2. **관리자 계정**: 초기 관리자 계정을 데이터베이스에 직접 생성해야 합니다.
3. **파일 업로드**: 로컬 파일 시스템 대신 S3 같은 클라우드 스토리지 사용을 권장합니다.
4. **Redis**: 프로덕션에서는 Redis 사용을 권장합니다 (현재는 mock Redis 사용 중).

## 트러블슈팅

### 빌드 실패 시
- Node.js 버전 확인 (18.x 이상)
- 의존성 재설치: `rm -rf node_modules && npm install`
- 캐시 삭제: `rm -rf .next`

### 데이터베이스 연결 실패 시
- DATABASE_URL 형식 확인
- 네트워크 방화벽 설정 확인
- SSL 설정 확인

### 인증 실패 시
- JWT_SECRET 환경 변수 확인
- 쿠키 설정 확인 (SameSite, Secure)
- CORS 설정 확인
