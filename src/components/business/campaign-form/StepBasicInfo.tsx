import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  level: number
  parentId?: string
  isActive: boolean
  children?: Category[]
}

interface StepBasicInfoProps {
  formData: {
    title: string
    description: string
    platform: string
    budgetType?: string
    budget?: number
    reviewPrice?: number
    categoryId?: string
  }
  setFormData: (data: {
    title: string
    description: string
    platform: string
    budgetType?: string
    budget?: number
    reviewPrice?: number
    categoryId?: string
    [key: string]: unknown
  }) => void
  platformIcons: {
    INSTAGRAM: React.ReactNode
    YOUTUBE: React.ReactNode
    TIKTOK: React.ReactNode
    FACEBOOK: React.ReactNode
    X: React.ReactNode
    NAVERBLOG: React.ReactNode
  }
}

export default function StepBasicInfo({ formData, setFormData, platformIcons }: StepBasicInfoProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // 선택된 카테고리 ID가 있으면 해당 카테고리 찾기
    if (formData.categoryId && categories.length > 0) {
      const findCategory = (cats: Category[]): Category | null => {
        for (const cat of cats) {
          if (cat.id === formData.categoryId) return cat
          if (cat.children) {
            const found = findCategory(cat.children)
            if (found) return found
          }
        }
        return null
      }
      setSelectedCategory(findCategory(categories))
    }
  }, [formData.categoryId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        // 계층 구조로 정리
        const organizeHierarchy = (cats: Category[]) => {
          const categoryMap = new Map<string, Category>()
          const rootCategories: Category[] = []

          cats.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] })
          })

          cats.forEach(cat => {
            const category = categoryMap.get(cat.id)!
            if (cat.parentId && categoryMap.has(cat.parentId)) {
              const parent = categoryMap.get(cat.parentId)!
              if (!parent.children) parent.children = []
              parent.children.push(category)
            } else {
              rootCategories.push(category)
            }
          })

          return rootCategories
        }

        setCategories(organizeHierarchy(data.categories))
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryPath = (category: Category | null): string => {
    if (!category) return '카테고리를 선택하세요'
    
    const path: string[] = [category.name]
    let current = category
    
    // 부모 카테고리 찾기
    while (current.parentId) {
      const parent = findCategoryById(categories, current.parentId)
      if (parent) {
        path.unshift(parent.name)
        current = parent
      } else {
        break
      }
    }
    
    return path.join(' > ')
  }

  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.children) {
        const found = findCategoryById(cat.children, id)
        if (found) return found
      }
    }
    return null
  }

  const renderCategoryOptions = (cats: Category[], level = 0) => {
    return cats.map(category => (
      <div key={category.id}>
        <button
          type="button"
          className={cn(
            "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between",
            formData.categoryId === category.id && "bg-blue-50 text-blue-600 font-medium"
          )}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
          onClick={() => {
            setFormData({ ...formData, categoryId: category.id })
            setSelectedCategory(category)
            setShowCategoryModal(false)
          }}
        >
          <div className="flex items-center gap-2">
            {category.icon && <span className="text-lg">{category.icon}</span>}
            <span>{category.name}</span>
            <span className="text-xs text-gray-500">
              ({category.level === 1 ? '대분류' : category.level === 2 ? '중분류' : '소분류'})
            </span>
          </div>
          {formData.categoryId === category.id && (
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
        {category.children && category.children.length > 0 && (
          <div>
            {renderCategoryOptions(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 기본 정보</h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="title">캠페인 제목</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="예: 신제품 출시 SNS 리뷰 캠페인"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">캠페인 설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="캠페인의 목적과 내용을 상세히 설명해주세요."
            className="mt-1 h-32"
            required
          />
        </div>

        {/* 카테고리 선택 */}
        <div>
          <Label>카테고리 선택</Label>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className={cn(
              "w-full mt-1 px-4 py-2 text-left border rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between",
              selectedCategory ? "border-gray-300" : "border-gray-200"
            )}
          >
            <span className={selectedCategory ? "text-gray-900" : "text-gray-500"}>
              {getCategoryPath(selectedCategory)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          {selectedCategory && (
            <p className="text-xs text-gray-500 mt-1">
              선택된 카테고리: {getCategoryPath(selectedCategory)}
            </p>
          )}
        </div>

        <div>
          <Label>플랫폼 선택</Label>
          <div className="flex justify-center gap-3 mt-2">
            <Button
              type="button"
              variant={formData.platform === 'INSTAGRAM' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'INSTAGRAM' && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              )}
              onClick={() => setFormData({...formData, platform: 'INSTAGRAM'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.INSTAGRAM}</span>
              <span className="text-xs">인스타그램</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'YOUTUBE' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'YOUTUBE' && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setFormData({...formData, platform: 'YOUTUBE'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.YOUTUBE}</span>
              <span className="text-xs">유튜브</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'TIKTOK' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'TIKTOK' && "bg-black hover:bg-gray-900"
              )}
              onClick={() => setFormData({...formData, platform: 'TIKTOK'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.TIKTOK}</span>
              <span className="text-xs">틱톡</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'FACEBOOK' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'FACEBOOK' && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => setFormData({...formData, platform: 'FACEBOOK'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.FACEBOOK}</span>
              <span className="text-xs">페이스북</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'X' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'X' && "bg-black hover:bg-gray-900"
              )}
              onClick={() => setFormData({...formData, platform: 'X'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.X}</span>
              <span className="text-xs">X</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'NAVERBLOG' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'NAVERBLOG' && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setFormData({...formData, platform: 'NAVERBLOG'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.NAVERBLOG}</span>
              <span className="text-xs">네이버</span>
            </Button>
          </div>
        </div>

        <div>
          <Label>캠페인 유형</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <button
              type="button"
              className={cn(
                "relative h-auto py-4 px-4 rounded-lg border-2 transition-all",
                formData.budgetType === 'FREE' 
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900" 
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
              onClick={() => setFormData({...formData, budgetType: 'FREE', budget: 0})}
            >
              <div className="text-center">
                <div className={cn(
                  "font-semibold mb-1",
                  formData.budgetType === 'FREE' ? "text-indigo-900" : "text-gray-900"
                )}>
                  무료 캠페인
                </div>
                <div className={cn(
                  "text-sm",
                  formData.budgetType === 'FREE' ? "text-indigo-700" : "text-gray-600"
                )}>
                  제품/서비스만 제공
                </div>
              </div>
            </button>
            <button
              type="button"
              className={cn(
                "relative h-auto py-4 px-4 rounded-lg border-2 transition-all",
                formData.budgetType === 'PAID' 
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900" 
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
              onClick={() => setFormData({...formData, budgetType: 'PAID'})}
            >
              <div className="text-center">
                <div className={cn(
                  "font-semibold mb-1",
                  formData.budgetType === 'PAID' ? "text-indigo-900" : "text-gray-900"
                )}>
                  유료 캠페인
                </div>
                <div className={cn(
                  "text-sm",
                  formData.budgetType === 'PAID' ? "text-indigo-700" : "text-gray-600"
                )}>
                  제품+현금 보상
                </div>
              </div>
            </button>
            <button
              type="button"
              className={cn(
                "relative h-auto py-4 px-4 rounded-lg border-2 transition-all",
                formData.budgetType === 'REVIEW' 
                  ? "border-orange-600 bg-orange-50 text-orange-900" 
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
              onClick={() => setFormData({...formData, budgetType: 'REVIEW'})}
            >
              <div className="text-center">
                <div className={cn(
                  "font-semibold mb-1",
                  formData.budgetType === 'REVIEW' ? "text-orange-900" : "text-gray-900"
                )}>
                  구매평 캠페인
                </div>
                <div className={cn(
                  "text-sm",
                  formData.budgetType === 'REVIEW' ? "text-orange-700" : "text-gray-600"
                )}>
                  구매평 작성 대가
                </div>
              </div>
            </button>
          </div>
        </div>

        {formData.budgetType === 'PAID' && (
          <div>
            <Label htmlFor="budget">캠페인 예산 (인플루언서 보상금)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => setFormData({...formData, budget: Number(e.target.value) || 0})}
              placeholder="예: 100000"
              className="mt-1"
              min="0"
              step="10000"
            />
            <p className="text-xs text-gray-500 mt-1">
              인플루언서에게 지급할 총 예산을 입력하세요. (VAT 포함)
            </p>
          </div>
        )}

        {formData.budgetType === 'REVIEW' && (
          <div>
            <Label htmlFor="reviewPrice">구매평 단가 (개당)</Label>
            <Input
              id="reviewPrice"
              type="number"
              value={formData.reviewPrice || ''}
              onChange={(e) => setFormData({...formData, reviewPrice: Number(e.target.value) || 0})}
              placeholder="예: 10000"
              className="mt-1"
              min="0"
              step="1000"
            />
            <p className="text-xs text-gray-500 mt-1">
              구매평 1개당 인플루언서에게 지급할 금액을 입력하세요. (VAT 포함)
            </p>
          </div>
        )}
      </div>

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">카테고리 선택</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">카테고리 로딩 중...</div>
                </div>
              ) : categories.length > 0 ? (
                renderCategoryOptions(categories)
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-500">등록된 카테고리가 없습니다.</div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}