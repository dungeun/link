#!/bin/bash

# 프로덕션 배포 스크립트
# Vercel, PM2, Docker 등 다양한 배포 방식을 지원합니다

echo "🚀 프로덕션 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 배포 방식 선택
if [ -z "$1" ]; then
    echo "사용법: ./scripts/deploy.sh [vercel|pm2|docker|manual]"
    echo ""
    echo "배포 방식:"
    echo "  vercel - Vercel 플랫폼으로 배포"
    echo "  pm2    - PM2를 사용한 서버 배포"
    echo "  docker - Docker 컨테이너로 배포"
    echo "  manual - 수동 배포 가이드"
    exit 1
fi

DEPLOY_METHOD=$1

# 공통 사전 체크
echo -e "\n${BLUE}사전 체크...${NC}"

# 1. Git 상태 확인
echo "Git 상태 확인..."
if [ -d ".git" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠ 커밋되지 않은 변경사항이 있습니다${NC}"
        echo "계속 진행하시겠습니까? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "현재 브랜치: ${CYAN}$CURRENT_BRANCH${NC}"
fi

# 2. 빌드 확인
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}⚠ 빌드가 없습니다. 빌드를 먼저 실행합니다...${NC}"
    ./scripts/production-build.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ 빌드 실패${NC}"
        exit 1
    fi
fi

# 3. 환경 변수 확인
if [ ! -f ".env.production" ]; then
    echo -e "${RED}✗ .env.production 파일이 없습니다${NC}"
    exit 1
fi

# Vercel 배포
if [ "$DEPLOY_METHOD" = "vercel" ]; then
    echo -e "\n${BLUE}Vercel 배포 시작...${NC}"
    
    # Vercel CLI 설치 확인
    if ! command -v vercel &> /dev/null; then
        echo "Vercel CLI 설치 중..."
        npm i -g vercel
    fi
    
    # vercel.json 생성
    cat << 'EOF' > vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
EOF
    
    echo -e "${GREEN}✓ vercel.json 생성됨${NC}"
    
    # 배포 실행
    echo "Vercel로 배포 중..."
    vercel --prod
    
    echo -e "${GREEN}✓ Vercel 배포 완료${NC}"

# PM2 배포
elif [ "$DEPLOY_METHOD" = "pm2" ]; then
    echo -e "\n${BLUE}PM2 배포 시작...${NC}"
    
    # PM2 설치 확인
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 설치 중..."
        npm i -g pm2
    fi
    
    # ecosystem.config.js 생성
    cat << 'EOF' > ecosystem.config.js
module.exports = {
  apps: [{
    name: 'revu-platform',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true
  }]
}
EOF
    
    echo -e "${GREEN}✓ ecosystem.config.js 생성됨${NC}"
    
    # 로그 디렉토리 생성
    mkdir -p logs
    
    # 기존 프로세스 정지
    pm2 stop revu-platform 2>/dev/null || true
    pm2 delete revu-platform 2>/dev/null || true
    
    # 새로운 프로세스 시작
    pm2 start ecosystem.config.js --env production
    
    # PM2 저장
    pm2 save
    
    # PM2 시작 스크립트 설정
    pm2 startup
    
    echo -e "${GREEN}✓ PM2 배포 완료${NC}"
    echo "상태 확인: pm2 status"
    echo "로그 확인: pm2 logs revu-platform"
    echo "모니터링: pm2 monit"

# Docker 배포
elif [ "$DEPLOY_METHOD" = "docker" ]; then
    echo -e "\n${BLUE}Docker 배포 시작...${NC}"
    
    # Docker 설치 확인
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker가 설치되지 않았습니다${NC}"
        exit 1
    fi
    
    # Dockerfile 생성
    cat << 'EOF' > Dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 캐싱
COPY package*.json ./
RUN npm ci --only=production

# 앱 복사 및 빌드
COPY . .
RUN npx prisma generate
RUN npm run build

# 프로덕션 스테이지
FROM node:18-alpine AS runner

WORKDIR /app

# 보안: non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 권한 설정
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "server.js"]
EOF
    
    echo -e "${GREEN}✓ Dockerfile 생성됨${NC}"
    
    # docker-compose.yml 생성
    cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: revu-platform
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - revu-network
    depends_on:
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    container_name: revu-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - revu-network
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    container_name: revu-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - revu-network
    depends_on:
      - app
    restart: unless-stopped

networks:
  revu-network:
    driver: bridge

volumes:
  redis-data:
EOF
    
    echo -e "${GREEN}✓ docker-compose.yml 생성됨${NC}"
    
    # nginx.conf 생성
    cat << 'EOF' > nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name _;

        # 보안 헤더
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # gzip 압축
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 정적 파일 캐싱
        location /_next/static {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    
    echo -e "${GREEN}✓ nginx.conf 생성됨${NC}"
    
    # Docker 이미지 빌드
    echo "Docker 이미지 빌드 중..."
    docker-compose build
    
    # 컨테이너 시작
    echo "컨테이너 시작 중..."
    docker-compose up -d
    
    echo -e "${GREEN}✓ Docker 배포 완료${NC}"
    echo "상태 확인: docker-compose ps"
    echo "로그 확인: docker-compose logs -f app"
    echo "중지: docker-compose down"

# 수동 배포
elif [ "$DEPLOY_METHOD" = "manual" ]; then
    echo -e "\n${BLUE}수동 배포 가이드${NC}"
    
    cat << 'EOF'

=== 수동 배포 단계 ===

1. 서버 준비
   - Node.js 18+ 설치
   - PostgreSQL 설치
   - Redis 설치 (선택사항)
   - Nginx 설치 (리버스 프록시용)

2. 프로젝트 업로드
   - Git clone 또는 FTP로 파일 업로드
   - .env.production 파일 설정

3. 의존성 설치
   $ npm install --production

4. Prisma 설정
   $ npx prisma generate
   $ npx prisma migrate deploy

5. 프로덕션 빌드
   $ npm run build

6. 서버 시작
   $ NODE_ENV=production npm start

7. Nginx 설정 (예시)
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

8. SSL 설정 (Let's Encrypt)
   $ sudo certbot --nginx -d your-domain.com

9. 프로세스 관리 (systemd 서비스 파일)
   /etc/systemd/system/revu-platform.service:
   
   [Unit]
   Description=Revu Platform
   After=network.target
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/revu-platform
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   Environment=NODE_ENV=production
   
   [Install]
   WantedBy=multi-user.target

10. 서비스 시작
    $ sudo systemctl daemon-reload
    $ sudo systemctl enable revu-platform
    $ sudo systemctl start revu-platform

EOF

else
    echo -e "${RED}✗ 알 수 없는 배포 방식: $DEPLOY_METHOD${NC}"
    exit 1
fi

# 배포 후 확인
echo -e "\n${BLUE}배포 후 확인사항${NC}"
cat << EOF

□ 웹사이트 접속 확인
□ API 엔드포인트 테스트
□ 로그인/회원가입 테스트
□ 데이터베이스 연결 확인
□ Redis 캐시 작동 확인
□ 파일 업로드 테스트
□ 이메일 발송 테스트
□ 에러 모니터링 설정
□ 성능 모니터링 설정
□ 백업 스케줄 설정

모니터링 도구:
- 로그: tail -f logs/*.log
- 프로세스: htop 또는 pm2 monit
- 네트워크: netstat -tlnp
- 디스크: df -h
- 메모리: free -h

문제 해결:
- 502 Bad Gateway: 앱이 실행 중인지 확인
- 503 Service Unavailable: 서버 과부하 확인
- 데이터베이스 연결 실패: DATABASE_URL 확인
- 느린 응답: Redis 캐시 및 인덱스 확인

EOF

echo -e "${GREEN}✅ 배포 스크립트 완료!${NC}"