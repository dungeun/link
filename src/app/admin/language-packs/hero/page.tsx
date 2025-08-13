'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  ArrowLeft,
  Save,
  Globe,
  Edit2,
  Plus,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LanguagePack {
  id: string
  key: string
  ko: string
  en: string
  jp: string
  description?: string
  category: string
}

export default function HeroLanguagePacksPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<LanguagePack[]>([])
  const [filteredPacks, setFilteredPacks] = useState<LanguagePack[]>([])
  const [editingPack, setEditingPack] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, LanguagePack>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'ko' | 'en' | 'jp'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLanguagePacks()
  }, [])

  useEffect(() => {
    filterPacks()
  }, [packs, searchTerm])

  const loadLanguagePacks = async () => {
    try {
      const response = await fetch('/api/admin/language-packs?category=hero')
      if (response.ok) {
        const data = await response.json()
        setPacks(data)
        setFilteredPacks(data)
      }
    } catch (error) {
      console.error('Failed to load language packs:', error)
      toast({
        title: '오류',
        description: '언어팩을 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPacks = () => {
    let filtered = packs

    if (searchTerm) {
      filtered = filtered.filter(pack =>
        pack.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.ko.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.jp.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPacks(filtered)
  }

  const handleEdit = (packId: string) => {
    const pack = packs.find(p => p.id === packId)
    if (pack) {
      setEditingPack(packId)
      setEditedValues({ ...editedValues, [packId]: { ...pack } })
    }
  }

  const handleSave = async (packId: string) => {
    const editedPack = editedValues[packId]
    if (!editedPack) return

    try {
      const response = await fetch(`/api/admin/language-packs/${editedPack.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ko: editedPack.ko,
          en: editedPack.en,
          jp: editedPack.jp,
          description: editedPack.description
        })
      })

      if (response.ok) {
        setPacks(packs.map(p => p.id === packId ? editedPack : p))
        setEditingPack(null)
        toast({
          title: '성공',
          description: '언어팩이 저장되었습니다.'
        })
      }
    } catch (error) {
      console.error('Failed to save language pack:', error)
      toast({
        title: '오류',
        description: '저장에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleAutoTranslate = async (packId: string) => {
    const pack = packs.find(p => p.id === packId)
    if (!pack) return

    try {
      const response = await fetch('/api/admin/language-packs/auto-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ key: pack.key, text: pack.ko }],
          targetLanguages: ['en', 'jp']
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.translated && result.translated.length > 0) {
          const translated = result.translated[0]
          const updatedPack = {
            ...pack,
            en: translated.translations.en || pack.en,
            jp: translated.translations.jp || pack.jp
          }
          
          setPacks(packs.map(p => p.id === packId ? updatedPack : p))
          if (editingPack === packId) {
            setEditedValues({ ...editedValues, [packId]: updatedPack })
          }
          
          toast({
            title: '성공',
            description: '자동 번역이 완료되었습니다.'
          })
        }
      }
    } catch (error) {
      console.error('Failed to auto translate:', error)
      toast({
        title: '오류',
        description: '자동 번역에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleValueChange = (packId: string, field: keyof LanguagePack, value: string) => {
    setEditedValues({
      ...editedValues,
      [packId]: {
        ...editedValues[packId],
        [field]: value
      }
    })
  }

  const heroSections = [
    { key: 'hero.slide1', label: '슬라이드 1' },
    { key: 'hero.slide2', label: '슬라이드 2' },
    { key: 'hero.slide3', label: '슬라이드 3' },
    { key: 'hero.slide4', label: '슬라이드 4' },
    { key: 'hero.slide5', label: '슬라이드 5' }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/language-packs"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">히어로 배너 언어팩</h1>
                <p className="text-sm text-gray-600 mt-1">
                  메인 페이지 히어로 섹션의 텍스트를 관리합니다
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                내보내기
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                가져오기
              </button>
            </div>
          </div>

          {/* 탭 & 검색 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'ko', 'en', 'jp'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'all' ? '전체 보기' : 
                   tab === 'ko' ? '한국어' : 
                   tab === 'en' ? 'English' : '日本語'}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* 슬라이드별 섹션 */}
        {heroSections.map((section) => {
          const sectionPacks = filteredPacks.filter(pack => pack.key.startsWith(section.key))
          
          return (
            <div key={section.key} className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">{section.label}</h3>
              </div>
              
              <div className="divide-y">
                {sectionPacks.map((pack) => (
                  <div key={pack.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {pack.key}
                          </code>
                          {pack.description && (
                            <span className="text-xs text-gray-500">{pack.description}</span>
                          )}
                        </div>

                        {activeTab === 'all' || activeTab === 'ko' ? (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              한국어
                            </label>
                            {editingPack === pack.id ? (
                              <input
                                type="text"
                                value={editedValues[pack.id]?.ko || pack.ko}
                                onChange={(e) => handleValueChange(pack.id, 'ko', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-sm text-gray-900">{pack.ko}</p>
                            )}
                          </div>
                        ) : null}

                        {activeTab === 'all' || activeTab === 'en' ? (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              English
                            </label>
                            {editingPack === pack.id ? (
                              <input
                                type="text"
                                value={editedValues[pack.id]?.en || pack.en}
                                onChange={(e) => handleValueChange(pack.id, 'en', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-sm text-gray-900">{pack.en || '(번역 필요)'}</p>
                            )}
                          </div>
                        ) : null}

                        {activeTab === 'all' || activeTab === 'jp' ? (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              日本語
                            </label>
                            {editingPack === pack.id ? (
                              <input
                                type="text"
                                value={editedValues[pack.id]?.jp || pack.jp}
                                onChange={(e) => handleValueChange(pack.id, 'jp', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-sm text-gray-900">{pack.jp || '(번역 필요)'}</p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-2">
                        {editingPack === pack.id ? (
                          <>
                            <button
                              onClick={() => handleSave(pack.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingPack(null)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(pack.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="편집"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAutoTranslate(pack.id)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="자동 번역"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}