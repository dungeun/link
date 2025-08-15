'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/hooks/useAuth'

interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
  isPublic: boolean;
  useCount: number;
  userId: string;
}

export default function TemplatesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    isPublic: true
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchTemplates()
  }, [isAuthenticated])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/application-templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('템플릿 불러오기 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('accessToken')
      const url = editingTemplate 
        ? '/api/application-templates' 
        : '/api/application-templates'
      
      const method = editingTemplate ? 'PATCH' : 'POST'
      const body = editingTemplate 
        ? { ...formData, id: editingTemplate.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        alert(editingTemplate ? '템플릿이 수정되었습니다.' : '템플릿이 생성되었습니다.')
        setFormData({ name: '', content: '', category: '', isPublic: true })
        setEditingTemplate(null)
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || '작업에 실패했습니다.')
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error)
      alert('템플릿 저장 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category || '',
      isPublic: template.isPublic
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/application-templates?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('템플릿이 삭제되었습니다.')
        fetchTemplates()
      } else {
        const error = await response.json()
        alert(error.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error)
      alert('템플릿 삭제 중 오류가 발생했습니다.')
    }
  }

  const categories = ['뷰티', '패션', '푸드', '여행', '라이프스타일', '테크', '운동']

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">내 지원서 템플릿</h1>

            {/* 템플릿 작성 폼 */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">
                {editingTemplate ? '템플릿 수정' : '새 템플릿 만들기'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="예: 뷰티 전문 지원서"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 (선택사항)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">모든 카테고리</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 내용
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="템플릿 내용을 입력하세요. {brand}, {title}, {category} 등의 변수를 사용할 수 있습니다."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    사용 가능한 변수: {'{brand}'}, {'{title}'}, {'{category}'}, {'{platforms}'}
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    다른 사용자들도 이 템플릿을 사용할 수 있도록 공개
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    {editingTemplate ? '수정하기' : '저장하기'}
                  </button>
                  {editingTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null)
                        setFormData({ name: '', content: '', category: '', isPublic: true })
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 템플릿 목록 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">저장된 템플릿</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : templates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  아직 저장된 템플릿이 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {template.category && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {template.category}
                              </span>
                            )}
                            <span>사용 {template.useCount}회</span>
                            <span>{template.isPublic ? '공개' : '비공개'}</span>
                            {template.userId !== user?.id && (
                              <span className="text-cyan-600">공유 템플릿</span>
                            )}
                          </div>
                          <p className="mt-2 text-gray-700 whitespace-pre-wrap line-clamp-3">
                            {template.content}
                          </p>
                        </div>
                        
                        {template.userId === user?.id && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(template)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}