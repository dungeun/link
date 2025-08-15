#!/bin/bash

# 환경 변수 보안 설정 스크립트
# 프로덕션 환경 변수 파일의 권한을 설정하고 보안을 강화합니다

echo "🔒 환경 변수 보안 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 변수 파일 목록
ENV_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    ".env.test"
    ".env.vercel"
    ".env.coolify"
)

# 1. 환경 변수 파일 권한 설정
echo "📁 환경 변수 파일 권한 설정..."
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        chmod 600 "$file"
        echo -e "${GREEN}✓${NC} $file 권한 설정 완료 (600)"
    fi
done

# 2. 민감한 정보 확인
echo -e "\n🔍 민감한 정보 노출 검사..."
SENSITIVE_PATTERNS=(
    "password"
    "secret"
    "key"
    "token"
    "credential"
)

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  검사 중: $file"
        for pattern in "${SENSITIVE_PATTERNS[@]}"; do
            if grep -qi "$pattern" "$file"; then
                # 실제 값이 설정되어 있는지 확인
                if grep -qi "$pattern.*=.*[a-zA-Z0-9]" "$file"; then
                    echo -e "  ${YELLOW}⚠${NC} $file 에 $pattern 발견 - 값이 설정되어 있습니다"
                fi
            fi
        done
    fi
done

# 3. Git 제외 확인
echo -e "\n📝 .gitignore 확인..."
if [ -f ".gitignore" ]; then
    for file in "${ENV_FILES[@]}"; do
        if ! grep -q "^$file$" .gitignore && ! grep -q "^\*\*/$file$" .gitignore; then
            echo "$file" >> .gitignore
            echo -e "${GREEN}✓${NC} $file 을 .gitignore에 추가했습니다"
        fi
    done
    
    # .env* 패턴 추가
    if ! grep -q "^\.env\*$" .gitignore; then
        echo ".env*" >> .gitignore
        echo -e "${GREEN}✓${NC} .env* 패턴을 .gitignore에 추가했습니다"
    fi
else
    echo -e "${RED}✗${NC} .gitignore 파일이 없습니다!"
fi

# 4. 보안 키 생성
echo -e "\n🔐 보안 키 생성..."
generate_key() {
    openssl rand -base64 64 | tr -d '\n'
}

if [ -f ".env.production" ]; then
    # JWT_SECRET이 비어있으면 생성
    if grep -q "^JWT_SECRET=\"\[\|^JWT_SECRET=$\|^JWT_SECRET=\"\"" .env.production; then
        NEW_SECRET=$(generate_key)
        sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=\"$NEW_SECRET\"/" .env.production
        echo -e "${GREEN}✓${NC} JWT_SECRET 생성 완료"
    fi
    
    # JWT_REFRESH_SECRET이 비어있으면 생성
    if grep -q "^JWT_REFRESH_SECRET=\"\[\|^JWT_REFRESH_SECRET=$\|^JWT_REFRESH_SECRET=\"\"" .env.production; then
        NEW_SECRET=$(generate_key)
        sed -i.bak "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=\"$NEW_SECRET\"/" .env.production
        echo -e "${GREEN}✓${NC} JWT_REFRESH_SECRET 생성 완료"
    fi
    
    # NEXTAUTH_SECRET이 비어있으면 생성
    if grep -q "^NEXTAUTH_SECRET=\"\[\|^NEXTAUTH_SECRET=$\|^NEXTAUTH_SECRET=\"\"" .env.production; then
        NEW_SECRET=$(generate_key)
        sed -i.bak "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$NEW_SECRET\"/" .env.production
        echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET 생성 완료"
    fi
    
    # 백업 파일 제거
    rm -f .env.production.bak
fi

# 5. 환경 변수 검증
echo -e "\n✅ 필수 환경 변수 검증..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NEXTAUTH_URL"
)

if [ -f ".env.production" ]; then
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" .env.production; then
            echo -e "${RED}✗${NC} $var 가 설정되지 않았습니다"
        else
            # 값이 실제로 설정되어 있는지 확인
            value=$(grep "^$var=" .env.production | cut -d'=' -f2)
            if [ -z "$value" ] || [[ "$value" == "\"\""* ]] || [[ "$value" == *"[GENERATE"* ]] || [[ "$value" == *"[CHANGE"* ]]; then
                echo -e "${YELLOW}⚠${NC} $var 가 기본값으로 설정되어 있습니다. 실제 값으로 변경하세요."
            else
                echo -e "${GREEN}✓${NC} $var 설정됨"
            fi
        fi
    done
fi

# 6. 환경 변수 암호화 (선택적)
echo -e "\n🔐 환경 변수 암호화 (선택사항)..."
echo "프로덕션 환경에서는 환경 변수를 암호화하는 것을 권장합니다."
echo "다음 도구들을 고려해보세요:"
echo "  - Mozilla SOPS"
echo "  - HashiCorp Vault"
echo "  - AWS Secrets Manager"
echo "  - Azure Key Vault"

# 7. 백업 생성
echo -e "\n💾 환경 변수 백업..."
BACKUP_DIR=".env-backups"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$file.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✓${NC} $file 백업 완료"
    fi
done

# .env-backups를 .gitignore에 추가
if ! grep -q "^\.env-backups" .gitignore; then
    echo ".env-backups/" >> .gitignore
    echo -e "${GREEN}✓${NC} .env-backups/ 을 .gitignore에 추가했습니다"
fi

echo -e "\n${GREEN}✅ 환경 변수 보안 설정 완료!${NC}"
echo "다음 단계:"
echo "1. .env.production 파일의 플레이스홀더 값들을 실제 값으로 교체하세요"
echo "2. 민감한 정보가 Git에 커밋되지 않았는지 확인하세요"
echo "3. 프로덕션 서버에서 환경 변수를 안전하게 관리하세요"