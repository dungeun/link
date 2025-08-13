'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  level: number
  parentId?: string
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  showInMenu: boolean
  menuOrder?: number
}

interface CategoryFormModalProps {
  category?: Category | null
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
}

export default function CategoryFormModal({ 
  category, 
  onClose, 
  onSuccess, 
  categories 
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    isActive: true,
    showInMenu: false,
    menuOrder: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        parentId: category.parentId || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
        isActive: category.isActive,
        showInMenu: category.showInMenu,
        menuOrder: category.menuOrder || 0
      })
    }
  }, [category])

  // 자동 슬러그 생성
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value)
    }))
  }

  // 부모 카테고리 선택 가능 리스트 (최대 2레벨까지만 허용)
  const getAvailableParentCategories = () => {
    return categories.filter(cat => 
      cat.level < 3 && // 3단계까지만 허용
      (!category || cat.id !== category.id) // 자기 자신 제외
    ).sort((a, b) => a.name.localeCompare(b.name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = isEditing 
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
      console.error('Error saving category:', error)
      setErrors({ general: '저장 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const availableParents = getAvailableParentCategories()

  // 이모지 선택 옵션
  const iconOptions = [
    '🏥', '🍔', '👗', '🎮', '📱', '🚗', '✈️', '🏠',
    '💄', '📚', '🎵', '⚽', '🎨', '💻', '🎬', '🌱',
    '💎', '🍷', '🎯', '🔧', '📷', '🎪', '🏆', '🎸'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? '카테고리 수정' : '새 카테고리 생성'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {errors.general}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 이름 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="카테고리 이름"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                슬러그 *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="category-slug"
                required
              />
            </div>
          </div>

          {/* 부모 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부모 카테고리
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">최상위 카테고리</option>
              {availableParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {'  '.repeat(parent.level - 1)}{parent.name} ({parent.level}단계)
                </option>
              ))}
            </select>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="카테고리에 대한 설명을 입력하세요"
            />
          </div>

          {/* 아이콘 및 색상 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이콘
              </label>
              <div className="grid grid-cols-8 gap-2 mb-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 text-xl rounded-lg border-2 transition-colors ${
                      formData.icon === icon 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="또는 직접 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                색상
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* 설정 옵션 */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                활성화
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInMenu"
                checked={formData.showInMenu}
                onChange={(e) => setFormData(prev => ({ ...prev, showInMenu: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showInMenu" className="ml-2 text-sm text-gray-700">
                메인 메뉴에 표시
              </label>
            </div>

            {formData.showInMenu && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메뉴 순서
                </label>
                <input
                  type="number"
                  value={formData.menuOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, menuOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            )}
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
              {loading ? '저장 중...' : (isEditing ? '수정' : '생성')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}