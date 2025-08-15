#!/bin/bash

echo "Setting up Vercel environment variables..."

# Database URLs
vercel env add DATABASE_URL production --yes --value="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
vercel env add DIRECT_URL production --yes --value="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
vercel env add POSTGRES_URL production --yes --value="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
vercel env add POSTGRES_PRISMA_URL production --yes --value="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
vercel env add POSTGRES_URL_NON_POOLING production --yes --value="postgres://postgres.hibktfylqdamdzigznkt:68FBtj7P8d3MXS3H@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Database connection details
vercel env add POSTGRES_USER production --yes --value="postgres"
vercel env add POSTGRES_HOST production --yes --value="db.hibktfylqdamdzigznkt.supabase.co"
vercel env add POSTGRES_PASSWORD production --yes --value="68FBtj7P8d3MXS3H"
vercel env add POSTGRES_DATABASE production --yes --value="postgres"

# Supabase configuration
vercel env add SUPABASE_URL production --yes --value="https://hibktfylqdamdzigznkt.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes --value="https://hibktfylqdamdzigznkt.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NjIzODQsImV4cCI6MjA2ODIzODM4NH0.FzlCpOSA2qV_gjAbUOEnSQ62O8F73InDAJj_oTyJ2VE"
vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpYmt0ZnlscWRhbWR6aWd6bmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2MjM4NCwiZXhwIjoyMDY4MjM4Mzg0fQ.LLIFiN0-lLZp9lryWhOnh4rHDbLGKdGeG9lCCIqVv1s"
vercel env add SUPABASE_JWT_SECRET production --yes --value="5584DxxLcfjSfRStI1sfG1nG6148yaeDJ2tF0PEX5y1xIJ4MhwxNS+7903D00TcIVHiT7XkMLkdKfr4jh1bIZA=="

# JWT Secrets
vercel env add JWT_SECRET production --yes --value="LinkPickPlatform2024!SuperSecretJWTKey#RevuPlatformProduction$"
vercel env add JWT_REFRESH_SECRET production --yes --value="LinkPickPlatform2024!RefreshSecretKey#RevuPlatformRefresh$"

# Other required environment variables
vercel env add ENCRYPTION_KEY production --yes --value="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
vercel env add GOOGLE_TRANSLATE_API_KEY production --yes --value=""
vercel env add NODE_ENV production --yes --value="production"
vercel env add NEXT_TELEMETRY_DISABLED production --yes --value="1"

# Application URLs
vercel env add NEXT_PUBLIC_API_URL production --yes --value="https://link-alpha-three.vercel.app"
vercel env add NEXT_PUBLIC_APP_URL production --yes --value="https://link-alpha-three.vercel.app"

# Toss Payments
vercel env add TOSS_SECRET_KEY production --yes --value="test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R"
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY production --yes --value="test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"

echo "All environment variables have been set!"