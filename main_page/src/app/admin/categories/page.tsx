'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Settings, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import CategoryFormModal from '@/components/admin/CategoryFormModal'
import CategoryPageModal from '@/components/admin/CategoryPageModal'

interface Category {
  id: string
  name: string
  slug: string
  level: number
  description?: string
  icon?: string
  color?: string
  isActive: boolean
  showInMenu: boolean
  menuOrder?: number
  parentId?: string
  parent?: { id: string; name: string; level: number }
  children: { id: string; name: string; level: number; isActive: boolean }[]
  categoryPage?: { id: string; isPublished: boolean }
  campaignCount: number
}

function CategoriesPageContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showPageModal, setShowPageModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setShowCategoryModal(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchCategories()
      } else {
        const data = await response.json()
        alert(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCreatePage = (category: Category) => {
    setSelectedCategory(category)
    setShowPageModal(true)
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // 계층 구조로 정리
  const organizeCategoriesByHierarchy = (categories: Category[]) => {
    const categoryMap = new Map<string, Category & { children: Category[] }>()
    const rootCategories: (Category & { children: Category[] })[] = []

    // 카테고리 맵 생성
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // 계층 구조 구성
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        parent.children.push(category)
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const renderCategoryItem = (category: Category & { children: Category[] }, depth = 0) => {
    const hasChildren = category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const paddingLeft = depth * 20 + 16

    return (
      <div key={category.id}>
        <div 
          className="flex items-center justify-between p-4 border-b bg-white hover:bg-gray-50"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            
            <div className="flex items-center gap-3">
              {category.icon && (
                <span className="text-xl">{category.icon}</span>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    {category.level}단계
                  </span>
                  {!category.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
                      비활성
                    </span>
                  )}
                  {category.showInMenu && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
                      메뉴
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>슬러그: {category.slug}</span>
                  <span>캠페인: {category.campaignCount}개</span>
                  {category.categoryPage && (
                    <span className={`px-2 py-1 text-xs rounded ${
                      category.categoryPage.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      페이지 {category.categoryPage.isPublished ? '게시됨' : '미게시'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!category.categoryPage && (
              <button
                onClick={() => handleCreatePage(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="페이지 생성"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="수정"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleDelete(category)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 하위 카테고리 렌더링 */}
        {hasChildren && isExpanded && (
          <div>
            {category.children
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(child => renderCategoryItem(child, depth + 1))
            }
          </div>
        )}
      </div>
    )
  }

  const hierarchicalCategories = organizeCategoriesByHierarchy(categories)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="text-gray-600 mt-1">캠페인 카테고리 계층 구조를 관리합니다.</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedCategory(null)
            setShowCategoryModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 카테고리
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
          <div className="text-sm text-gray-600">전체 카테고리</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {categories.filter(cat => cat.level === 1).length}
          </div>
          <div className="text-sm text-gray-600">대분류</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {categories.filter(cat => cat.level === 2).length}
          </div>
          <div className="text-sm text-gray-600">중분류</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {categories.filter(cat => cat.level === 3).length}
          </div>
          <div className="text-sm text-gray-600">소분류</div>
        </div>
      </div>

      {/* 카테고리 트리 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">카테고리 계층 구조</h2>
        </div>
        
        {hierarchicalCategories.length > 0 ? (
          <div>
            {hierarchicalCategories
              .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))
              .map(category => renderCategoryItem(category))
            }
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            생성된 카테고리가 없습니다.
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showCategoryModal && (
        <CategoryFormModal
          category={selectedCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setSelectedCategory(null)
          }}
          onSuccess={() => {
            fetchCategories()
            setShowCategoryModal(false)
            setSelectedCategory(null)
          }}
          categories={categories}
        />
      )}

      {showPageModal && selectedCategory && (
        <CategoryPageModal
          category={selectedCategory}
          onClose={() => {
            setShowPageModal(false)
            setSelectedCategory(null)
          }}
          onSuccess={() => {
            fetchCategories()
            setShowPageModal(false)
            setSelectedCategory(null)
          }}
        />
      )}
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <CategoriesPageContent />
    </AdminLayout>
  )
}