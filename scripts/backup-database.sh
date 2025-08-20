#!/bin/bash

# 데이터베이스 백업 스크립트
# 사용법: ./scripts/backup-database.sh

set -e

echo "🔄 데이터베이스 백업 시작..."

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# DIRECT_URL에서 연결 정보 추출
# postgres://username:password@host:port/database?sslmode=require
DIRECT_URL=${DIRECT_URL:-$DATABASE_URL}

# URL 파싱
if [[ $DIRECT_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ 데이터베이스 URL 파싱 실패"
    exit 1
fi

# 백업 디렉토리 생성
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# 타임스탬프 생성
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 백업 파일명
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
SCHEMA_FILE="$BACKUP_DIR/schema_${TIMESTAMP}.sql"
DATA_FILE="$BACKUP_DIR/data_${TIMESTAMP}.sql"
FULL_BACKUP_FILE="$BACKUP_DIR/full_backup_${TIMESTAMP}.sql"

echo "📦 데이터베이스 정보:"
echo "  - Host: $DB_HOST"
echo "  - Port: $DB_PORT"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"

# PostgreSQL 17 클라이언트 사용
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# pg_dump가 설치되어 있는지 확인
if ! command -v pg_dump &> /dev/null; then
    echo "⚠️  pg_dump가 설치되어 있지 않습니다."
    echo "📥 PostgreSQL 클라이언트 도구 설치 중..."
    
    # macOS인 경우
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql@17
            export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
        else
            echo "❌ Homebrew가 설치되어 있지 않습니다. 먼저 Homebrew를 설치해주세요."
            exit 1
        fi
    # Linux인 경우
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y postgresql-client
    else
        echo "❌ 지원하지 않는 운영체제입니다."
        exit 1
    fi
fi

# PGPASSWORD 환경 변수 설정
export PGPASSWORD=$DB_PASSWORD

echo ""
echo "🔷 1. 스키마만 백업 (테이블 구조, 인덱스, 제약조건 등)..."
pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-comments \
    --if-exists \
    --clean \
    -f $SCHEMA_FILE

echo "✅ 스키마 백업 완료: $SCHEMA_FILE"

echo ""
echo "🔷 2. 데이터만 백업 (INSERT 문)..."
pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --data-only \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --disable-triggers \
    -f $DATA_FILE

echo "✅ 데이터 백업 완료: $DATA_FILE"

echo ""
echo "🔷 3. 전체 백업 (스키마 + 데이터)..."
pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --column-inserts \
    --disable-triggers \
    -f $FULL_BACKUP_FILE

echo "✅ 전체 백업 완료: $FULL_BACKUP_FILE"

# 백업 파일 압축
echo ""
echo "🗜️  백업 파일 압축 중..."
gzip -k $SCHEMA_FILE
gzip -k $DATA_FILE
gzip -k $FULL_BACKUP_FILE

echo "✅ 압축 완료"

# 백업 파일 크기 확인
echo ""
echo "📊 백업 파일 정보:"
ls -lh $BACKUP_DIR/*${TIMESTAMP}*

# PGPASSWORD 환경 변수 제거
unset PGPASSWORD

echo ""
echo "🎉 데이터베이스 백업이 완료되었습니다!"
echo ""
echo "📁 백업 파일 위치:"
echo "  - 스키마: $SCHEMA_FILE"
echo "  - 데이터: $DATA_FILE"
echo "  - 전체: $FULL_BACKUP_FILE"
echo ""
echo "💡 복원 방법:"
echo "  1. 스키마만 복원: psql -h HOST -U USER -d DATABASE < $SCHEMA_FILE"
echo "  2. 데이터만 복원: psql -h HOST -U USER -d DATABASE < $DATA_FILE"
echo "  3. 전체 복원: psql -h HOST -U USER -d DATABASE < $FULL_BACKUP_FILE"
echo ""
echo "📌 Prisma 마이그레이션과 함께 사용:"
echo "  1. npx prisma db push --skip-generate (스키마 생성)"
echo "  2. psql로 데이터 복원"
echo "  3. npx prisma generate (클라이언트 생성)"