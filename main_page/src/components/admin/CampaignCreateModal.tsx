'use client'

import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { ImageUpload } from '@/components/ui/ImageUpload'

interface CampaignCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CampaignCreateModal({ isOpen, onClose, onSuccess }: CampaignCreateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    businessEmail: '',
    companyName: '',
    platform: 'INSTAGRAM',
    budget: '',
    targetFollowers: '',
    startDate: '',
    endDate: '',
    requirements: '',
    hashtags: '',
    imageUrl: '',
    enableTranslation: true // 자동 번역 기본 활성화
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (imageUrl: string | string[]) => {
    const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl
    setFormData(prev => ({ ...prev, imageUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 먼저 비즈니스 계정 생성 또는 찾기
      const businessResponse = await adminApi.post('/api/admin/businesses/find-or-create', {
        email: formData.businessEmail,
        companyName: formData.companyName
      })

      if (!businessResponse.ok) {
        throw new Error('업체 정보 처리 실패')
      }

      const { businessId } = await businessResponse.json()

      // 캠페인 생성
      const response = await adminApi.post('/api/admin/campaigns', {
        ...formData,
        businessId,
        budget: Number(formData.budget),
        targetFollowers: Number(formData.targetFollowers),
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(tag => tag.trim()) : [],
        status: 'pending' // 기본값은 승인대기
      })

      if (response.ok) {
        onSuccess()
        onClose()
        // 폼 초기화
        setFormData({
          title: '',
          description: '',
          businessEmail: '',
          companyName: '',
          platform: 'INSTAGRAM',
          budget: '',
          targetFollowers: '',
          startDate: '',
          endDate: '',
          requirements: '',
          hashtags: '',
          imageUrl: '',
          enableTranslation: true
        })
      } else {
        const data = await response.json()
        setError(data.error || '캠페인 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('캠페인 생성 오류:', error)
      setError('캠페인 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">신규 캠페인 등록</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* 캠페인 정보 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">캠페인 정보</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        캠페인 제목 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        캠페인 설명 *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={(formData as any).description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          플랫폼 *
                        </label>
                        <select
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="INSTAGRAM">Instagram</option>
                          <option value="YOUTUBE">YouTube</option>
                          <option value="TIKTOK">TikTok</option>
                          <option value="FACEBOOK">Facebook</option>
                          <option value="X">X</option>
                          <option value="NAVERBLOG">네이버 블로그</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          예산 (원) *
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          시작일 *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          종료일 *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        목표 팔로워 수 *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.targetFollowers}
                        onChange={(e) => setFormData({ ...formData, targetFollowers: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        요구사항
                      </label>
                      <textarea
                        rows={3}
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="캠페인 참여 조건이나 요구사항을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        해시태그
                      </label>
                      <input
                        type="text"
                        value={formData.hashtags}
                        onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="쉼표로 구분하여 입력 (예: 뷰티, 패션, 리뷰)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        대표 이미지
                      </label>
                      <ImageUpload
                        value={formData.imageUrl}
                        onChange={handleImageChange}
                        category="campaigns"
                        multiple={false}
                        className="w-full"
                      />
                    </div>

                    {/* 자동 번역 옵션 */}
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableTranslation"
                        checked={formData.enableTranslation}
                        onChange={(e) => setFormData({ ...formData, enableTranslation: e.target.checked })}
                        className="mr-3"
                      />
                      <label htmlFor="enableTranslation" className="text-sm text-gray-700">
                        <span className="font-medium">자동 번역 활성화</span>
                        <span className="ml-2 text-gray-600">
                          (캠페인 정보를 영어와 일본어로 자동 번역합니다)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 업체 정보 */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">업체 정보</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        업체 이메일 *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.businessEmail}
                        onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="business@company.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '등록 중...' : '캠페인 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}