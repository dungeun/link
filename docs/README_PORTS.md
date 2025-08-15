# 포트 설정 가이드

## REVU Platform 포트 구성

- **Next.js 개발 서버**: 자동 할당 (scripts/find-free-port.js)
- **Prisma Studio**: 5555 포트 (고정)
- **실행 명령**: `npm run studio`

## 사용 방법

### Prisma Studio 실행
```bash
cd /Users/admin/new_project/revu-platform
npm run studio
# http://localhost:5555 에서 접속
```

## 포트 충돌 해결

만약 포트 5555가 이미 사용 중인 경우:

1. 현재 사용 중인 포트 확인:
```bash
lsof -i :5555
```

2. 프로세스 종료:
```bash
kill -9 [PID]
```

3. 또는 다른 포트로 변경:
```bash
prisma studio --port 5557
```

## 관리자 계정 정보

REVU Platform 관리자 계정:
- **이메일**: admin@revu.com
- **비밀번호**: admin123!@#
- **타입**: ADMIN
- **상태**: ACTIVE

관리자 계정 확인 API:
```bash
curl http://localhost:[PORT]/api/test-admin
```

관리자 로그인:
```
http://localhost:[PORT]/admin/login
```