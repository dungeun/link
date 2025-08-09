'use client'

import { useState, useEffect } from 'react'
import { Globe, Edit2, Save, X, RefreshCw, Plus, ChevronRight } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import AdminLayout from '@/components/admin/AdminLayout'

interface TranslationType {
  id: string
  type: 'campaign' | 'post' | 'menu'
  originalId: string
  ko: string
  en: string
  ja: string
  isAutoTranslated: {
    en: boolean
    ja: boolean
  }
  lastEditedBy?: string
  editedAt?: string
}

export default function TranslationManagementPage() {
  const [selectedType, setSelectedType] = useState<'campaign' | 'post' | 'menu' | 'main-sections' | 'api-settings'>('campaign')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [translations, setTranslations] = useState<TranslationType[]>([])
  const [allTranslations, setAllTranslations] = useState<TranslationType[]>([]) // 모든 번역 데이터 저장
  const [categories, setCategories] = useState<{category: string, count: number}[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ en: string; ja: string }>({ en: '', ja: '' })
  const [editingField, setEditingField] = useState<'en' | 'ja' | null>(null)
  const [autoTranslating, setAutoTranslating] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    defaultSourceLang: 'ko',
    defaultTargetLangs: ['en', 'ja'],
    autoTranslateOnCreate: false
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // 번역 데이터 로드
  const loadTranslations = async () => {
    setLoading(true)
    try {
      const response = await adminApi.get(`/api/admin/translations?type=${selectedType}`)
      if (response.ok) {
        const data = await response.json()
        
        if (selectedType === 'menu' || selectedType === 'main-sections') {
          // 메뉴 또는 메인 섹션 타입인 경우 카테고리 정보 추출
          setAllTranslations(data)
          
          // 카테고리별 카운트 계산
          const categoryMap = new Map<string, number>()
          data.forEach((item: any) => {
            if (item.category) {
              categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1)
            }
          })
          
          const categoryList = [
            { category: 'all', count: data.length },
            ...Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }))
          ].sort((a, b) => {
            if (a.category === 'all') return -1
            if (b.category === 'all') return 1
            return a.category.localeCompare(b.category)
          })
          
          setCategories(categoryList)
          
          // 선택된 카테고리에 따라 필터링
          if (selectedCategory === 'all') {
            setTranslations(data)
          } else {
            const filtered = data.filter((item: any) => item.category === selectedCategory)
            setTranslations(filtered)
          }
        } else {
          setTranslations(data)
          setAllTranslations([])
          setCategories([])
        }
      }
    } catch (error) {
      console.error('번역 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // Google API 상태 확인
  const checkApiStatus = async () => {
    try {
      const response = await adminApi.post('/api/admin/translations/auto', {
        text: 'Hello',
        targetLanguages: ['ko'],
        sourceLanguage: 'en'
      })

      if (response.ok) {
        setApiStatus('available')
      } else {
        setApiStatus('unavailable')
      }
    } catch (error) {
      console.error('API 상태 확인 실패:', error)
      setApiStatus('unavailable')
    }
  }

  useEffect(() => {
    if (selectedType !== 'api-settings') {
      // 타입이 변경될 때만 로드, 카테고리는 재설정
      setSelectedCategory('all')
      loadTranslations()
    } else {
      loadApiSettings()
    }
    checkApiStatus()
  }, [selectedType])

  // 카테고리 변경 시 필터링
  useEffect(() => {
    if ((selectedType === 'menu' || selectedType === 'main-sections') && allTranslations.length > 0) {
      if (selectedCategory === 'all') {
        setTranslations(allTranslations)
      } else {
        const filtered = allTranslations.filter((item: any) => item.category === selectedCategory)
        setTranslations(filtered)
      }
    }
  }, [selectedCategory, allTranslations, selectedType])

  // 카테고리 선택 핸들러
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  // API 설정 불러오기
  const loadApiSettings = async () => {
    try {
      const response = await adminApi.get('/api/admin/translations/settings')
      if (response.ok) {
        const data = await response.json()
        setApiSettings(data)
      }
    } catch (error) {
      console.error('API 설정 불러오기 실패:', error)
    }
  }

  // API 키 테스트
  const handleApiKeyTest = async () => {
    if (!apiSettings.apiKey || apiSettings.apiKey.startsWith('****')) {
      alert('테스트할 API 키를 입력해주세요.')
      return
    }

    setTesting(true)
    try {
      const response = await adminApi.post('/api/admin/translations/auto', {
        text: '안녕하세요',
        targetLanguages: ['en'],
        sourceLanguage: 'ko',
        testMode: true,
        testApiKey: apiSettings.apiKey
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert(`API 키 테스트 성공!\n\n테스트 번역:\n"${result.testResult.original}" → "${result.testResult.translated}" (${result.testResult.language})`)
          setApiStatus('available')
        } else {
          alert('API 키 테스트 실패: ' + result.error)
          setApiStatus('unavailable')
        }
      } else {
        const errorData = await response.json()
        alert('API 키 테스트 실패: ' + (errorData.error || '알 수 없는 오류'))
        setApiStatus('unavailable')
      }
    } catch (error) {
      console.error('API 키 테스트 오류:', error)
      
      let errorMessage = '네트워크 오류로 API 키 테스트에 실패했습니다.'
      
      if (error instanceof Error) {
        console.error('상세 오류:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage = '인터넷 연결을 확인해주세요. Google Translate API에 접속할 수 없습니다.'
        } else if (error.message.includes('Unexpected token')) {
          errorMessage = '서버에서 잘못된 응답을 받았습니다. 서버 로그를 확인해주세요.'
        } else if (error.message.includes('HTML')) {
          errorMessage = 'API 서버 오류가 발생했습니다. 관리자에게 문의해주세요.'
        } else {
          errorMessage = `API 테스트 오류: ${error.message}`
        }
      }
      
      alert(errorMessage)
      setApiStatus('unavailable')
    } finally {
      setTesting(false)
    }
  }

  // API 설정 저장
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await adminApi.post('/api/admin/translations/settings', apiSettings)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('API 설정이 성공적으로 저장되었습니다!')
          // 설정 다시 로드해서 마스킹된 API 키 표시
          loadApiSettings()
          checkApiStatus() // API 상태도 다시 확인
        } else {
          alert('설정 저장 실패: ' + result.error)
        }
      } else {
        const errorData = await response.json()
        alert('설정 저장 실패: ' + (errorData.error || '알 수 없는 오류'))
      }
    } catch (error) {
      console.error('설정 저장 오류:', error)
      alert('네트워크 오류로 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 자동 번역
  const handleAutoTranslate = async (id: string, text: string) => {
    setAutoTranslating(id)
    try {
      const response = await adminApi.post('/api/admin/translations/auto', {
        text,
        targetLanguages: ['en', 'ja'],
        sourceLanguage: 'ko'
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          // Google Translate 결과를 데이터베이스에 저장
          const translations = result.translations
          let updateData: any = {}
          
          if (translations.en && !translations.en.error) {
            updateData.en = translations.en.text
          }
          if (translations.ja && !translations.ja.error) {
            updateData.ja = translations.ja.text
          }

          // 번역 결과를 저장
          if (Object.keys(updateData).length > 0) {
            await adminApi.put(`/api/admin/translations/${id}`, {
              ...updateData,
              type: selectedType
            })
            
            alert(`번역이 완료되었습니다.\n- 영어: ${translations.en?.error ? '실패' : '성공'}\n- 일본어: ${translations.ja?.error ? '실패' : '성공'}`)
          }
        } else {
          alert('번역 서비스에 문제가 발생했습니다.')
        }
        
        loadTranslations() // 새로고침
      } else {
        const errorData = await response.json()
        alert(errorData.error || '번역 요청에 실패했습니다.')
      }
    } catch (error) {
      console.error('자동 번역 실패:', error)
      alert('네트워크 오류로 번역에 실패했습니다.')
    } finally {
      setAutoTranslating(null)
    }
  }

  // 수동 편집 시작 - 개별 필드
  const startEditField = (item: TranslationType, field: 'en' | 'ja') => {
    setEditingId(item.id)
    setEditingField(field)
    setEditForm({
      en: item.en,
      ja: item.ja
    })
  }

  // 수동 편집 저장 - 개별 필드
  const saveEditField = async (id: string, field: 'en' | 'ja') => {
    try {
      const updateData: any = { type: selectedType }
      updateData[field] = editForm[field]
      
      const response = await adminApi.put(`/api/admin/translations/${id}`, updateData)

      if (response.ok) {
        setEditingId(null)
        setEditingField(null)
        loadTranslations()
      }
    } catch (error) {
      console.error('번역 저장 실패:', error)
    }
  }

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null)
    setEditingField(null)
    setEditForm({ en: '', ja: '' })
  }

  // 일괄 자동 번역
  const handleBatchTranslate = async () => {
    const confirmMessage = `선택한 타입(${
      selectedType === 'campaign' ? '캠페인' : 
      selectedType === 'post' ? '게시물' : '메뉴'
    })의 모든 번역되지 않은 항목을 Google Translate로 자동 번역하시겠습니까?\n\n※ 이미 번역된 항목은 건너뜁니다.`
    
    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      const response = await adminApi.post('/api/admin/translations/batch', {
        type: selectedType,
        targetLanguages: ['en', 'ja'],
        sourceLanguage: 'ko'
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          const message = `일괄 번역이 완료되었습니다.\n\n- 번역 완료: ${result.translated}개\n- 오류: ${result.errors}개`
          
          if (result.errorMessages && result.errorMessages.length > 0) {
            const errorDetail = result.errorMessages.slice(0, 3).join('\n- ')
            alert(`${message}\n\n주요 오류:\n- ${errorDetail}${result.errorMessages.length > 3 ? '\n...' : ''}`)
          } else {
            alert(message)
          }
        } else {
          alert('일괄 번역 처리 중 문제가 발생했습니다.')
        }
        
        loadTranslations()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '일괄 번역 요청에 실패했습니다.')
      }
    } catch (error) {
      console.error('일괄 번역 실패:', error)
      alert('네트워크 오류로 일괄 번역에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">통합 번역 관리</h1>
              <p className="text-gray-600">캠페인, 게시물, 메뉴의 다국어 번역을 관리합니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Google Translate API:</span>
              {apiStatus === 'checking' && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  확인중
                </span>
              )}
              {apiStatus === 'available' && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  ✓ 사용가능
                </span>
              )}
              {apiStatus === 'unavailable' && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                  ✗ 사용불가
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 타입 선택 탭 */}
        <div className="flex gap-2 mb-6 border-b">
          {(['campaign', 'post', 'menu', 'main-sections', 'api-settings'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedType === type
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type === 'campaign' ? '캠페인' : 
               type === 'post' ? '게시물' : 
               type === 'menu' ? '메뉴' : 
               type === 'main-sections' ? '메인 섹션' : 'API 설정'}
            </button>
          ))}
        </div>

        {selectedType !== 'api-settings' && (
          <>
            {/* 메뉴 또는 메인 섹션 타입일 때 카테고리 서브 탭 */}
            {(selectedType === 'menu' || selectedType === 'main-sections') && categories.length > 0 && (
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex gap-2 overflow-x-auto">
                    {categories.map(({ category, count }) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {category === 'all' ? '전체' :
                         category === 'ui_menu' ? '메뉴' :
                         category === 'ui_footer' ? '푸터' :
                         category === 'ui_hero' ? '히어로' :
                         category === 'ui_category' ? '카테고리' :
                         category === 'ui_quicklink' ? '퀵링크' :
                         category === 'ui_promo' ? '프로모션' :
                         category === 'ui_ranking' ? '랭킹' :
                         category === 'ui_action' ? '액션' :
                         category === 'ui_notification' ? '알림' : category} ({count})
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* 도구 모음 */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleBatchTranslate}
                  disabled={loading || apiStatus !== 'available'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  title={apiStatus !== 'available' ? 'Google Translate API가 사용 불가능합니다.' : ''}
                >
                  <Globe className="w-4 h-4" />
                  일괄 자동 번역
                </button>
                <button
                  onClick={loadTranslations}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  새로고침
                </button>
              </div>

              <div className="text-sm text-gray-600">
                {(selectedType === 'menu' || selectedType === 'main-sections') && selectedCategory !== 'all' ? (
                  <>
                    {selectedCategory === 'ui_menu' ? '메뉴' :
                     selectedCategory === 'ui_footer' ? '푸터' :
                     selectedCategory === 'ui_hero' ? '히어로' :
                     selectedCategory === 'ui_category' ? '카테고리' :
                     selectedCategory === 'ui_quicklink' ? '퀵링크' :
                     selectedCategory === 'ui_promo' ? '프로모션' :
                     selectedCategory === 'ui_ranking' ? '랭킹' :
                     selectedCategory === 'ui_action' ? '액션' :
                     selectedCategory === 'ui_notification' ? '알림' : selectedCategory} 카테고리 {translations.length}개 항목
                  </>
                ) : (
                  <>총 {translations.length}개 항목</>
                )}
              </div>
            </div>

            {/* 번역 목록 - 카드 레이아웃 */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  로딩 중...
                </div>
              ) : translations.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  번역할 항목이 없습니다.
                </div>
              ) : (
                translations.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-6">
                    {/* 한국어 (원본) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">한국어 (원본)</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAutoTranslate(item.id, item.ko)}
                            disabled={autoTranslating === item.id || apiStatus !== 'available'}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50 text-xs"
                            title={apiStatus !== 'available' ? 'Google Translate API가 사용 불가능합니다.' : '자동 번역'}
                          >
                            {autoTranslating === item.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Globe className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                        {item.ko}
                      </div>
                    </div>

                    {/* 영어 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          영어
                          {item.isAutoTranslated.en && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                              자동번역
                            </span>
                          )}
                        </label>
                        <button
                          onClick={() => startEditField(item, 'en')}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="영어 번역 수정"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      {editingId === item.id && editingField === 'en' ? (
                        <div className="space-y-2">
                          <textarea
                            value={editForm.en}
                            onChange={(e) => setEditForm({ ...editForm, en: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="영어 번역을 입력하세요"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditField(item.id, 'en')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-900 min-h-[44px] flex items-center">
                          {item.en || <span className="text-gray-400">번역이 필요합니다</span>}
                        </div>
                      )}
                    </div>

                    {/* 일본어 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          일본어
                          {item.isAutoTranslated.ja && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                              자동번역
                            </span>
                          )}
                        </label>
                        <button
                          onClick={() => startEditField(item, 'ja')}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="일본어 번역 수정"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      {editingId === item.id && editingField === 'ja' ? (
                        <div className="space-y-2">
                          <textarea
                            value={editForm.ja}
                            onChange={(e) => setEditForm({ ...editForm, ja: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="일본어 번역을 입력하세요"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditField(item.id, 'ja')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-900 min-h-[44px] flex items-center">
                          {item.ja || <span className="text-gray-400">번역이 필요합니다</span>}
                        </div>
                      )}
                    </div>

                    {/* 번역 상태 요약 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        {!item.isAutoTranslated.en && !item.isAutoTranslated.ja && item.en && item.ja && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            수동 검수 완료
                          </span>
                        )}
                        {(!item.en || !item.ja) && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                            번역 미완료
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {item.id.slice(-8)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 번역 진행률 */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">번역 진행률</h3>
              <div className="space-y-4">
                {['en', 'ja'].map(lang => {
                  const translated = translations.filter(t => t[lang as keyof typeof t]).length
                  const percentage = translations.length > 0 ? (translated / translations.length) * 100 : 0
                  
                  return (
                    <div key={lang}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {lang === 'en' ? '영어' : '일본어'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {translated}/{translations.length} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* API 설정 */}
        {selectedType === 'api-settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Google Translate API 설정</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API 키
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiSettings.apiKey}
                      onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                      placeholder="Google Translate API 키를 입력하세요"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleApiKeyTest}
                      disabled={!apiSettings.apiKey || apiSettings.apiKey.startsWith('****') || testing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {testing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {testing ? '테스트 중...' : '테스트'}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Google Cloud Console에서 발급받은 Translation API 키를 입력하세요.
                    {apiSettings.apiKey && apiSettings.apiKey.startsWith('****') && (
                      <span className="block text-blue-600 mt-1">
                        ℹ️ 기존에 저장된 API 키가 있습니다. 새 키를 입력하면 기존 키를 대체합니다.
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 소스 언어
                  </label>
                  <select
                    value={apiSettings.defaultSourceLang}
                    onChange={(e) => setApiSettings({...apiSettings, defaultSourceLang: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">영어</option>
                    <option value="ja">일본어</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 대상 언어
                  </label>
                  <div className="space-y-2">
                    {['en', 'ja', 'zh', 'es', 'fr', 'de'].map(lang => (
                      <label key={lang} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={apiSettings.defaultTargetLangs.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApiSettings({
                                ...apiSettings,
                                defaultTargetLangs: [...apiSettings.defaultTargetLangs, lang]
                              })
                            } else {
                              setApiSettings({
                                ...apiSettings,
                                defaultTargetLangs: apiSettings.defaultTargetLangs.filter(l => l !== lang)
                              })
                            }
                          }}
                          className="mr-2"
                        />
                        {lang === 'en' ? '영어' :
                         lang === 'ja' ? '일본어' :
                         lang === 'zh' ? '중국어' :
                         lang === 'es' ? '스페인어' :
                         lang === 'fr' ? '프랑스어' : '독일어'}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={apiSettings.autoTranslateOnCreate}
                      onChange={(e) => setApiSettings({...apiSettings, autoTranslateOnCreate: e.target.checked})}
                      className="mr-2"
                    />
                    새 콘텐츠 생성 시 자동 번역
                  </label>
                  <p className="ml-6 text-sm text-gray-500">
                    캠페인, 게시물 생성 시 자동으로 번역을 수행합니다.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? '저장 중...' : '설정 저장'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">API 상태 및 사용량</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">API 상태</div>
                  <div className="mt-1">
                    {apiStatus === 'checking' && (
                      <span className="inline-flex items-center text-yellow-600">
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        확인중
                      </span>
                    )}
                    {apiStatus === 'available' && (
                      <span className="inline-flex items-center text-green-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        사용가능
                      </span>
                    )}
                    {apiStatus === 'unavailable' && (
                      <span className="inline-flex items-center text-red-600">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                        사용불가
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">이번 달 사용량</div>
                  <div className="mt-1 text-lg font-semibold">-</div>
                  <div className="text-xs text-gray-500">API 연동 후 표시</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">예상 비용</div>
                  <div className="mt-1 text-lg font-semibold">-</div>
                  <div className="text-xs text-gray-500">API 연동 후 표시</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">API 설정 가이드</h3>
              
              <div className="prose prose-sm max-w-none">
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 hover:underline">
                      Google Cloud Console
                    </a>에 로그인합니다.
                  </li>
                  <li>프로젝트를 선택하거나 새 프로젝트를 생성합니다.</li>
                  <li>
                    <strong>API 및 서비스 → 라이브러리</strong>에서 "Cloud Translation API"를 검색하고 활성화합니다.
                  </li>
                  <li>
                    <strong>API 및 서비스 → 사용자 인증 정보</strong>에서 "사용자 인증 정보 만들기 → API 키"를 선택합니다.
                  </li>
                  <li>생성된 API 키를 위의 입력란에 붙여넣고 테스트 버튼을 클릭합니다.</li>
                  <li>설정을 저장하면 자동 번역 기능을 사용할 수 있습니다.</li>
                </ol>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> Google Translate API는 유료 서비스입니다. 
                    사용량에 따라 요금이 부과되니 
                    <a href="https://cloud.google.com/translate/pricing" target="_blank" className="text-blue-600 hover:underline">
                      요금 체계
                    </a>를 확인하세요.
                  </p>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>문제 해결:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
                    <li>API 키가 올바른지 확인 (Google Cloud Console에서 복사)</li>
                    <li>Translation API가 활성화되어 있는지 확인</li>
                    <li>프로젝트에 결제 계정이 연결되어 있는지 확인</li>
                    <li>방화벽이나 네트워크가 Google API를 차단하지 않는지 확인</li>
                    <li>브라우저 개발자 도구의 콘솔에서 자세한 오류 확인 가능</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}