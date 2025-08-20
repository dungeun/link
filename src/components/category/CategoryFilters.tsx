'use client'

import { memo } from 'react'

interface CategoryFiltersProps {
  categories: Array<{
    id: string
    name: string
    count: number
  }>
  selectedSubCategory: string
  selectedSort: string
  selectedPlatform: string
  onCategoryChange: (category: string) => void
  onSortChange: (sort: string) => void
  onPlatformChange: (platform: string) => void
  t: (key: string, fallback?: string) => string
}

const CategoryFilters = memo(function CategoryFilters({
  categories,
  selectedSubCategory,
  selectedSort,
  selectedPlatform,
  onCategoryChange,
  onSortChange,
  onPlatformChange,
  t
}: CategoryFiltersProps) {
  return (
    <section className="py-8 bg-white border-b">
      <div className="container mx-auto px-6">
        <div className="space-y-4">
          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedSubCategory === category.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* 추가 필터 및 정렬 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 플랫폼 필터 */}
            <select
              value={selectedPlatform}
              onChange={(e) => onPlatformChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">{t('campaigns.filter.all_platforms', '모든 플랫폼')}</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="blog">Blog</option>
            </select>

            <div className="flex items-center gap-3 ml-auto">
              {/* 정렬 */}
              <select
                value={selectedSort}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="latest">{t('campaigns.sort.latest', '최신순')}</option>
                <option value="deadline">{t('campaigns.sort.deadline', '마감임박순')}</option>
                <option value="popular">{t('campaigns.sort.popular', '인기순')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default CategoryFilters