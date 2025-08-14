'use client'

import { useState, useEffect } from 'react'
import { X, Eye, Settings } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  level: number
}

interface CategoryPageModalProps {
  category: Category
  onClose: () => void
  onSuccess: () => void
}

export default function CategoryPageModal({ 
  category, 
  onClose, 
  onSuccess 
}: CategoryPageModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: {} as any,
    layout: 'grid',
    heroSection: {} as any,
    featuredSection: {} as any,
    filterOptions: {} as any,
    customSections: {} as any,
    seoSettings: {} as any,
    isPublished: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // 기본값 설정
    setFormData({
      title: `${category.name} 페이지`,
      content: {
        sections: []
      },
      layout: 'grid',
      heroSection: {
        enabled: true,
        title: category.name,
        subtitle: `${category.name} 관련 캠페인을 만나보세요`,
        backgroundImage: '',
        ctaText: '캠페인 보기'
      },
      featuredSection: {
        enabled: false,
        title: '추천 캠페인',
        campaigns: []
      },
      filterOptions: {
        showSearch: true,
        showSort: true,
        showFilters: true,
        availableFilters: ['platform', 'budget', 'followers']
      },
      customSections: {
        sections: []
      },
      seoSettings: {
        metaTitle: `${category.name} - 캠페인`,
        metaDescription: `${category.name} 관련 인플루언서 마케팅 캠페인을 확인하세요`,
        keywords: [category.name, '캠페인', '인플루언서'],
        ogImage: ''
      },
      isPublished: false
    })
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/category-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          categoryId: category.id
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        if (data.error) {
          setErrors({ general: data.error })
        }
      }
    } catch (error) {
      console.error('Error creating category page:', error)
      setErrors({ general: '생성 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {category.name} 카테고리 페이지 생성
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              카테고리별 전용 페이지를 설정합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {errors.general}
            </div>
          )}

          {/* 기본 설정 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">기본 설정</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  페이지 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  레이아웃
                </label>
                <select
                  value={formData.layout}
                  onChange={(e) => setFormData(prev => ({ ...prev, layout: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="grid">그리드</option>
                  <option value="list">리스트</option>
                  <option value="cards">카드</option>
                </select>
              </div>
            </div>
          </div>

          {/* 히어로 섹션 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">히어로 섹션</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="heroEnabled"
                  checked={formData.heroSection.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    heroSection: { ...prev.heroSection, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="heroEnabled" className="ml-2 text-sm text-gray-700">
                  활성화
                </label>
              </div>
            </div>

            {formData.heroSection.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.heroSection.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      heroSection: { ...prev.heroSection, title: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    부제목
                  </label>
                  <input
                    type="text"
                    value={formData.heroSection.subtitle}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      heroSection: { ...prev.heroSection, subtitle: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CTA 버튼 텍스트
                  </label>
                  <input
                    type="text"
                    value={formData.heroSection.ctaText}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      heroSection: { ...prev.heroSection, ctaText: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 필터 옵션 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">필터 옵션</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showSearch"
                  checked={formData.filterOptions.showSearch}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filterOptions: { ...prev.filterOptions, showSearch: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showSearch" className="ml-2 text-sm text-gray-700">
                  검색 기능
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showSort"
                  checked={formData.filterOptions.showSort}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filterOptions: { ...prev.filterOptions, showSort: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showSort" className="ml-2 text-sm text-gray-700">
                  정렬 기능
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showFilters"
                  checked={formData.filterOptions.showFilters}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filterOptions: { ...prev.filterOptions, showFilters: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showFilters" className="ml-2 text-sm text-gray-700">
                  필터 기능
                </label>
              </div>
            </div>
          </div>

          {/* SEO 설정 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">SEO 설정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메타 제목
                </label>
                <input
                  type="text"
                  value={formData.seoSettings.metaTitle}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaTitle: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메타 설명
                </label>
                <textarea
                  value={formData.seoSettings.metaDescription}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaDescription: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 게시 설정 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                즉시 게시
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '생성 중...' : '페이지 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}