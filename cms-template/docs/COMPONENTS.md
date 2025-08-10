# 📦 CMS 컴포넌트 라이브러리

REVU Platform에서 추출한 핵심 컴포넌트들의 사용법과 커스터마이징 가이드입니다.

## 🏗️ 레이아웃 컴포넌트

### AdminLayout

관리자 페이지의 기본 레이아웃 컴포넌트입니다.

```tsx
// 기본 사용법
import AdminLayout from '@/components/AdminLayout'

export default function AdminPage() {
  return (
    <AdminLayout>
      <h1>관리자 페이지 내용</h1>
    </AdminLayout>
  )
}

// 특성
- 자동 권한 체크 (ADMIN 타입만 접근 가능)
- 사이드바 네비게이션
- 상단 헤더 (사용자 정보, 로그아웃)
- 반응형 디자인 (모바일에서 접을 수 있는 사이드바)
```

### BusinessLayout

비즈니스 사용자용 레이아웃 컴포넌트입니다.

```tsx
// 사용 예시
import BusinessLayout from '@/components/BusinessLayout'

export default function BusinessDashboard() {
  return (
    <BusinessLayout>
      <div className="space-y-6">
        <h1>비즈니스 대시보드</h1>
        {/* 대시보드 내용 */}
      </div>
    </BusinessLayout>
  )
}

// 특성
- BUSINESS 타입 사용자 전용
- 간소화된 네비게이션
- 비즈니스 전용 메뉴 구조
```

## 📊 대시보드 컴포넌트

### StatCard

통계 정보를 표시하는 카드 컴포넌트입니다.

```tsx
import { StatCard } from '@/components/ui/StatCard'
import { UsersIcon } from '@heroicons/react/24/outline'

<StatCard
  title="총 사용자"
  value="12,345"
  change={12.5}
  icon={UsersIcon}
  color="bg-blue-500"
/>

// Props
interface StatCardProps {
  title: string
  value: string | number
  change?: number  // 증감율 (%)
  icon?: React.ComponentType
  color?: string   // 아이콘 배경색
  trend?: 'up' | 'down' | 'neutral'
}
```

### ChartContainer

차트를 감싸는 컨테이너 컴포넌트입니다.

```tsx
import { ChartContainer } from '@/components/ui/ChartContainer'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

<ChartContainer title="사용자 증가 추이" className="h-80">
  <LineChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Line dataKey="users" stroke="#3B82F6" />
  </LineChart>
</ChartContainer>

// Props
interface ChartContainerProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode  // 우상단 액션 버튼들
}
```

## 🎛️ UI 섹션 관리

### SectionRenderer

동적 섹션을 렌더링하는 컴포넌트입니다.

```tsx
import { SectionRenderer } from '@/components/sections/SectionRenderer'
import { UISection } from '@/types/sections'

const section: UISection = {
  id: 'hero-section',
  name: '히어로 배너',
  type: 'hero',
  enabled: true,
  order: 1,
  config: {
    title: '메인 타이틀',
    subtitle: '서브 타이틀',
    image: '/hero.jpg'
  }
}

<SectionRenderer section={section} />
```

### SectionEditor

섹션 설정을 편집하는 컴포넌트입니다.

```tsx
import { SectionEditor } from '@/components/admin/SectionEditor'

<SectionEditor
  section={section}
  onSave={(updatedSection) => {
    // 섹션 업데이트 로직
    updateSection(updatedSection)
  }}
  onCancel={() => {
    // 취소 로직
    closeEditor()
  }}
/>

// 특성
- 섹션 타입별 맞춤 편집 폼
- 실시간 미리보기
- 드래그 앤 드롭 요소 순서 변경
- 이미지 업로드 지원
```

### DragDropList

드래그 앤 드롭으로 순서를 변경할 수 있는 리스트입니다.

```tsx
import { DragDropList } from '@/components/ui/DragDropList'

<DragDropList
  items={sections}
  onReorder={(reorderedItems) => {
    setSections(reorderedItems)
  }}
  renderItem={(item) => (
    <div className="p-4 bg-white rounded-lg shadow">
      {item.name}
    </div>
  )}
/>
```

## 📝 폼 컴포넌트

### FormInput

표준 입력 필드 컴포넌트입니다.

```tsx
import { FormInput } from '@/components/ui/FormInput'

<FormInput
  label="사용자명"
  type="text"
  value={username}
  onChange={setUsername}
  placeholder="사용자명을 입력하세요"
  error={errors.username}
  required
/>

// Props
interface FormInputProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'number'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  helperText?: string
}
```

### FormSelect

선택 드롭다운 컴포넌트입니다.

```tsx
import { FormSelect } from '@/components/ui/FormSelect'

<FormSelect
  label="사용자 타입"
  value={userType}
  onChange={setUserType}
  options={[
    { value: 'USER', label: '일반 사용자' },
    { value: 'BUSINESS', label: '비즈니스' },
    { value: 'ADMIN', label: '관리자' }
  ]}
  placeholder="타입을 선택하세요"
/>
```

### ImageUpload

이미지 업로드 컴포넌트입니다.

```tsx
import { ImageUpload } from '@/components/ui/ImageUpload'

<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  onUpload={async (file) => {
    const url = await uploadImage(file)
    return url
  }}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  preview
/>

// 특성
- 드래그 앤 드롭 지원
- 이미지 미리보기
- 파일 크기 및 형식 유효성 검사
- 프로그레스 바
```

## 📊 테이블 컴포넌트

### DataTable

정렬, 필터, 페이지네이션이 가능한 테이블 컴포넌트입니다.

```tsx
import { DataTable } from '@/components/ui/DataTable'

const columns = [
  { key: 'name', label: '이름', sortable: true },
  { key: 'email', label: '이메일', sortable: true },
  { key: 'type', label: '타입', filterable: true },
  { key: 'createdAt', label: '생성일', sortable: true, type: 'date' },
]

<DataTable
  data={users}
  columns={columns}
  onSort={(column, direction) => {
    // 정렬 로직
  }}
  onFilter={(filters) => {
    // 필터링 로직
  }}
  onPageChange={(page) => {
    // 페이지 변경 로직
  }}
  pageSize={20}
  totalCount={totalUsers}
  currentPage={currentPage}
/>
```

## 🔔 알림 컴포넌트

### Toast

토스트 알림 컴포넌트입니다.

```tsx
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const { showToast } = useToast()
  
  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: '성공!',
      message: '데이터가 저장되었습니다.',
      duration: 3000
    })
  }
  
  return <button onClick={handleSuccess}>저장</button>
}

// 타입별 스타일
- success: 녹색 배경
- error: 빨간색 배경
- warning: 노란색 배경
- info: 파란색 배경
```

### AlertDialog

확인/취소 다이얼로그 컴포넌트입니다.

```tsx
import { AlertDialog } from '@/components/ui/AlertDialog'

<AlertDialog
  isOpen={isDeleteDialogOpen}
  onClose={() => setIsDeleteDialogOpen(false)}
  onConfirm={() => {
    deleteUser(selectedUserId)
    setIsDeleteDialogOpen(false)
  }}
  title="사용자 삭제"
  message="이 작업은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?"
  confirmText="삭제"
  confirmColor="danger"
/>
```

## 📈 차트 컴포넌트

### LineChart

라인 차트 래퍼 컴포넌트입니다.

```tsx
import { LineChart } from '@/components/charts/LineChart'

<LineChart
  data={chartData}
  xKey="date"
  yKey="users"
  title="사용자 증가 추이"
  color="#3B82F6"
  height={300}
/>
```

### BarChart

막대 차트 래퍼 컴포넌트입니다.

```tsx
import { BarChart } from '@/components/charts/BarChart'

<BarChart
  data={categoryData}
  xKey="category"
  yKey="count"
  title="카테고리별 캠페인 수"
  colors={['#3B82F6', '#10B981', '#F59E0B']}
/>
```

## 🎯 버튼 컴포넌트

### Button

표준 버튼 컴포넌트입니다.

```tsx
import { Button } from '@/components/ui/Button'

// 기본 버튼
<Button onClick={handleClick}>
  클릭하세요
</Button>

// 변형들
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// 크기
<Button size="sm">작게</Button>
<Button size="md">보통</Button>
<Button size="lg">크게</Button>

// 상태
<Button loading>로딩 중...</Button>
<Button disabled>비활성화</Button>
```

### IconButton

아이콘 버튼 컴포넌트입니다.

```tsx
import { IconButton } from '@/components/ui/IconButton'
import { PencilIcon } from '@heroicons/react/24/outline'

<IconButton
  icon={PencilIcon}
  onClick={handleEdit}
  tooltip="편집"
  variant="ghost"
  size="sm"
/>
```

## 🎨 커스터마이징

### 테마 설정

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      }
    }
  }
}

// CSS 변수로 테마 변경
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-secondary: #a78bfa;
}
```

### 컴포넌트 확장

```tsx
// 기본 StatCard를 확장한 CustomStatCard
import { StatCard } from '@/components/ui/StatCard'

interface CustomStatCardProps extends StatCardProps {
  subtitle?: string
  trend?: 'up' | 'down'
}

export function CustomStatCard({ subtitle, trend, ...props }: CustomStatCardProps) {
  return (
    <div className="relative">
      <StatCard {...props} />
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
          trend === 'up' ? 'bg-green-400' : 'bg-red-400'
        }`} />
      )}
    </div>
  )
}
```

## 📱 반응형 지원

### 브레이크포인트

```tsx
// 컴포넌트에서 반응형 처리
function ResponsiveComponent() {
  return (
    <div className={`
      grid gap-4
      grid-cols-1        // 모바일: 1열
      sm:grid-cols-2     // 640px+: 2열
      md:grid-cols-3     // 768px+: 3열
      lg:grid-cols-4     // 1024px+: 4열
      xl:grid-cols-6     // 1280px+: 6열
    `}>
      {/* 아이템들 */}
    </div>
  )
}
```

### 모바일 최적화

```tsx
// 모바일에서 다른 레이아웃
function MobileOptimized() {
  return (
    <>
      {/* 데스크톱 버전 */}
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
      
      {/* 모바일 버전 */}
      <div className="md:hidden">
        <MobileLayout />
      </div>
    </>
  )
}
```

## 🧪 테스팅

### 컴포넌트 테스트

```tsx
// StatCard.test.tsx
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/ui/StatCard'
import { UsersIcon } from '@heroicons/react/24/outline'

test('StatCard renders correctly', () => {
  render(
    <StatCard
      title="Test Stat"
      value="123"
      change={10}
      icon={UsersIcon}
    />
  )
  
  expect(screen.getByText('Test Stat')).toBeInTheDocument()
  expect(screen.getByText('123')).toBeInTheDocument()
  expect(screen.getByText('10%')).toBeInTheDocument()
})
```

---

각 컴포넌트는 독립적으로 사용 가능하며, 필요에 따라 조합하여 복잡한 UI를 구성할 수 있습니다. 🚀