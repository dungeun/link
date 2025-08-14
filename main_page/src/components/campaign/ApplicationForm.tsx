'use client'

import { useState, useEffect } from 'react'
import { Check, User } from 'lucide-react'

interface ApplicationFormProps {
  campaignId: string
  userId: string
  onSubmit: (data: any) => void
}

interface ProfileData {
  name: string
  phone: string
  email: string
  instagram: string
  youtube: string
  tiktok: string
  address: string
  detailAddress: string
  postalCode: string
}

export default function ApplicationForm({ campaignId, userId, onSubmit }: ApplicationFormProps) {
  const [useProfile, setUseProfile] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    address: '',
    detailAddress: '',
    postalCode: '',
    message: '',
    proposedPrice: ''
  })

  // 프로필 데이터 로드
  useEffect(() => {
    loadProfileData()
  }, [userId])

  const loadProfileData = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  // 프로필 사용 체크박스 변경
  const handleUseProfileChange = (checked: boolean) => {
    setUseProfile(checked)
    
    if (checked && profileData) {
      // 프로필 정보로 폼 자동 채우기
      setFormData(prev => ({
        ...prev,
        name: profileData.name || '',
        phone: profileData.phone || '',
        email: profileData.email || '',
        instagram: profileData.instagram || '',
        youtube: profileData.youtube || '',
        tiktok: profileData.tiktok || '',
        address: profileData.address || '',
        detailAddress: profileData.detailAddress || '',
        postalCode: profileData.postalCode || ''
      }))
    } else if (!checked) {
      // 폼 초기화
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        email: '',
        instagram: '',
        youtube: '',
        tiktok: '',
        address: '',
        detailAddress: '',
        postalCode: ''
      }))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      campaignId,
      useProfileData: useProfile
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 프로필 정보 사용 체크박스 */}
      {profileData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(e) => handleUseProfileChange(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  프로필 정보 사용
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                마이페이지에 등록된 프로필 정보를 자동으로 입력합니다
              </p>
            </div>
          </label>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">기본 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              disabled={useProfile}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="010-0000-0000"
              required
              disabled={useProfile}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              disabled={useProfile}
            />
          </div>
        </div>
      </div>

      {/* SNS 정보 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">SNS 정보</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              인스타그램
            </label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="@username"
              disabled={useProfile}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              유튜브
            </label>
            <input
              type="text"
              value={formData.youtube}
              onChange={(e) => handleInputChange('youtube', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="채널명"
              disabled={useProfile}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              틱톡
            </label>
            <input
              type="text"
              value={formData.tiktok}
              onChange={(e) => handleInputChange('tiktok', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="@username"
              disabled={useProfile}
            />
          </div>
        </div>
      </div>

      {/* 배송 주소 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">배송 주소</h3>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="우편번호"
              disabled={useProfile}
            />
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              disabled={useProfile}
            >
              주소 검색
            </button>
          </div>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="기본 주소"
            disabled={useProfile}
          />
          <input
            type="text"
            value={formData.detailAddress}
            onChange={(e) => handleInputChange('detailAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="상세 주소"
            disabled={useProfile}
          />
        </div>
      </div>

      {/* 지원 메시지 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          지원 메시지 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="캠페인 참여 의사와 본인 PR을 작성해주세요..."
          required
        />
      </div>

      {/* 제안 가격 (선택) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제안 가격
          <span className="text-xs text-gray-500 ml-2">(선택사항)</span>
        </label>
        <input
          type="number"
          value={formData.proposedPrice}
          onChange={(e) => handleInputChange('proposedPrice', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          placeholder="협의 가능한 경우 제안 가격을 입력하세요"
        />
      </div>

      {/* 알림 메시지 */}
      {!profileData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 마이페이지에서 프로필 정보를 미리 등록하면 캠페인 신청이 더 빠르고 편리해집니다!
          </p>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          신청하기
        </button>
      </div>
    </form>
  )
}