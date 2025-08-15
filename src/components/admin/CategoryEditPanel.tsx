'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/admin-api'

interface MainCategory {
  name: string
  label: string
}

interface SubCategory {
  name: string
  label: string
  mainCategory: string
}

interface CategoryEditPanelProps {
  campaignId: string | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function CategoryEditPanel({ 
  campaignId, 
  isOpen, 
  onClose, 
  onSave 
}: CategoryEditPanelProps) {
  const [loading, setLoading] = useState(false)
  const [campaign, setCampaign] = useState<{ id: string; title: string; mainCategory?: string; subCategory?: string } | null>(null)
  const [selectedMainCategory, setSelectedMainCategory] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')

  // 하드코딩된 대분류 목록
  const mainCategories: MainCategory[] = [
    { name: '캠페인', label: '캠페인' },
    { name: '병원', label: '병원' },
    { name: '구매평', label: '구매평' }
  ]

  // 하드코딩된 중분류 목록
  const subCategories: SubCategory[] = [
    // 캠페인 중분류
    { name: '패션', label: '패션', mainCategory: '캠페인' },
    { name: '뷰티', label: '뷰티', mainCategory: '캠페인' },
    { name: '식품', label: '식품', mainCategory: '캠페인' },
    { name: '생활용품', label: '생활용품', mainCategory: '캠페인' },
    { name: '전자제품', label: '전자제품', mainCategory: '캠페인' },
    // 병원 중분류
    { name: '성형외과', label: '성형외과', mainCategory: '병원' },
    { name: '피부과', label: '피부과', mainCategory: '병원' },
    { name: '치과', label: '치과', mainCategory: '병원' },
    { name: '안과', label: '안과', mainCategory: '병원' },
    // 구매평 중분류
    { name: '제품리뷰', label: '제품리뷰', mainCategory: '구매평' },
    { name: '서비스리뷰', label: '서비스리뷰', mainCategory: '구매평' },
    { name: '체험후기', label: '체험후기', mainCategory: '구매평' }
  ]

  // 캠페인 정보 가져오기
  const fetchCampaign = async () => {
    if (!campaignId) return
    
    try {
      setLoading(true)
      const response = await adminApi.get(`/api/admin/campaigns/${campaignId}`)
      const data = await response.json()
      if (data.success) {
        setCampaign(data.campaign)
        setSelectedMainCategory(data.campaign.mainCategory || '')
        setSelectedSubCategory(data.campaign.category || '')
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 업데이트
  const handleSave = async () => {
    if (!campaignId) return

    try {
      setLoading(true)
      console.log('Updating category:', {
        campaignId,
        mainCategory: selectedMainCategory,
        category: selectedSubCategory
      })
      
      const response = await adminApi.put(`/api/admin/campaigns/${campaignId}`, {
        mainCategory: selectedMainCategory,
        category: selectedSubCategory
      })

      console.log('Response status:', response.status)
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (response.ok) {
        console.log('✅ 카테고리 업데이트 성공!')
        onSave?.()
        onClose()
      } else {
        console.error('❌ Update failed:', responseData)
        console.error('❌ Error details:', JSON.stringify(responseData, null, 2))
        console.error('❌ Response status:', response.status)
        console.error('❌ Response headers:', [...response.headers.entries()])
      }
    } catch (error) {
      console.error('❌ Network/Parse error:', error)
      if (error.message) {
        console.error('❌ Error message:', error.message)
      }
      if (error.stack) {
        console.error('❌ Error stack:', error.stack)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaign()
    }
  }, [isOpen, campaignId])

  // 대분류에 따른 중분류 필터링
  const getSubCategories = () => {
    if (!selectedMainCategory) return []
    return subCategories.filter(sub => sub.mainCategory === selectedMainCategory)
  }

  return (
    <>
      {/* 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">카테고리 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* 캠페인 정보 */}
              {campaign && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">캠페인 정보</h3>
                  <p className="text-sm text-gray-600 mb-1"><strong>제목:</strong> {campaign.title}</p>
                  <p className="text-sm text-gray-600"><strong>업체:</strong> {campaign.businessName}</p>
                </div>
              )}

              {/* 대분류 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대분류 *
                </label>
                <select
                  value={selectedMainCategory}
                  onChange={(e) => {
                    setSelectedMainCategory(e.target.value)
                    setSelectedSubCategory('') // 대분류 변경 시 중분류 초기화
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">대분류를 선택하세요</option>
                  {mainCategories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 중분류 선택 */}
              {selectedMainCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    중분류
                  </label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">중분류를 선택하세요 (선택사항)</option>
                    {getSubCategories().map(category => (
                      <option key={category.name} value={category.name}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 현재 카테고리 정보 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">현재 설정</h4>
                <div className="space-y-1">
                  <p className="text-sm text-blue-800">
                    <strong>대분류:</strong> {selectedMainCategory || '선택되지 않음'}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>중분류:</strong> {selectedSubCategory || '선택되지 않음'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedMainCategory || loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}