#!/bin/bash

# Vercel 환경 변수 설정 스크립트
# Production 환경용 강력한 시크릿 생성 (openssl 사용)

echo "Vercel 환경 변수 설정 스크립트"
echo "================================"

# JWT_SECRET 생성 (64자 랜덤 문자열)
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET 생성됨"

# JWT_REFRESH_SECRET 생성 (64자 랜덤 문자열)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
echo "JWT_REFRESH_SECRET 생성됨"

echo ""
echo "다음 명령어를 실행하여 Vercel에 환경 변수를 설정하세요:"
echo ""
echo "vercel env add JWT_SECRET production"
echo "값: $JWT_SECRET"
echo ""
echo "vercel env add JWT_REFRESH_SECRET production"
echo "값: $JWT_REFRESH_SECRET"
echo ""
echo "또는 Vercel 대시보드에서 직접 설정할 수 있습니다:"
echo "https://vercel.com/your-team/revu-platform/settings/environment-variables"
echo ""
echo "중요: 이 값들을 안전한 곳에 백업하세요!"