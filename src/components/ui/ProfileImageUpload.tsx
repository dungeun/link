'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, User, Download, ExternalLink, AlertCircle } from 'lucide-react'
import { getCountryFlag, normalizeCountryName } from '@/lib/utils/country-flags'

interface ProfileImageUploadProps {
  currentImage?: string | null
  userName: string
  nationality?: string | null
  onImageChange: (imageUrl: string | null, imageFile?: File) => void
  onImportFromSocial?: (provider: 'google' | 'kakao' | 'naver') => void
  disabled?: boolean
}

interface SocialAccount {
  id: string
  provider: string
  profileImage: string | null
  createdAt: string
  updatedAt: string
}

interface SocialAccountsStatus {
  google: SocialAccount | null
  kakao: SocialAccount | null
  naver: SocialAccount | null
}

export default function ProfileImageUpload({
  currentImage,
  userName,
  nationality,
  onImageChange,
  onImportFromSocial,
  disabled = false
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountsStatus>({
    google: null,
    kakao: null,
    naver: null
  })
  const [loadingSocial, setLoadingSocial] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 소셜 계정 연동 상태 조회
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/user/social-accounts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setSocialAccounts(data.accounts || {})
        }
      } catch (error) {
        console.error('Failed to fetch social accounts:', error)
      }
    }

    fetchSocialAccounts()
  }, [])

  // 파일 업로드 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하만 업로드 가능합니다.')
      return
    }

    // 파일 형식 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      setIsUploading(true)
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewUrl(result)
        onImageChange(result, file)
      }
      reader.readAsDataURL(file)

    } catch (error) {
      console.error('Image upload failed:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // 이미지 삭제
  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 소셜 로그인 이미지 가져오기
  const handleSocialImport = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      setLoadingSocial(true)
      const token = localStorage.getItem('token')
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      const response = await fetch(`/api/user/social-profile-image?provider=${provider}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok && data.success && data.imageUrl) {
        setPreviewUrl(data.imageUrl)
        onImageChange(data.imageUrl)
        
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert(data.error || `${provider} 프로필 이미지를 가져올 수 없습니다.`)
      }
    } catch (error) {
      console.error('Social import failed:', error)
      alert('소셜 프로필 이미지 가져오기에 실패했습니다.')
    } finally {
      setLoadingSocial(false)
    }
  }

  // 소셜 계정 연결 상태 확인
  const isSocialConnected = (provider: 'google' | 'kakao' | 'naver') => {
    return socialAccounts[provider] !== null
  }

  // 소셜 제공자별 스타일
  const getSocialButtonStyle = (provider: 'google' | 'kakao' | 'naver') => {
    const isConnected = isSocialConnected(provider)
    const baseStyle = "flex items-center justify-center gap-1 px-2 py-2 rounded-lg disabled:opacity-50 transition-colors text-xs relative"
    
    switch (provider) {
      case 'google':
        return `${baseStyle} ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'} text-white`
      case 'kakao':
        return `${baseStyle} ${isConnected ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-400'} text-white`
      case 'naver':
        return `${baseStyle} ${isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'} text-white`
      default:
        return `${baseStyle} bg-gray-400 text-white`
    }
  }

  return (
    <div className="space-y-4">
      {/* 현재 프로필 이미지 또는 기본 아바타 */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="프로필 이미지"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          
          {/* 국적 국기 아이콘 */}
          {nationality && (
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-lg border-2 border-gray-100 flex items-center justify-center">
              <span className="text-lg" title={`국적: ${nationality}`}>
                {getCountryFlag(normalizeCountryName(nationality))}
              </span>
            </div>
          )}
          
          {/* 카메라 아이콘 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* 업로드 버튼들 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? '업로드 중...' : '이미지 업로드'}
          </button>
          
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={disabled}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              삭제
            </button>
          )}
        </div>

        {/* 소셜 로그인 이미지 가져오기 */}
        {(
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">또는 소셜 계정에서 가져오기</p>
            <div className="grid grid-cols-3 gap-2">
              {/* Google */}
              <button
                type="button"
                onClick={() => handleSocialImport('google')}
                disabled={disabled || loadingSocial || !isSocialConnected('google')}
                className={getSocialButtonStyle('google')}
                title={isSocialConnected('google') ? 'Google 프로필 이미지 가져오기' : 'Google 계정이 연결되지 않음'}
              >
                {loadingSocial ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : isSocialConnected('google') ? (
                  <Download className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Google
                {!isSocialConnected('google') && (
                  <ExternalLink className="w-2 h-2 absolute -top-1 -right-1" />
                )}
              </button>
              
              {/* Kakao */}
              <button
                type="button"
                onClick={() => handleSocialImport('kakao')}
                disabled={disabled || loadingSocial || !isSocialConnected('kakao')}
                className={getSocialButtonStyle('kakao')}
                title={isSocialConnected('kakao') ? 'Kakao 프로필 이미지 가져오기' : 'Kakao 계정이 연결되지 않음'}
              >
                {loadingSocial ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : isSocialConnected('kakao') ? (
                  <Download className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Kakao
                {!isSocialConnected('kakao') && (
                  <ExternalLink className="w-2 h-2 absolute -top-1 -right-1" />
                )}
              </button>
              
              {/* Naver */}
              <button
                type="button"
                onClick={() => handleSocialImport('naver')}
                disabled={disabled || loadingSocial || !isSocialConnected('naver')}
                className={getSocialButtonStyle('naver')}
                title={isSocialConnected('naver') ? 'Naver 프로필 이미지 가져오기' : 'Naver 계정이 연결되지 않음'}
              >
                {loadingSocial ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : isSocialConnected('naver') ? (
                  <Download className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                Naver
                {!isSocialConnected('naver') && (
                  <ExternalLink className="w-2 h-2 absolute -top-1 -right-1" />
                )}
              </button>
            </div>
            
            {/* 연결되지 않은 계정 안내 */}
            {!isSocialConnected('google') || !isSocialConnected('kakao') || !isSocialConnected('naver') ? (
              <p className="text-xs text-gray-400 text-center">
                회색 버튼: 해당 소셜 계정이 연결되지 않았습니다.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}