#!/bin/bash

# 데이터베이스 복원 스크립트
# 사용법: ./scripts/restore-database.sh [backup_file]

set -e

echo "🔄 데이터베이스 복원 시작..."

# 백업 파일 확인
if [ -z "$1" ]; then
    echo "📁 사용 가능한 백업 파일:"
    ls -lh ./backups/*.sql 2>/dev/null || echo "백업 파일이 없습니다."
    echo ""
    echo "사용법: $0 [백업_파일_경로]"
    echo "예시: $0 ./backups/full_backup_20250820_231316.sql"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
    exit 1
fi

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# DIRECT_URL에서 연결 정보 추출
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

echo "📦 복원 대상 데이터베이스:"
echo "  - Host: $DB_HOST"
echo "  - Port: $DB_PORT"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo "  - 백업 파일: $BACKUP_FILE"
echo ""

# PostgreSQL 17 클라이언트 사용
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# PGPASSWORD 환경 변수 설정
export PGPASSWORD=$DB_PASSWORD

# 사용자 확인
echo "⚠️  경고: 이 작업은 기존 데이터베이스를 덮어씁니다!"
read -p "계속하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 복원 취소됨"
    exit 0
fi

echo ""
echo "🔷 데이터베이스 복원 중..."

# 압축된 파일인 경우 해제
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 압축 파일 해제 중..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
    RESTORE_FILE=$TEMP_FILE
else
    RESTORE_FILE=$BACKUP_FILE
fi

# 복원 실행
psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f $RESTORE_FILE \
    --single-transaction \
    --set ON_ERROR_STOP=on

# 임시 파일 정리
if [[ $BACKUP_FILE == *.gz ]]; then
    rm -f $TEMP_FILE
fi

# PGPASSWORD 환경 변수 제거
unset PGPASSWORD

echo ""
echo "✅ 데이터베이스 복원이 완료되었습니다!"
echo ""
echo "📌 복원 후 필요한 작업:"
echo "  1. npx prisma generate (Prisma 클라이언트 재생성)"
echo "  2. npm run dev (개발 서버 재시작)"
echo "  3. 데이터 확인 및 검증"