# Duplicate Section ID Fix

## 문제 설명
섹션 순서 관리 시스템에서 동일한 ID를 가진 중복 섹션이 발생하여 React key 경고가 발생함.

## 해결 방법

### 1. API 레벨 중복 제거
`/src/app/api/admin/ui-config/route.ts`에서 저장 시 중복 ID 자동 제거:
- sectionOrder 배열에서 중복 ID 필터링
- customSections 배열에서 중복 ID 필터링

### 2. 컴포넌트 레벨 중복 방지
`/src/components/admin/ui-config/SectionOrderTab.tsx`에서:
- 커스텀 섹션 로드 시 이미 사용된 ID 체크
- 중복 발견 시 새로운 고유 ID 생성
- 중복 정리 버튼 제공 (localStorage 초기화 및 페이지 새로고침)

### 3. 저장소 초기화
중복 정리 버튼 클릭 시:
1. 기본 섹션만 유지하고 중복 제거
2. localStorage에서 ui-config-storage 제거
3. 데이터베이스에 정리된 설정 저장
4. 페이지 새로고침으로 완전히 초기화

## 테스트
1. 관리자 페이지 접속: http://localhost:3000/admin/ui-config
2. 섹션 순서 관리 탭 확인
3. 중복 섹션 정리 버튼이 나타나면 클릭
4. 페이지가 새로고침되고 중복이 제거됨 확인