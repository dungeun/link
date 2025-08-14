'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  color?: string
  description?: string
  showInMenu: boolean
  menuOrder: number | null
  isActive: boolean
  level: number
  parentId?: string | null
  children?: Category[]
}

interface EditModalProps {
  category: Category | null
  parentCategory?: Category
  onClose: () => void
  onSave: (data: Partial<Category>) => void
  isNew?: boolean
}

function EditModal({ category, parentCategory, onClose, onSave, isNew }: EditModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    color: category?.color || '',
    description: category?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isNew ? '중분류 추가' : '중분류 수정'}
          {parentCategory && ` - ${parentCategory.name}`}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                슬러그 (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="w-full px-3 py-2 border rounded-md"
                required
                placeholder="예: fashion, beauty"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                색상
              </label>
              <input
                type="color"
                value={formData.color || '#3B82F6'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 px-2 py-1 border rounded-md cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isNew ? '추가' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MainCategoryItem({ category, onReload }: { category: Category; onReload: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const handleAddSubCategory = async (data: Partial<Category>) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          parentId: category.id,
          level: 2,
          showInMenu: false,
          isActive: true
        })
      })

      if (response.ok) {
        setIsAddingNew(false)
        onReload()
      }
    } catch (error) {
      console.error('Error adding subcategory:', error)
    }
  }

  const handleEditSubCategory = async (subCategory: Category, data: Partial<Category>) => {
    try {
      const response = await fetch(`/api/admin/categories/${subCategory.id}`, {
        method: 'PUT',  
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setEditingCategory(null)
        onReload()
      }
    } catch (error) {
      console.error('Error updating subcategory:', error)
    }
  }

  const handleDeleteSubCategory = async (subCategory: Category) => {
    if (!confirm(`정말 "${subCategory.name}" 중분류를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${subCategory.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onReload()
      } else {
        const error = await response.json()
        alert(error.error || '삭제 실패')
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
    }
  }

  const handleToggleActive = async (subCategory: Category) => {
    try {
      const response = await fetch(`/api/admin/categories/${subCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !subCategory.isActive })
      })

      if (response.ok) {
        onReload()
      }
    } catch (error) {
      console.error('Error toggling active:', error)
    }
  }

  return (
    <div className="bg-white border rounded-lg mb-4">
      {/* 대분류 헤더 */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div>
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">/{category.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            중분류: {category.children?.length || 0}개
          </span>
          
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            중분류 추가
          </button>
        </div>
      </div>

      {/* 중분류 목록 (펼침/접기) */}
      {isExpanded && (
        <div className="border-t">
          <div className="p-4 space-y-2">
            {category.children && category.children.length > 0 ? (
              category.children.map(subCategory => (
                <div 
                  key={subCategory.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium">{subCategory.name}</span>
                      <span className="text-sm text-gray-500 ml-2">/{subCategory.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={subCategory.isActive}
                        onChange={() => handleToggleActive(subCategory)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">활성</span>
                    </label>

                    <button
                      onClick={() => setEditingCategory(subCategory)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      수정
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSubCategory(subCategory)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                중분류가 없습니다. 위의 "중분류 추가" 버튼을 클릭하여 추가하세요.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingCategory && (
        <EditModal
          category={editingCategory}
          parentCategory={category}
          onClose={() => setEditingCategory(null)}
          onSave={(data) => handleEditSubCategory(editingCategory, data)}
        />
      )}

      {/* 추가 모달 */}
      {isAddingNew && (
        <EditModal
          category={null}
          parentCategory={category}
          onClose={() => setIsAddingNew(false)}
          onSave={handleAddSubCategory}
          isNew
        />
      )}
    </div>
  )
}

export function CategoryConfigTab() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        // 대분류 카테고리만 필터링하고 children 포함
        const mainCategories = data.categories
          .filter((cat: Category) => cat.level === 1)
          .map((cat: any) => ({
            ...cat,
            children: data.categories.filter((child: any) => child.parentId === cat.id)
          }))
          .sort((a: Category, b: Category) => (a.menuOrder || 999) - (b.menuOrder || 999))
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('admin.ui.categories.title', '카테고리 설정')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('admin.ui.categories.description', '대분류 카테고리와 중분류를 관리합니다. 중분류는 자유롭게 추가/수정/삭제할 수 있습니다.')}
          </p>
        </div>

        {/* 대분류 추가 제한 안내 */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-800">
              대분류 카테고리 추가는 추가 비용이 발생합니다. 필요시 관리자에게 문의하세요.
            </span>
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="space-y-4">
          {categories.map(category => (
            <MainCategoryItem
              key={category.id}
              category={category}
              onReload={fetchCategories}
            />
          ))}
        </div>

        {/* 통계 정보 */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium text-gray-900 mb-2">카테고리 통계</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 대분류: {categories.length}개 (고정)</li>
            <li>• 전체 중분류: {categories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)}개</li>
          </ul>
        </div>
      </div>
    </div>
  )
}