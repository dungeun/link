# 📄 메인 페이지 섹션 가이드

## 개요
Revu Platform의 메인 페이지는 6개의 핵심 섹션으로 구성되어 있으며, 각 섹션은 완전히 커스터마이징 가능합니다.

## 섹션 구조

### 1. 히어로 섹션 (Hero) 🎯
**위치**: 페이지 최상단  
**기능**: 브랜드 메시지와 주요 액션 유도

**구성 요소**:
- 자동 슬라이드 배너 (6개 슬라이드)
- 다양한 테마 (blue, dark, green, pink)
- 태그, 제목, 부제목 지원
- 그라디언트 배경

**슬라이드 예시**:
```typescript
{
  id: 'slide-1',
  type: 'blue',
  tag: '새로운 시작',
  title: '브랜드와 함께하는\n완벽한 캠페인',
  subtitle: '최고 품질의 콘텐츠로 - 당신의 기대',
  bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600'
}
```

**커스터마이징**:
- 어드민 → UI 설정 → 히어로 섹션
- 슬라이드 순서 변경 가능
- 표시/숨김 토글
- 다국어 번역 지원

### 2. 카테고리 섹션 (Category) 🏷️
**위치**: 히어로 하단  
**기능**: 컨텐츠 카테고리별 탐색

**지원 카테고리** (11개):
- 뷰티 (Beauty) 💄
- 패션 (Fashion) 👗
- 음식 (Food) 🍕 + HOT 배지
- 여행 (Travel) ✈️
- 테크 (Tech) 💻
- 피트니스 (Fitness) 💪
- 라이프스타일 (Lifestyle) 🌸
- 반려동물 (Pet) 🐕
- 육아 (Parenting) 👶
- 게임 (Game) 🎮 + NEW 배지
- 교육 (Education) 📚

**배지 시스템**:
```typescript
// badge.hot, badge.new, badge.sale
{ badge: 'badge.hot' } // "인기", "HOT", "人気"
```

**데이터 구조**:
```typescript
interface CategoryMenu {
  id: string;
  name: string;        // 번역 키
  categoryId: string;  // URL 경로용
  icon: string;
  badge?: string;      // 선택적 배지
  order: number;
  visible: boolean;
}
```

### 3. 퀵링크 섹션 (Quick Links) ⚡
**위치**: 카테고리 하단  
**기능**: 주요 기능 빠른 접근

**기본 퀵링크** (3개):
- 🎁 이벤트 → `/events`
- 🎟️ 쿠폰 → `/coupons`  
- 🏆 랭킹 → `/ranking`

**확장 방법**:
```typescript
// 새 퀵링크 추가
{
  id: 'quick-4',
  title: 'quicklink.new_feature', // 번역 키
  icon: '🎪',
  link: '/new-feature',
  order: 4,
  visible: true
}
```

### 4. 프로모션 배너 (Promo Banner) 🎊
**위치**: 퀵링크 하단  
**기능**: 주요 프로모션 및 혜택 안내

**구성 요소**:
- 📦 아이콘
- 제목: "처음이니까, 수수료 50% 할인"
- 부제목: "링크픽 신규가입 혜택"
- 다국어 번역 지원

**다국어 지원**:
```javascript
// promo.title
ko: '처음이니까, 수수료 50% 할인'
en: 'First time? 50% off fees'
jp: '初回なので手数料50%割引'
```

### 5. 랭킹 섹션 (Ranking) 🏆
**위치**: 프로모션 하단  
**기능**: 인기 캠페인/인플루언서 순위

**특징**:
- 실시간 랭킹 데이터
- 카테고리별 필터링
- 페이지네이션 지원
- 좋아요/저장 기능

### 6. 추천 섹션 (Recommended) ⭐
**위치**: 페이지 하단  
**기능**: 개인화된 추천 컨텐츠

**추천 알고리즘**:
- 사용자 관심사 기반
- 최근 활동 분석
- 인기도 가중치

## 섹션 순서 관리

### 순서 설정
```typescript
const sectionOrder = [
  { id: 'hero', type: 'hero', order: 1, visible: true },
  { id: 'category', type: 'category', order: 2, visible: true },
  { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
  { id: 'promo', type: 'promo', order: 4, visible: true },
  { id: 'ranking', type: 'ranking', order: 5, visible: true },
  { id: 'recommended', type: 'recommended', order: 6, visible: true }
];
```

### 어드민에서 순서 변경
1. 어드민 → UI 설정 → 섹션 순서
2. 드래그 앤 드롭으로 순서 변경
3. 표시/숨김 토글
4. 실시간 미리보기

## UI Config API 연동

### API 엔드포인트
```typescript
GET /api/ui-config?lang=ko
```

### 응답 구조
```typescript
interface UIConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  mainPage: {
    heroSlides: HeroSlide[];
    categoryMenus: CategoryMenu[];
    quickLinks: QuickLink[];
    promoBanner: PromoBanner;
    sectionOrder: SectionOrder[];
  };
}
```

### 번역 적용
```typescript
// 서버에서 번역 적용
const categoryMenus = [
  { 
    id: 'cat-1', 
    name: await getTranslation('category.beauty', language),
    categoryId: 'beauty' 
  },
];
```

## 컴포넌트 구조

### 메인 컴포넌트
```tsx
// main-sections/HomeSections.tsx
const HomeSections = ({ config, language }) => {
  return (
    <div className="min-h-screen">
      {config.mainPage.sectionOrder
        .filter(section => section.visible)
        .sort((a, b) => a.order - b.order)
        .map(section => renderSection(section, config))}
    </div>
  );
};
```

### 개별 섹션 컴포넌트
```tsx
// HeroSection.tsx
const HeroSection = ({ slides }) => (
  <section className="hero-section">
    <AutoSlideBanner slides={slides} />
  </section>
);

// CategorySection.tsx  
const CategorySection = ({ categories }) => (
  <section className="category-section">
    <CategoryGrid categories={categories} />
  </section>
);
```

## 스타일링

### 반응형 디자인
```css
/* 데스크톱 */
@media (min-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 모바일 */
@media (max-width: 767px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 테마 색상
```css
/* 히어로 배경 그라디언트 */
.hero-blue { @apply bg-gradient-to-br from-blue-400 to-blue-600; }
.hero-dark { @apply bg-gradient-to-br from-gray-800 to-gray-900; }
.hero-green { @apply bg-gradient-to-br from-green-400 to-green-600; }
.hero-pink { @apply bg-gradient-to-br from-pink-400 to-pink-600; }

/* 카테고리 아이콘 색상 */
.category-icon { @apply text-blue-500 hover:text-blue-600; }

/* 배지 스타일 */
.badge-hot { @apply bg-red-500 text-white; }
.badge-new { @apply bg-green-500 text-white; }
.badge-sale { @apply bg-orange-500 text-white; }
```

## 성능 최적화

### 이미지 최적화
```typescript
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/images/hero-bg.jpg"
  alt="Hero Background"
  width={1920}
  height={1080}
  priority // 히어로 이미지는 우선 로딩
/>
```

### 지연 로딩
```typescript
// 스크롤 기반 섹션 로딩
const LazySection = dynamic(() => import('./RankingSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false
});
```

### 캐싱 전략
- UI Config: 1분 TTL 캐시
- 이미지: CDN 캐싱
- API 응답: Redis 캐싱

## 확장 가이드

### 새 섹션 추가
1. 섹션 컴포넌트 생성
2. `sectionOrder`에 추가
3. 어드민 UI에 관리 인터페이스 추가
4. API에서 데이터 제공

### 섹션 커스터마이징
```typescript
// 새로운 섹션 타입
interface CustomSection {
  id: string;
  type: 'custom';
  title: string;
  data: any;
  order: number;
  visible: boolean;
}
```

### 애니메이션 추가
```css
/* CSS 애니메이션 */
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.section-animate {
  animation: slideIn 0.8s ease-out;
}
```

## 접근성 (A11y)

### 키보드 네비게이션
```tsx
// 키보드 접근 가능한 카테고리 버튼
<button
  className="category-item"
  tabIndex={0}
  aria-label={`${categoryName} 카테고리 보기`}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

### ARIA 라벨
```tsx
// 섹션 의미 구조
<section 
  aria-labelledby="hero-title"
  role="banner"
>
  <h1 id="hero-title">{heroTitle}</h1>
</section>
```

## 문제 해결

### 일반적인 문제
1. **섹션이 표시되지 않음**
   - `visible: true` 확인
   - API 응답 데이터 확인

2. **번역이 적용되지 않음**  
   - 언어팩 키 존재 확인
   - 캐시 클리어

3. **순서가 바뀌지 않음**
   - `order` 값 확인
   - 배열 정렬 로직 확인

---

🎨 **아름다운 메인 페이지로 사용자를 매료시키세요!**