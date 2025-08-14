'use client'

import { useState } from 'react'
import { Check, Star } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: React.ReactNode
}

interface CategorySelectorProps {
  mainCategory: string
  subCategories: string[]
  onMainCategoryChange: (category: string) => void
  onSubCategoriesChange: (categories: string[]) => void
}

const categories: Category[] = [
  {
    id: 'beauty',
    name: '뷰티',
    icon: <span>💄</span>
  },
  {
    id: 'fashion',
    name: '패션',
    icon: <span>👗</span>
  },
  {
    id: 'food',
    name: '음식',
    icon: <span>🍔</span>
  },
  {
    id: 'travel',
    name: '여행',
    icon: <span>✈️</span>
  },
  {
    id: 'tech',
    name: '테크',
    icon: <span>💻</span>
  },
  {
    id: 'fitness',
    name: '피트니스',
    icon: <span>💪</span>
  },
  {
    id: 'lifestyle',
    name: '라이프스타일',
    icon: <span>🏠</span>
  },
  {
    id: 'pet',
    name: '반려동물',
    icon: <span>🐕</span>
  },
  {
    id: 'parenting',
    name: '육아',
    icon: <span>👶</span>
  },
  {
    id: 'game',
    name: '게임',
    icon: <span>🎮</span>
  },
  {
    id: 'education',
    name: '교육',
    icon: <span>📚</span>
  },
  {
    id: 'facebook',
    name: '페이스북',
    icon: <span>📘</span>
  }
]

export default function CategorySelector({
  mainCategory,
  subCategories,
  onMainCategoryChange,
  onSubCategoriesChange
}: CategorySelectorProps) {
  const [showAll, setShowAll] = useState(false)
  
  const displayCategories = showAll ? categories : categories.slice(0, 8)

  const handleMainCategorySelect = (categoryId: string) => {
    onMainCategoryChange(categoryId)
    // 메인 카테고리가 변경되면 서브 카테고리에서 제거
    if (subCategories.includes(categoryId)) {
      onSubCategoriesChange(subCategories.filter(c => c !== categoryId))
    }
  }

  const handleSubCategoryToggle = (categoryId: string) => {
    // 메인 카테고리는 서브 카테고리로 선택할 수 없음
    if (categoryId === mainCategory) return

    if (subCategories.includes(categoryId)) {
      onSubCategoriesChange(subCategories.filter(c => c !== categoryId))
    } else {
      onSubCategoriesChange([...subCategories, categoryId])
    }
  }

  return (
    <div className="space-y-6">
      {/* 대표 카테고리 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          대표 카테고리 <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-2">(아이콘으로 표시됩니다)</span>
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {displayCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleMainCategorySelect(category.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all
                ${mainCategory === category.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {mainCategory === category.id && (
                <Star className="absolute top-1 right-1 w-4 h-4 text-indigo-600 fill-current" />
              )}
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-xs font-medium text-gray-700">
                {category.name}
              </div>
            </button>
          ))}
        </div>
        
        {!showAll && categories.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
          >
            더 많은 카테고리 보기 ({categories.length - 8}개)
          </button>
        )}
      </div>

      {/* 추가 카테고리 선택 (기타) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          추가 카테고리
          <span className="text-xs text-gray-500 ml-2">(선택사항, 복수 선택 가능)</span>
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {displayCategories.map((category) => {
            const isMainCategory = category.id === mainCategory
            const isSelected = subCategories.includes(category.id)
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSubCategoryToggle(category.id)}
                disabled={isMainCategory}
                className={`
                  relative p-3 rounded-lg border-2 transition-all
                  ${isMainCategory
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {isSelected && !isMainCategory && (
                  <Check className="absolute top-1 right-1 w-4 h-4 text-blue-600" />
                )}
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-xs font-medium text-gray-700">
                  {category.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택된 카테고리 요약 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-indigo-600 fill-current" />
            <span className="font-medium">대표 카테고리:</span>
            <span className="text-gray-900">
              {categories.find(c => c.id === mainCategory)?.name || '선택하세요'}
            </span>
          </div>
          {subCategories.length > 0 && (
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="font-medium">추가 카테고리:</span>
                <span className="text-gray-900 ml-2">
                  {subCategories
                    .map(id => categories.find(c => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}