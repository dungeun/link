# 데이터베이스 마이그레이션 가이드

## 개요
이 문서는 revu-platform 데이터베이스를 다른 프로젝트나 환경으로 마이그레이션하는 방법을 설명합니다.

## 백업 파일 정보

### 2025년 8월 20일 백업
- **스키마**: `./backups/schema_20250820_231316.sql` (215KB)
- **데이터**: `./backups/data_20250820_231316.sql` (2.5MB)
- **전체 백업**: `./backups/full_backup_20250820_231316.sql` (2.7MB)
- **압축 버전**: 각 파일의 `.gz` 버전도 제공됩니다

## 새 프로젝트에서 데이터베이스 복원하기

### 1. 준비 사항
- PostgreSQL 17 이상
- Prisma가 설치된 Node.js 프로젝트
- 새 데이터베이스 (Supabase, PostgreSQL 등)

### 2. 단계별 복원 과정

#### 방법 A: Prisma를 사용한 복원 (권장)

```bash
# 1. 새 프로젝트에 백업 파일 복사
cp -r ./backups /path/to/new-project/

# 2. 새 프로젝트의 .env 파일 설정
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
DIRECT_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"

# 3. Prisma 스키마 파일 복사
cp prisma/schema.prisma /path/to/new-project/prisma/

# 4. 데이터베이스 스키마 생성
cd /path/to/new-project
npx prisma db push --skip-generate

# 5. 데이터 복원
export PGPASSWORD=YOUR_PASSWORD
psql -h HOST -p PORT -U USER -d DATABASE < backups/data_20250820_231316.sql

# 6. Prisma 클라이언트 생성
npx prisma generate
```

#### 방법 B: 전체 백업 복원

```bash
# 1. 새 데이터베이스 생성 (필요한 경우)
createdb -h HOST -U USER new_database

# 2. 전체 백업 복원
export PGPASSWORD=YOUR_PASSWORD
psql -h HOST -p PORT -U USER -d new_database < backups/full_backup_20250820_231316.sql

# 3. Prisma 설정 업데이트
npx prisma db pull  # 기존 데이터베이스에서 스키마 가져오기
npx prisma generate  # 클라이언트 생성
```

### 3. Supabase에서 복원하기

```bash
# 1. Supabase 프로젝트 생성
# https://supabase.com 에서 새 프로젝트 생성

# 2. 연결 정보 가져오기
# Settings > Database > Connection string 복사

# 3. 복원 스크립트 사용
./scripts/restore-database.sh ./backups/full_backup_20250820_231316.sql

# 또는 수동으로
export PGPASSWORD=YOUR_SUPABASE_PASSWORD
psql -h YOUR_PROJECT.supabase.co -p 5432 -U postgres -d postgres < backups/full_backup_20250820_231316.sql
```

### 4. 복원 후 확인 사항

#### 데이터 검증
```sql
-- 주요 테이블 확인
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Campaign";
SELECT COUNT(*) FROM "Application";
SELECT COUNT(*) FROM "Profile";
SELECT COUNT(*) FROM "BusinessProfile";
```

#### 시퀀스 재설정 (필요한 경우)
```sql
-- 모든 시퀀스 재설정
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) FROM "User";
SELECT setval(pg_get_serial_sequence('"Campaign"', 'id'), COALESCE(MAX(id), 1)) FROM "Campaign";
-- ... 다른 테이블들도 동일하게
```

## 트러블슈팅

### 1. 권한 오류
```bash
# 오류: permission denied for table XXX
# 해결: 사용자에게 적절한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### 2. 외래 키 제약 조건 오류
```bash
# 데이터만 복원할 때 발생 가능
# 해결: 전체 백업 사용 또는 트리거 비활성화
psql -h HOST -U USER -d DATABASE -c "SET session_replication_role = 'replica';"
psql -h HOST -U USER -d DATABASE < backups/data_20250820_231316.sql
psql -h HOST -U USER -d DATABASE -c "SET session_replication_role = 'origin';"
```

### 3. 인코딩 문제
```bash
# UTF-8 인코딩 설정
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

## 스크립트 사용법

### 백업 스크립트
```bash
# 전체 백업 생성
./scripts/backup-database.sh

# 생성되는 파일:
# - schema_TIMESTAMP.sql: 스키마만
# - data_TIMESTAMP.sql: 데이터만
# - full_backup_TIMESTAMP.sql: 전체
```

### 복원 스크립트
```bash
# 특정 백업 파일 복원
./scripts/restore-database.sh ./backups/full_backup_20250820_231316.sql

# 압축된 파일도 지원
./scripts/restore-database.sh ./backups/full_backup_20250820_231316.sql.gz
```

## 자동화 (CI/CD)

### GitHub Actions 예제
```yaml
name: Database Migration

on:
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Restore database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          psql $DATABASE_URL < backups/full_backup_20250820_231316.sql
      
      - name: Run Prisma migrations
        run: |
          npm install
          npx prisma generate
          npx prisma migrate deploy
```

## 보안 주의사항

1. **백업 파일 관리**
   - 백업 파일에는 민감한 데이터가 포함될 수 있습니다
   - Git에 커밋하지 마세요 (.gitignore에 추가됨)
   - 필요시 암호화하여 저장하세요

2. **연결 정보 보호**
   - 데이터베이스 URL을 환경 변수로 관리
   - .env 파일을 Git에 커밋하지 마세요
   - 프로덕션 환경에서는 시크릿 관리 도구 사용

3. **접근 권한**
   - 최소 권한 원칙 적용
   - 백업/복원용 별도 사용자 생성 권장
   - 정기적인 권한 검토

## 참고 자료

- [Prisma 마이그레이션 가이드](https://www.prisma.io/docs/guides/migrate)
- [PostgreSQL 백업 및 복원](https://www.postgresql.org/docs/current/backup.html)
- [Supabase 데이터베이스 관리](https://supabase.com/docs/guides/database)