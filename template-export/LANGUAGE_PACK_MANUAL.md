# 🌐 언어팩 시스템 완전 가이드

## 개요
Revu Platform의 언어팩 시스템은 다국어 지원을 위한 강력하고 유연한 시스템입니다. 3개 언어 제한과 자동 번역 기능을 제공합니다.

## 시스템 특징

### 🔒 3개 언어 제한 시스템
- **초기 설정**: 최초 1회만 3개 언어 선택 가능
- **영구 잠금**: 설정 후 언어 변경 불가능
- **추가 비용**: 추가 언어는 유료 옵션
- **지원 언어**: 한국어(ko), 영어(en), 일본어(jp)

### ⚡ 성능 최적화
- **캐싱**: 1분 TTL 메모리 캐시
- **효율적 조회**: 키별 단일 쿼리
- **Fallback 체인**: jp → en → ko → 원본 키

## 언어팩 구조

### 데이터베이스 스키마
```sql
CREATE TABLE LanguagePack (
    key  String @id @unique
    ko   String
    en   String?
    jp   String?
)
```

### 키 네이밍 규칙
```typescript
// 계층적 구조 사용
'category.beauty'           // 카테고리 - 뷰티
'header.menu.campaigns'     // 헤더 메뉴 - 캠페인
'badge.hot'                // 배지 - 핫
'promo.title'              // 프로모션 - 제목
```

## 사용법

### 1. 번역 함수 사용
```typescript
// 서버 컴포넌트에서
import { getTranslation } from '@/lib/translation';

const MyComponent = async ({ language = 'ko' }) => {
  const title = await getTranslation('category.beauty', language);
  return <h1>{title}</h1>;
};
```

### 2. 클라이언트 컴포넌트에서
```typescript
'use client';
import { useLanguage } from '@/hooks/useLanguage';

const MyClientComponent = () => {
  const { t, language } = useLanguage();
  return <h1>{t('category.beauty')}</h1>;
};
```

### 3. API에서 번역 적용
```typescript
// UI Config API에서의 사용 예시
const categoryMenus = [
  { 
    id: 'cat-1', 
    name: await getTranslation('category.beauty', language),
    categoryId: 'beauty' 
  },
];
```

## 언어팩 데이터

### 카테고리 번역
```javascript
// category.* 키들
{ key: 'category.beauty', ko: '뷰티', en: 'Beauty', jp: 'ビューティー' }
{ key: 'category.fashion', ko: '패션', en: 'Fashion', jp: 'ファッション' }
{ key: 'category.food', ko: '음식', en: 'Food', jp: 'フード' }
{ key: 'category.travel', ko: '여행', en: 'Travel', jp: '旅行' }
{ key: 'category.tech', ko: '테크', en: 'Tech', jp: 'テック' }
{ key: 'category.fitness', ko: '피트니스', en: 'Fitness', jp: 'フィットネス' }
{ key: 'category.lifestyle', ko: '라이프스타일', en: 'Lifestyle', jp: 'ライフスタイル' }
{ key: 'category.pet', ko: '반려동물', en: 'Pet', jp: 'ペット' }
{ key: 'category.parenting', ko: '육아', en: 'Parenting', jp: '子育て' }
{ key: 'category.game', ko: '게임', en: 'Game', jp: 'ゲーム' }
{ key: 'category.education', ko: '교육', en: 'Education', jp: '教育' }
```

### 배지 번역
```javascript  
// badge.* 키들
{ key: 'badge.hot', ko: '인기', en: 'HOT', jp: '人気' }
{ key: 'badge.new', ko: '신규', en: 'NEW', jp: '新規' }
{ key: 'badge.sale', ko: '세일', en: 'SALE', jp: 'セール' }
```

### 퀵링크 번역
```javascript
// quicklink.* 키들  
{ key: 'quicklink.events', ko: '이벤트', en: 'Events', jp: 'イベント' }
{ key: 'quicklink.coupons', ko: '쿠폰', en: 'Coupons', jp: 'クーポン' }
{ key: 'quicklink.ranking', ko: '랭킹', en: 'Ranking', jp: 'ランキング' }
```

### 프로모션 번역
```javascript
// promo.* 키들
{ key: 'promo.title', ko: '처음이니까, 수수료 50% 할인', en: 'First time? 50% off fees', jp: '初回なので手数料50%割引' }
{ key: 'promo.subtitle', ko: '링크픽 신규가입 혜택', en: 'LinkPick new member benefit', jp: 'LinkPick新規登録特典' }
```

### 헤더 번역
```javascript
// header.* 키들
{ key: 'header.menu.campaigns', ko: '캠페인', en: 'Campaigns', jp: 'キャンペーン' }
{ key: 'header.menu.influencers', ko: '인플루언서', en: 'Influencers', jp: 'インフルエンサー' }
{ key: 'header.menu.community', ko: '커뮤니티', en: 'Community', jp: 'コミュニティ' }
{ key: 'header.menu.pricing', ko: '요금제', en: 'Pricing', jp: '料金プラン' }
{ key: 'header.cta.start', ko: '시작하기', en: 'Get Started', jp: '始める' }
```

## 자동 번역 시스템

### Google Translate 연동
```typescript
// 자동 번역 API 호출
POST /api/admin/language-packs/auto-translate
{
  "key": "new.key",
  "koText": "한국어 텍스트",
  "targetLanguages": ["en", "jp"]
}
```

### 번역 품질 관리
- **수동 검토**: 자동 번역 후 수동 편집 가능
- **컨텍스트 고려**: 업무 도메인에 맞는 번역
- **일관성 유지**: 용어집 기반 번역

## 캐싱 시스템

### 메모리 캐시 구현
```typescript
// 1분 TTL 캐시
const translationCache = new Map<string, any>();
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1분

async function getTranslation(key: string, language: string = 'ko') {
  // 캐시 만료 체크
  const now = Date.now();
  if (now - cacheTimestamp > CACHE_TTL) {
    translationCache.clear();
    cacheTimestamp = now;
  }
  
  const cacheKey = `${key}_${language}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  // DB에서 조회 후 캐시 저장
  const translation = await prisma.languagePack.findUnique({ where: { key } });
  const result = translation?.[language] || translation?.ko || key;
  
  translationCache.set(cacheKey, result);
  return result;
}
```

### 캐시 무효화
- **자동**: 1분 TTL로 자동 만료
- **수동**: 번역 업데이트 시 즉시 클리어
- **전역**: 서버 재시작 시 완전 클리어

## 관리자 기능

### 번역 관리 페이지
**경로**: `/admin/translations`

**주요 기능**:
1. **언어팩 설정** (최초 1회만)
2. **키별 번역 편집**  
3. **자동 번역 실행**
4. **번역 미리보기**
5. **일괄 업데이트**

### 번역 설정 잠금 시스템
```typescript
interface LanguagePackSetup {
  isConfigured: boolean;      // 설정 완료 여부
  languages: string[];        // 선택된 언어들 (정확히 3개)
  configuredAt: Date | null;  // 설정 완료 시간
  maxLanguages: 3;           // 최대 언어 수 제한
}
```

## API 엔드포인트

### 번역 조회
```typescript
// 특정 키 번역 조회
GET /api/admin/language-packs/[key]

// 전체 키 목록
GET /api/admin/language-pack-keys
```

### 번역 업데이트
```typescript  
// 단일 키 업데이트
PUT /api/admin/language-packs/[key]
{
  "ko": "한국어",
  "en": "English", 
  "jp": "日本語"
}

// 일괄 번역 업데이트
POST /api/admin/language-packs/batch
{
  "translations": [
    { "key": "key1", "ko": "값1", "en": "value1", "jp": "値1" },
    { "key": "key2", "ko": "값2", "en": "value2", "jp": "値2" }
  ]
}
```

### 자동 번역
```typescript
// Google Translate 자동 번역
POST /api/admin/language-packs/auto-translate  
{
  "key": "new.key",
  "sourceText": "번역할 텍스트",
  "sourceLanguage": "ko", 
  "targetLanguages": ["en", "jp"]
}
```

## 시드 데이터 관리

### 언어팩 시드 파일
**파일**: `language-pack/seed-language-pack.js`

```javascript
const languagePackData = [
  // 관리자 페이지 번역
  { key: 'admin.dashboard', ko: '대시보드', en: 'Dashboard', jp: 'ダッシュボード' },
  
  // 헤더 번역  
  { key: 'header.menu.campaigns', ko: '캠페인', en: 'Campaigns', jp: 'キャンペーン' },
  
  // 카테고리 번역
  { key: 'category.beauty', ko: '뷰티', en: 'Beauty', jp: 'ビューティー' },
  
  // ... 더 많은 번역 데이터
];
```

### 시드 실행
```bash
# 언어팩 시드 데이터 추가
node language-pack/seed-language-pack.js

# UI 섹션 텍스트 추가  
node language-pack/seed-ui-sections-texts.js
```

## 확장 가이드

### 새 언어 추가 (개발자용)
1. 데이터베이스 스키마에 새 컬럼 추가
2. `getTranslation` 함수 fallback 체인 업데이트  
3. 어드민 UI에 새 언어 옵션 추가
4. 자동 번역 API에 언어 추가

### 새 번역 키 추가
1. 키 네이밍 규칙 따르기 (`domain.subdomain.key`)
2. 시드 파일에 기본값 추가
3. 필요한 곳에 `getTranslation()` 호출 추가

### 성능 튜닝
- 캐시 TTL 조정 (기본 1분)
- 자주 사용되는 키 프리로딩
- 사용하지 않는 키 정리

## 문제 해결

### 일반적인 문제
1. **번역이 표시되지 않음**
   - 키 철자 확인
   - 캐시 클리어 후 재시도

2. **자동 번역 실패**  
   - Google Translate API 키 확인
   - API 호출 한도 확인

3. **언어 설정 변경 불가**
   - 정상 동작 (보안 기능)
   - 데이터베이스에서 직접 수정 가능 (비권장)

### 디버깅 방법
```typescript
// 번역 디버깅
console.log('Translation cache:', translationCache);
console.log('Cache timestamp:', new Date(cacheTimestamp));

// 데이터베이스 직접 확인
npx prisma studio
```

---

🌍 **다국어 지원으로 글로벌 서비스를 만들어보세요!**