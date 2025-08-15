# 📊 자동 정산 시스템 API 문서

## 개요
자동 정산 시스템이 구현되었습니다. 이 시스템은 완료된 캠페인에 대해 인플루언서에게 자동으로 정산을 처리합니다.

## 주요 기능

### 1. 자동 정산 스케줄러
- **매일 자정**: 완료된 캠페인 자동 정산
- **매주 월요일 오전 9시**: 주간 정산 리포트
- **매월 1일 오전 10시**: 월간 정산 처리 및 리포트

### 2. 정산 계산
- 플랫폼 수수료: 기본 20% (조정 가능)
- 최소 정산 금액: 10,000원
- 정산 주기: 7일

## API 엔드포인트

### 🔑 관리자 API

#### 1. 정산 통계 조회
```
GET /api/admin/settlements
```
**Query Parameters:**
- `startDate` (optional): 시작일
- `endDate` (optional): 종료일

**Response:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "total": 100,
      "pending": 30,
      "completed": 60,
      "processing": 10
    },
    "amounts": {
      "total": 50000000,
      "pending": 15000000,
      "completed": 30000000
    }
  }
}
```

#### 2. 수동 정산 실행
```
POST /api/admin/settlements
```
**Body:**
```json
{
  "type": "all",  // "all" 또는 "individual"
  "influencerId": "cuid123"  // type이 "individual"일 때 필요
}
```

#### 3. 정산 목록 조회
```
GET /api/admin/settlements/list
```
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional): PENDING, PROCESSING, COMPLETED, FAILED
- `influencerId` (optional)
- `startDate` (optional)
- `endDate` (optional)

#### 4. 정산 상세 조회
```
GET /api/admin/settlements/[id]
```

#### 5. 정산 상태 업데이트
```
PATCH /api/admin/settlements/[id]
```
**Body:**
```json
{
  "status": "PROCESSING",  // PROCESSING, COMPLETED, FAILED
  "adminNotes": "처리 메모"
}
```

#### 6. 스케줄러 관리
```
GET /api/admin/settlements/scheduler  // 상태 조회
POST /api/admin/settlements/scheduler  // 제어
```
**Body (POST):**
```json
{
  "action": "start"  // "start", "stop", "manual"
}
```

#### 7. 정산 설정 관리
```
GET /api/admin/settlements/config  // 설정 조회
PUT /api/admin/settlements/config  // 설정 업데이트
```
**Body (PUT):**
```json
{
  "platformFeeRate": 0.2,
  "minSettlementAmount": 10000,
  "settlementPeriodDays": 7,
  "autoSettlementEnabled": true
}
```

### 👤 인플루언서 API

#### 1. 내 정산 목록 조회
```
GET /api/influencer/settlements
```
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "settlements": [...],
    "stats": {
      "totalSettled": 5000000,
      "pending": 100000,
      "thisMonth": 200000
    },
    "eligibility": {
      "eligible": true,
      "potentialAmount": 150000
    },
    "pagination": {...}
  }
}
```

#### 2. 정산 요청
```
POST /api/influencer/settlements
```
**Response:**
```json
{
  "success": true,
  "data": {
    "settlementId": "cuid123",
    "amount": 150000,
    "message": "정산 요청이 완료되었습니다."
  }
}
```

#### 3. 정산 상세 조회
```
GET /api/influencer/settlements/[id]
```

## 정산 프로세스

### 1. 자동 정산 흐름
```
캠페인 완료 → 콘텐츠 승인 → 정산 대상 확인 → 정산 생성 → 알림 발송
```

### 2. 정산 상태
- `PENDING`: 대기 중
- `PROCESSING`: 처리 중
- `COMPLETED`: 완료
- `FAILED`: 실패

### 3. 정산 조건
- 캠페인 상태: COMPLETED
- 신청 상태: APPROVED
- 콘텐츠 상태: APPROVED
- 최소 금액: 10,000원 이상
- 계좌 정보: 등록 완료

## 사용 예시

### 관리자 수동 정산 실행
```javascript
const response = await fetch('/api/admin/settlements', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'all'
  })
});
```

### 인플루언서 정산 요청
```javascript
const response = await fetch('/api/influencer/settlements', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 설치 및 설정

### 1. 필요 패키지 설치
```bash
npm install node-cron @types/node-cron
```

### 2. 환경 변수 설정
```env
NODE_ENV=production  # 프로덕션에서 자동 스케줄러 시작
```

### 3. 데이터베이스 마이그레이션
```bash
npx prisma db push
```

## 주의사항

1. **node-cron 미설치 시**: 스케줄러는 작동하지 않지만 수동 정산은 가능합니다.
2. **프로덕션 환경**: `NODE_ENV=production`일 때만 자동 스케줄러가 시작됩니다.
3. **시간대**: 모든 스케줄은 한국 시간(Asia/Seoul) 기준입니다.
4. **최소 금액**: 10,000원 미만은 정산되지 않습니다.
5. **계좌 정보**: 인플루언서 프로필에 계좌 정보가 등록되어 있어야 합니다.

## 모니터링

### 로그 확인
- 일일 정산: 매일 00:00 KST
- 주간 리포트: 매주 월요일 09:00 KST
- 월간 정산: 매월 1일 10:00 KST

### 상태 확인
```javascript
GET /api/admin/settlements/scheduler
```

## 문제 해결

### 정산이 생성되지 않는 경우
1. 캠페인 상태가 COMPLETED인지 확인
2. 콘텐츠가 APPROVED 상태인지 확인
3. 최소 정산 금액을 충족하는지 확인
4. 인플루언서 계좌 정보가 등록되어 있는지 확인

### 스케줄러가 작동하지 않는 경우
1. node-cron 패키지 설치 확인
2. NODE_ENV가 production인지 확인
3. 스케줄러 상태 API로 실행 상태 확인