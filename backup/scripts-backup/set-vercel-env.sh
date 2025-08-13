#!/bin/bash

# Vercel 환경변수 설정 스크립트
# 실행: bash set-vercel-env.sh

echo "Setting Vercel environment variables..."

# Database URLs
vercel env add DATABASE_URL production <<< "postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
vercel env add DIRECT_URL production <<< "postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://hibktfylqdamdzigznkt.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjIzODQsImV4cCI6MjA2ODIzODM4NH0.FzlCpOSA2qV_gjAbUOEnSQ62O8F73InDAJj_oTyJ2VE"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2MjM4NCwiZXhwIjoyMDY4MjM4Mzg0fQ.LLIFiN0-lLZp9lryWhOnh4rHDbLGKdGeG9lCCIqVv1s"

# Redis
vercel env add REDIS_URL production <<< "redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395"
vercel env add KV_URL production <<< "redis://default:mYOnQFZCyXRh2xYS8Y5JLZN1WcSjIdRy@redis-15395.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com:15395"

# JWT Secrets
vercel env add JWT_SECRET production <<< "LinkPickPlatform2024!SuperSecretJWTKey#RevuPlatformProduction$"
vercel env add JWT_REFRESH_SECRET production <<< "LinkPickPlatform2024!RefreshSecretKey#RevuPlatformRefresh$"

# Toss Payments
vercel env add TOSS_SECRET_KEY production <<< "test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY production <<< "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"

# Application URLs
vercel env add NEXT_PUBLIC_API_URL production <<< "https://link-coral-nine.vercel.app"
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://link-coral-nine.vercel.app"

echo "Environment variables have been set!"
echo "Please update JWT_SECRET and JWT_REFRESH_SECRET with secure values before production use."