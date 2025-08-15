# 메모리 최적화 가이드

## 📊 메모리 사용량 기준

### Node.js 애플리케이션 정상 범위
- **개발 환경**: 200-512MB (정상)
- **프로덕션 환경**: 256-768MB (정상)  
- **경고 수준**: 512-1024MB
- **위험 수준**: >1024MB

### Next.js 특성
- **초기 로딩**: 150-300MB
- **페이지 빌드**: 추가 100-200MB per page
- **핫 리로드**: 추가 50-100MB

## 🔍 현재 상태 분석

### 메모리 사용 현황
- RSS: 1550MB (위험 수준)
- External: 306MB
- Heap: ~1GB

### 주요 문제점
1. 메모리 누수 가능성
2. 캐시 과다 사용
3. 이벤트 리스너 미정리
4. 대용량 데이터 로딩

## ⚡ 적용된 최적화

### 1. Node.js 메모리 제한 조정
```json
// package.json
"dev": "NODE_OPTIONS='--max-old-space-size=512'"
```
- 기존 1024MB → 512MB로 감소
- 메모리 압박으로 GC 더 자주 실행

### 2. Next.js 설정 최적화
```javascript
// next.config.js
onDemandEntries: {
  maxInactiveAge: 15 * 1000, // 15초
  pagesBufferLength: 1, // 최소 버퍼
}
```

### 3. 웹팩 캐시 비활성화 (개발)
```javascript
config.cache = false; // 메모리 절약
```

## 🛠️ 추가 권장사항

### 1. 컴포넌트 최적화
```javascript
// React.memo 사용
export default memo(Header);

// 동적 임포트
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

### 2. 이벤트 리스너 정리
```javascript
useEffect(() => {
  const handler = () => {};
  window.addEventListener('scroll', handler);
  
  return () => {
    window.removeEventListener('scroll', handler);
  };
}, []);
```

### 3. 대용량 리스트 가상화
```javascript
// react-window 사용
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={35}
  width='100%'
>
  {Row}
</FixedSizeList>
```

### 4. 이미지 최적화
```javascript
// Next.js Image 컴포넌트 사용
import Image from 'next/image';

<Image
  src="/large-image.jpg"
  width={500}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

### 5. 정기적인 캐시 정리
```bash
# 개발 중 주기적 실행
npm run clean
npm run dev:clean
```

## 📈 모니터링

### 메모리 체크 스크립트
```bash
node scripts/check-memory.js
```

### 프로세스 모니터링
```bash
# macOS
top -pid $(pgrep -f "next dev")

# 리눅스
htop -p $(pgrep -f "next dev")
```

### Chrome DevTools
1. Chrome에서 `chrome://inspect` 접속
2. Node.js 프로세스 연결
3. Memory 프로파일링 실행

## 🚨 메모리 누수 징후

1. 시간이 지날수록 메모리 증가
2. 페이지 전환 시 메모리 미해제
3. 개발 서버 재시작 빈도 증가
4. 브라우저 탭 메모리 과다 사용

## 💡 베스트 프랙티스

1. **상태 관리 최소화**: 필요한 데이터만 상태로 관리
2. **비동기 정리**: AbortController 사용
3. **메모이제이션**: useMemo, useCallback 적절히 사용
4. **서버 컴포넌트**: 가능한 서버 컴포넌트 활용
5. **번들 크기 관리**: 동적 임포트와 코드 스플리팅

## 🔧 문제 해결 체크리스트

- [ ] .next 폴더 정리 (`npm run clean`)
- [ ] node_modules 재설치
- [ ] 브라우저 캐시 정리
- [ ] 불필요한 console.log 제거
- [ ] 대용량 상태 확인
- [ ] 무한 루프 체크
- [ ] 이벤트 리스너 정리 확인
- [ ] WebSocket 연결 관리
