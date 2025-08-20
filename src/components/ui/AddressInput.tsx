'use client'

import { useState, useEffect } from 'react'
import AddressSearchModal from './AddressSearchModal'


export interface AddressData {
  type: 'korea' | 'international'
  korea?: {
    zipCode: string
    roadAddress: string
    jibunAddress: string
    detailAddress: string
    extraAddress: string
  }
  international?: {
    country: string
    state: string
    city: string
    street: string
    zipCode: string
  }
}

interface AddressInputProps {
  nationality: string
  value: AddressData | null
  onChange: (address: AddressData | null) => void
  disabled?: boolean
}

export default function AddressInput({ nationality, value, onChange, disabled = false }: AddressInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isKoreanAddress, setIsKoreanAddress] = useState(nationality === '대한민국')
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    setIsKoreanAddress(nationality === '대한민국')
  }, [nationality])

  // 카카오 우편번호 서비스 스크립트 로드
  useEffect(() => {
    // 한국 주소가 아니면 스크립트 로드 필요 없음
    if (!isKoreanAddress) {
      setIsScriptLoaded(true)
      return
    }

    // 이미 로드되어 있으면 스킵
    if ((window as any).daum && (window as any).daum.Postcode) {
      setIsScriptLoaded(true)
      return
    }

    // 스크립트가 이미 DOM에 있는지 확인
    const existingScript = document.getElementById('daum-postcode-script')
    if (existingScript) {
      // 기존 스크립트가 있지만 로드되지 않았으면 대기
      let attempts = 0
      const maxAttempts = 50 // 5초 대기
      const checkLoaded = () => {
        attempts++
        if ((window as any).daum && (window as any).daum.Postcode) {
          setIsScriptLoaded(true)
        } else if (attempts < maxAttempts) {
          setTimeout(checkLoaded, 100)
        } else {
          console.error('카카오 우편번호 서비스 로드 타임아웃')
          setIsScriptLoaded(false)
        }
      }
      checkLoaded()
      return
    }

    const script = document.createElement('script')
    script.id = 'daum-postcode-script'
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    
    script.onload = () => {
      // 스크립트 로드 후 잠시 대기 (API 초기화 시간)
      setTimeout(() => {
        if ((window as any).daum && (window as any).daum.Postcode) {
          setIsScriptLoaded(true)
        } else {
          console.error('카카오 우편번호 API 초기화 실패')
          setIsScriptLoaded(false)
        }
      }, 100)
    }
    
    script.onerror = () => {
      console.error('카카오 우편번호 서비스 로드 실패')
      setIsScriptLoaded(false)
    }
    
    document.head.appendChild(script)

    // 클린업 함수는 제거 (전역 스크립트이므로)
  }, [isKoreanAddress])

  // 우편번호 검색 모달 열기
  const handleOpenAddressSearch = () => {
    if (!(window as any).daum || !(window as any).daum.Postcode) {
      if (!isScriptLoaded) {
        alert('우편번호 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      } else {
        alert('우편번호 검색 서비스를 사용할 수 없습니다.')
      }
      return
    }
    setIsModalOpen(true)
  }

  // 우편번호 검색 완료 처리
  const handleAddressComplete = (data: any) => {
    const newAddress: AddressData = {
      type: 'korea',
      korea: {
        zipCode: data.zonecode,
        roadAddress: data.roadAddress,
        jibunAddress: data.jibunAddress,
        detailAddress: value?.korea?.detailAddress || '',
        extraAddress: data.buildingName ? `(${data.buildingName})` : ''
      }
    }
    onChange(newAddress)
  }

  // 한국 상세주소 변경
  const handleKoreanDetailChange = (detailAddress: string) => {
    if (value?.type === 'korea' && value.korea) {
      onChange({
        ...value,
        korea: {
          ...value.korea,
          detailAddress
        }
      })
    }
  }

  // 해외 주소 변경
  const handleInternationalChange = (field: keyof NonNullable<AddressData['international']>, fieldValue: string) => {
    const currentInternational = value?.international || {
      country: '',
      state: '',
      city: '',
      street: '',
      zipCode: ''
    }

    onChange({
      type: 'international',
      international: {
        ...currentInternational,
        [field]: fieldValue
      }
    })
  }

  if (isKoreanAddress) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={value?.korea?.zipCode || ''}
            placeholder="우편번호"
            readOnly
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleOpenAddressSearch}
            disabled={disabled || !isScriptLoaded}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {!isScriptLoaded ? '로딩 중...' : '우편번호 찾기'}
          </button>
        </div>
        
        <input
          type="text"
          value={value?.korea?.roadAddress || ''}
          placeholder="도로명주소"
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          disabled={disabled}
        />
        
        <input
          type="text"
          value={value?.korea?.jibunAddress || ''}
          placeholder="지번주소"
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          disabled={disabled}
        />
        
        <div className="flex gap-2">
          <input
            type="text"
            value={value?.korea?.detailAddress || ''}
            onChange={(e) => handleKoreanDetailChange(e.target.value)}
            placeholder="상세주소를 입력하세요"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
          {value?.korea?.extraAddress && (
            <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg">
              {value.korea.extraAddress}
            </span>
          )}
        </div>

        {/* 우편번호 검색 모달 */}
        <AddressSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleAddressComplete}
        />
      </div>
    )
  }

  // 해외 주소 입력 폼
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={value?.international?.country || ''}
          onChange={(e) => handleInternationalChange('country', e.target.value)}
          placeholder="국가 (Country)"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <input
          type="text"
          value={value?.international?.state || ''}
          onChange={(e) => handleInternationalChange('state', e.target.value)}
          placeholder="주/도 (State/Province)"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={value?.international?.city || ''}
          onChange={(e) => handleInternationalChange('city', e.target.value)}
          placeholder="시/구 (City)"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <input
          type="text"
          value={value?.international?.zipCode || ''}
          onChange={(e) => handleInternationalChange('zipCode', e.target.value)}
          placeholder="우편번호 (ZIP Code)"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>
      
      <input
        type="text"
        value={value?.international?.street || ''}
        onChange={(e) => handleInternationalChange('street', e.target.value)}
        placeholder="상세주소 (Street Address)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      />

      {/* 우편번호 검색 모달 */}
      <AddressSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleAddressComplete}
      />
    </div>
  )
}