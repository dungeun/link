# 로그 아키텍처 설계

## 현재 상황 분석

### 문제점
1. **292개 파일**에서 **1,610개**의 console.log 사용 중
2. 개발/프로덕션 환경 구분이 일부만 되어있음
3. 구조화된 로깅 시스템 부재
4. 에러 추적 및 모니터링 시스템 없음

### 기존 구조
- `/src/lib/utils/logger.ts`: 기본 로거 (console 래퍼)
- `/src/lib/error-handler.ts`: API 에러 핸들링
- 대부분 직접 console.log 사용

## 제안하는 로깅 시스템

### 1. 로깅 라이브러리: **Pino**
- **선택 이유**:
  - Next.js 클라이언트/서버 모두 지원
  - 최고 성능 (Winston 대비 5배 빠름)
  - JSON 구조화 로깅
  - 작은 번들 사이즈

### 2. 에러 모니터링: **Better Stack** (오픈소스 대안)
- **대체 옵션**:
  - **SigNoz**: 완전 오픈소스 APM
  - **Errsole**: MIT 라이선스, 자체 호스팅 가능

### 3. 로그 저장소
- **개발**: 파일 시스템 (`logs/` 디렉토리)
- **프로덕션**: 
  - Supabase 테이블 저장
  - Better Stack/SigNoz로 전송

## 구현 계획

### Phase 1: Pino 기본 설정
```typescript
// lib/logger/index.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});
```

### Phase 2: 로그 레벨 구조
- **fatal**: 시스템 중단
- **error**: 에러 발생
- **warn**: 경고
- **info**: 중요 정보
- **debug**: 디버깅
- **trace**: 상세 추적

### Phase 3: 컨텍스트 로깅
```typescript
// API 요청 로깅
logger.child({
  userId: user.id,
  requestId: generateRequestId(),
  path: request.url
});
```

### Phase 4: 에러 추적
```typescript
// 자동 에러 캡처
process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught Exception');
});

process.on('unhandledRejection', (err) => {
  logger.error(err, 'Unhandled Rejection');
});
```

## 데이터베이스 스키마

```sql
-- logs 테이블
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  user_id UUID REFERENCES users(id),
  request_id VARCHAR(50),
  error_stack TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

## 모니터링 대시보드

### 추적할 메트릭
1. **에러율**: 시간당 에러 수
2. **응답 시간**: API 엔드포인트별
3. **사용자 활동**: 로그인, 캠페인 생성 등
4. **시스템 상태**: 메모리, CPU 사용량

### 알림 설정
- 에러율 임계값 초과
- 특정 에러 패턴 감지
- 성능 저하 감지

## 마이그레이션 전략

### 단계별 전환
1. **Week 1**: 핵심 API 라우트 전환
2. **Week 2**: 프론트엔드 컴포넌트 전환
3. **Week 3**: 나머지 console.log 제거
4. **Week 4**: 모니터링 대시보드 구축

### 우선순위
1. **Critical**: 결제, 인증 관련
2. **High**: 캠페인, 사용자 관리
3. **Medium**: 일반 CRUD 작업
4. **Low**: 개발용 디버깅 로그

## 예상 효과

1. **성능 향상**: Pino 사용으로 로깅 오버헤드 감소
2. **디버깅 개선**: 구조화된 로그로 문제 추적 용이
3. **모니터링 강화**: 실시간 에러 감지 및 알림
4. **규정 준수**: GDPR 등 개인정보 보호 규정 준수