# 콘솔 로그 정리 계획

## 📊 현재 상황 분석

### 전체 콘솔 로그 현황
- **총 1,276개** 콘솔 로그 발견 (317개 파일)
- **주요 문제점**:
  - 개발용 디버깅 로그가 프로덕션에 남아있음
  - 에러 처리와 정보 로그가 혼재
  - 일관성 없는 로깅 패턴
  - 성능에 영향을 줄 수 있는 과도한 로깅

### 로그 유형별 분류

#### 1. 🔴 제거 대상 (개발용 디버깅)
```typescript
// Google Translate Service
console.log('[Google Translate] 번역 요청 시작:', {...})
console.log('[Google Translate] 요청 본문:', requestBody)
console.log('[Google Translate] 응답 상태:', response.status)

// 기타 개발용 로그
console.log('Language changed to:', currentLanguage)
console.log('Loading more items...')
console.log(`Page loaded in ${Date.now() - startTime}ms`)
```

#### 2. ⚠️ 조건부 로그로 변경 (환경별 분기)
```typescript
// 성능 모니터링 로그
console.log(`[NEW] YouTube: SUCCESS - Found ${subscribers}`)
console.log('Warming popular caches...')
console.log('Cache warming completed')
```

#### 3. ✅ 유지 대상 (에러 및 중요 정보)
```typescript
// 에러 로그
console.error('Instagram scraping error:', error)
console.error('Error fetching category info:', error)
console.warn('AuthService.login is deprecated')

// 중요한 비즈니스 로직 로그
console.log(`✅ 정산 생성 성공: ${influencer.name}`)
console.log(`❌ 정산 생성 실패: ${influencer.name}`)
```

## 🎯 정리 전략

### Phase 1: 구조화된 로깅 시스템 활용
기존 `src/lib/logger.ts` 시스템을 활용하여 통일된 로깅

### Phase 2: 파일별 우선순위 정리
1. **Google Translate Service** - 과도한 디버깅 로그 (25개)
2. **YouTube Scraper** - 세부적인 스크래핑 로그 (12개)  
3. **Translation APIs** - 배치 번역 로그 (9개)
4. **Campaign/Page Components** - UI 상태 로그 (15개)
5. **Social Scraping Services** - API 호출 로그 (39개)

### Phase 3: 로깅 레벨 적용
```typescript
// 환경별 로깅 레벨
- Development: DEBUG (모든 로그)
- Staging: INFO (정보 로그)  
- Production: WARN (경고 및 에러만)
```

## 🔧 구체적 수정 방안

### 1. Google Translate Service 최적화
```typescript
// Before (제거 대상)
console.log('[Google Translate] 번역 요청 시작:', {...})
console.log('[Google Translate] 요청 본문:', requestBody)
console.log('[Google Translate] 응답 상태:', response.status)

// After (로거 시스템 활용)
import { logger } from '@/lib/logger'

logger.debug('Translation request started', 'GoogleTranslate', {...})
logger.debug('Request body prepared', 'GoogleTranslate', requestBody)
logger.info('Translation completed', 'GoogleTranslate', { status: response.status })
```

### 2. 에러 로그 표준화
```typescript
// Before
console.error('Error fetching category info:', error)

// After  
logger.errorWithException('Failed to fetch category info', error, 'CategoryPage')
```

### 3. 성능 로그 조건부 처리
```typescript
// Before
console.log(`Page loaded in ${Date.now() - startTime}ms`)

// After
if (process.env.NODE_ENV === 'development') {
  logger.debug(`Page loaded in ${Date.now() - startTime}ms`, 'Performance')
}
```

## 📋 정리 체크리스트

### 즉시 제거 대상 (17개 파일)
- [ ] `src/lib/services/google-translate.service.ts` - 번역 디버깅 로그
- [ ] `src/lib/services/youtube-scraper-new.service.ts` - 스크래핑 상세 로그  
- [ ] `src/app/api/admin/translations/batch/route.ts` - 배치 번역 로그
- [ ] `src/components/HomePage.tsx` - 언어 변경 로그
- [ ] `src/app/page.tsx` - 페이지 로딩 시간 로그

### 로거 시스템으로 변경 (25개 파일)
- [ ] Social scraper services (Instagram, YouTube, TikTok)
- [ ] Settlement service 로그
- [ ] Campaign 관련 API 로그
- [ ] Error boundary 로그

### 환경 조건 추가 (12개 파일)
- [ ] Performance monitoring 로그
- [ ] Cache warming 로그
- [ ] Development helper 로그

## 🎯 예상 효과

### 성능 개선
- 프로덕션 환경에서 **60-70% 로그 감소**
- 콘솔 출력으로 인한 성능 오버헤드 제거
- 메모리 사용량 최적화

### 유지보수성 향상
- 구조화된 로깅으로 디버깅 효율성 증대
- 환경별 로그 레벨로 운영 안정성 확보
- 일관된 로깅 패턴으로 코드 가독성 향상

### 보안 강화
- 민감한 정보(API 키 등) 로깅 방지
- 프로덕션 환경에서 디버깅 정보 노출 차단