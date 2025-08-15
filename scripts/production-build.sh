#!/bin/bash

# 프로덕션 빌드 및 검증 스크립트
# 보안 패치가 적용된 코드의 프로덕션 빌드를 수행하고 검증합니다

echo "🏗️ 프로덕션 빌드 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 시작 시간 기록
START_TIME=$(date +%s)

# 에러 발생 시 중단
set -e

# 1. 환경 확인
echo -e "\n${BLUE}1. 환경 확인...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json이 없습니다. 프로젝트 루트에서 실행하세요.${NC}"
    exit 1
fi

# Node.js 버전 확인
NODE_VERSION=$(node -v)
echo -e "Node.js 버전: ${CYAN}$NODE_VERSION${NC}"

# npm 버전 확인
NPM_VERSION=$(npm -v)
echo -e "npm 버전: ${CYAN}$NPM_VERSION${NC}"

# 2. 의존성 설치
echo -e "\n${BLUE}2. 의존성 설치...${NC}"
echo "클린 설치를 수행합니다..."
rm -rf node_modules package-lock.json
npm install
echo -e "${GREEN}✓ 의존성 설치 완료${NC}"

# 3. 환경 변수 확인
echo -e "\n${BLUE}3. 환경 변수 확인...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠ .env.production 파일이 없습니다. .env.production.template을 복사합니다.${NC}"
    if [ -f ".env.production.template" ]; then
        cp .env.production.template .env.production
        echo -e "${GREEN}✓ .env.production 파일 생성됨${NC}"
        echo -e "${YELLOW}⚠ 환경 변수를 실제 값으로 설정하세요!${NC}"
    fi
fi

# 4. TypeScript 컴파일 체크
echo -e "\n${BLUE}4. TypeScript 컴파일 체크...${NC}"
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript 컴파일 성공${NC}"
else
    echo -e "${RED}✗ TypeScript 컴파일 실패${NC}"
    exit 1
fi

# 5. ESLint 검사
echo -e "\n${BLUE}5. ESLint 검사...${NC}"
npm run lint 2>/dev/null || npx next lint
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ESLint 검사 통과${NC}"
else
    echo -e "${YELLOW}⚠ ESLint 경고가 있습니다${NC}"
fi

# 6. Prisma 생성
echo -e "\n${BLUE}6. Prisma Client 생성...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client 생성 완료${NC}"

# 7. 보안 검사
echo -e "\n${BLUE}7. 보안 취약점 검사...${NC}"

# npm audit
echo "npm 패키지 보안 검사..."
npm audit --production || true

# 민감한 정보 노출 검사
echo "민감한 정보 노출 검사..."
SENSITIVE_PATTERNS=(
    "JWT_SECRET"
    "DATABASE_URL"
    "API_KEY"
    "SECRET_KEY"
    "PASSWORD"
)

FOUND_SENSITIVE=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if grep -r "$pattern.*=.*['\"].*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ 2>/dev/null; then
        echo -e "${RED}✗ 소스 코드에 민감한 정보가 하드코딩되어 있습니다: $pattern${NC}"
        FOUND_SENSITIVE=true
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    echo -e "${GREEN}✓ 민감한 정보 노출 없음${NC}"
fi

# 8. 프로덕션 빌드
echo -e "\n${BLUE}8. 프로덕션 빌드 시작...${NC}"
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 프로덕션 빌드 성공${NC}"
else
    echo -e "${RED}✗ 프로덕션 빌드 실패${NC}"
    exit 1
fi

# 9. 빌드 결과 분석
echo -e "\n${BLUE}9. 빌드 결과 분석...${NC}"

# 빌드 크기 확인
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo -e "빌드 크기: ${CYAN}$BUILD_SIZE${NC}"
    
    # 정적 파일 수
    STATIC_FILES=$(find .next/static -type f | wc -l)
    echo -e "정적 파일 수: ${CYAN}$STATIC_FILES${NC}"
    
    # 서버 사이드 페이지 수
    if [ -d ".next/server/pages" ]; then
        SSR_PAGES=$(find .next/server/pages -name "*.js" | wc -l)
        echo -e "서버 사이드 페이지: ${CYAN}$SSR_PAGES${NC}"
    fi
fi

# 10. 번들 분석 (선택적)
echo -e "\n${BLUE}10. 번들 분석...${NC}"
if command -v npx &> /dev/null && npm list @next/bundle-analyzer &> /dev/null; then
    echo "번들 분석을 수행하려면 다음 명령을 실행하세요:"
    echo -e "${CYAN}ANALYZE=true npm run build${NC}"
else
    echo "번들 분석을 위해 @next/bundle-analyzer 설치를 권장합니다"
fi

# 11. 프로덕션 테스트 (기본 테스트)
echo -e "\n${BLUE}11. 프로덕션 빌드 테스트...${NC}"

# 빌드된 앱 시작 (백그라운드)
echo "프로덕션 서버 시작 중..."
NODE_ENV=production npm run start &
SERVER_PID=$!

# 서버 시작 대기
sleep 5

# 헬스 체크
echo "헬스 체크 수행 중..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 서버 응답 정상${NC}"
else
    echo -e "${RED}✗ 서버 응답 실패${NC}"
fi

# API 엔드포인트 테스트
echo "API 엔드포인트 테스트..."
API_ENDPOINTS=(
    "/api/campaigns"
    "/api/auth/me"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f "http://localhost:3000$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $endpoint 응답 정상${NC}"
    else
        echo -e "${YELLOW}⚠ $endpoint 응답 실패 (인증 필요할 수 있음)${NC}"
    fi
done

# 서버 종료
kill $SERVER_PID 2>/dev/null || true

# 12. 체크리스트 생성
echo -e "\n${BLUE}12. 프로덕션 배포 체크리스트...${NC}"
cat << EOF > production-checklist.md
# 프로덕션 배포 체크리스트

## 빌드 정보
- 빌드 날짜: $(date)
- Node.js 버전: $NODE_VERSION
- npm 버전: $NPM_VERSION
- 빌드 크기: $BUILD_SIZE

## 필수 확인 사항
- [ ] 환경 변수 설정 완료 (.env.production)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] Redis 캐시 서버 준비
- [ ] SSL 인증서 설정
- [ ] CDN 설정
- [ ] 로깅 시스템 준비
- [ ] 모니터링 설정
- [ ] 백업 시스템 구성

## 보안 체크리스트
- [ ] JWT_SECRET 변경
- [ ] NEXTAUTH_SECRET 변경
- [ ] 관리자 기본 비밀번호 변경
- [ ] CORS 설정 확인
- [ ] CSP 헤더 설정
- [ ] Rate Limiting 활성화
- [ ] SQL Injection 방지 확인
- [ ] XSS 방지 확인

## 성능 체크리스트
- [ ] 데이터베이스 인덱스 생성
- [ ] Redis 캐싱 활성화
- [ ] CDN 설정
- [ ] 이미지 최적화
- [ ] gzip 압축 활성화
- [ ] HTTP/2 활성화

## 배포 후 확인
- [ ] 모든 페이지 접근 가능
- [ ] API 엔드포인트 정상 작동
- [ ] 로그인/회원가입 테스트
- [ ] 결제 시스템 테스트
- [ ] 이메일 발송 테스트
- [ ] 파일 업로드 테스트
- [ ] 에러 페이지 테스트
- [ ] 모니터링 대시보드 확인
EOF

echo -e "${GREEN}✓ 체크리스트 생성: production-checklist.md${NC}"

# 종료 시간 계산
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 완료
echo -e "\n${GREEN}✅ 프로덕션 빌드 완료!${NC}"
echo -e "소요 시간: ${CYAN}${MINUTES}분 ${SECONDS}초${NC}"
echo -e "\n${BLUE}다음 단계:${NC}"
echo "1. production-checklist.md 확인"
echo "2. 환경 변수 설정 확인"
echo "3. 배포 스크립트 실행 (./scripts/deploy.sh)"
echo ""
echo -e "${YELLOW}⚠ 주의사항:${NC}"
echo "- 프로덕션 환경 변수를 반드시 설정하세요"
echo "- 데이터베이스 백업을 먼저 수행하세요"
echo "- 롤백 계획을 준비하세요"