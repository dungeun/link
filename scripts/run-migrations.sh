#!/bin/bash

# 데이터베이스 마이그레이션 실행 스크립트
# 보안 패치와 성능 최적화를 위한 마이그레이션을 실행합니다

echo "🚀 데이터베이스 마이그레이션 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 확인
if [ -z "$1" ]; then
    echo "사용법: ./scripts/run-migrations.sh [development|production]"
    exit 1
fi

ENV=$1
echo -e "${BLUE}환경: $ENV${NC}"

# 환경 변수 파일 확인
if [ "$ENV" = "production" ]; then
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}✗ .env.production 파일이 없습니다${NC}"
        exit 1
    fi
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ "$ENV" = "development" ]; then
    if [ ! -f ".env" ]; then
        echo -e "${RED}✗ .env 파일이 없습니다${NC}"
        exit 1
    fi
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}✗ 유효하지 않은 환경입니다: $ENV${NC}"
    exit 1
fi

# 데이터베이스 연결 테스트
echo -e "\n${BLUE}데이터베이스 연결 테스트...${NC}"
npx prisma db pull --print 2>&1 | head -n 5
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 데이터베이스 연결 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 데이터베이스 연결 성공${NC}"

# 백업 생성 (프로덕션 환경만)
if [ "$ENV" = "production" ]; then
    echo -e "\n${BLUE}데이터베이스 백업 생성...${NC}"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # DATABASE_URL에서 연결 정보 추출
    DB_URL="$DATABASE_URL"
    DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    
    echo "데이터베이스 백업 중: $DB_NAME"
    PGPASSWORD=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "backups/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 백업 생성 완료: backups/$BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠ 백업 생성 실패 - 계속 진행하시겠습니까? (y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Prisma 스키마 검증
echo -e "\n${BLUE}Prisma 스키마 검증...${NC}"
npx prisma validate
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Prisma 스키마 검증 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma 스키마 검증 성공${NC}"

# 기존 마이그레이션 상태 확인
echo -e "\n${BLUE}기존 마이그레이션 상태 확인...${NC}"
npx prisma migrate status

# 마이그레이션 생성 및 적용
echo -e "\n${BLUE}마이그레이션 생성 및 적용...${NC}"
if [ "$ENV" = "production" ]; then
    # 프로덕션: deploy 명령 사용 (안전한 적용)
    npx prisma migrate deploy
else
    # 개발: dev 명령 사용 (자동 생성 및 적용)
    npx prisma migrate dev --name security_and_performance_patch
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 마이그레이션 적용 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 마이그레이션 적용 성공${NC}"

# 인덱스 추가 SQL 실행
echo -e "\n${BLUE}성능 최적화 인덱스 추가...${NC}"
cat << 'EOF' > temp_indexes.sql
-- 성능 최적화를 위한 추가 인덱스
-- 이미 존재하는 인덱스는 IF NOT EXISTS로 처리

-- User 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_user_email_status ON "User"(email, status);
CREATE INDEX IF NOT EXISTS idx_user_type_status ON "User"(type, status);
CREATE INDEX IF NOT EXISTS idx_user_lastLogin ON "User"(lastLogin DESC);

-- Campaign 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_business_status ON "Campaign"(businessId, status);
CREATE INDEX IF NOT EXISTS idx_campaign_category_status ON "Campaign"(category, status);
CREATE INDEX IF NOT EXISTS idx_campaign_dates ON "Campaign"(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_campaign_created ON "Campaign"(createdAt DESC);

-- CampaignApplication 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_application_campaign_status ON "CampaignApplication"(campaignId, status);
CREATE INDEX IF NOT EXISTS idx_application_influencer_status ON "CampaignApplication"(influencerId, status);
CREATE INDEX IF NOT EXISTS idx_application_created ON "CampaignApplication"(createdAt DESC);

-- Post 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_post_board_status ON "Post"(boardId, status);
CREATE INDEX IF NOT EXISTS idx_post_author_status ON "Post"(authorId, status);
CREATE INDEX IF NOT EXISTS idx_post_created ON "Post"(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_post_viewcount ON "Post"(viewCount DESC);

-- Payment 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_user_status ON "Payment"(userId, status);
CREATE INDEX IF NOT EXISTS idx_payment_campaign ON "Payment"(campaignId);
CREATE INDEX IF NOT EXISTS idx_payment_created ON "Payment"(createdAt DESC);

-- Settlement 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_settlement_user_status ON "Settlement"(userId, status);
CREATE INDEX IF NOT EXISTS idx_settlement_period ON "Settlement"(periodStart, periodEnd);
CREATE INDEX IF NOT EXISTS idx_settlement_created ON "Settlement"(createdAt DESC);

-- 복합 인덱스 (자주 함께 조회되는 필드)
CREATE INDEX IF NOT EXISTS idx_campaign_search ON "Campaign"(title, description);
CREATE INDEX IF NOT EXISTS idx_user_search ON "User"(name, email);
CREATE INDEX IF NOT EXISTS idx_post_search ON "Post"(title, content);

-- 분석 쿼리용 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_stats ON "Campaign"(status, budget, viewCount);
CREATE INDEX IF NOT EXISTS idx_user_activity ON "User"(lastLogin, createdAt);
EOF

# psql 명령으로 인덱스 생성
if command -v psql &> /dev/null; then
    echo "인덱스 생성 중..."
    psql "$DATABASE_URL" < temp_indexes.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 인덱스 생성 완료${NC}"
    else
        echo -e "${YELLOW}⚠ 일부 인덱스 생성 실패 (이미 존재할 수 있음)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ psql이 설치되지 않아 인덱스를 생성할 수 없습니다${NC}"
    echo "다음 SQL을 데이터베이스에서 직접 실행하세요:"
    cat temp_indexes.sql
fi

rm -f temp_indexes.sql

# Prisma Client 재생성
echo -e "\n${BLUE}Prisma Client 재생성...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Prisma Client 재생성 완료${NC}"
else
    echo -e "${RED}✗ Prisma Client 재생성 실패${NC}"
    exit 1
fi

# 데이터베이스 상태 확인
echo -e "\n${BLUE}최종 데이터베이스 상태 확인...${NC}"
npx prisma migrate status

# 완료
echo -e "\n${GREEN}✅ 마이그레이션 완료!${NC}"
echo -e "${BLUE}다음 단계:${NC}"
echo "1. 애플리케이션을 재시작하세요"
echo "2. 데이터베이스 연결을 테스트하세요"
echo "3. 로그를 모니터링하세요"

if [ "$ENV" = "production" ]; then
    echo -e "\n${YELLOW}⚠ 프로덕션 체크리스트:${NC}"
    echo "□ 백업 파일이 안전한 곳에 저장되었는지 확인"
    echo "□ 롤백 계획이 준비되었는지 확인"
    echo "□ 모니터링 대시보드 확인"
    echo "□ 에러 알림 설정 확인"
fi