'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: any) => void
        onclose?: (state: string) => void
        width?: string | number
        height?: string | number
      }) => {
        open: () => void
        embed: (element: HTMLElement) => void
      }
    }
  }
}

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
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false)
  const [isKoreanAddress, setIsKoreanAddress] = useState(nationality === '대한민국')

  useEffect(() => {
    setIsKoreanAddress(nationality === '대한민국')
  }, [nationality])

  // 카카오 우편번호 검색
  const handleKakaoPostcode = () => {
    if (!window.daum) {
      alert('우편번호 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
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
        setIsPostcodeOpen(false)
      },
      onclose: function(state) {
        if (state === 'COMPLETE_CLOSE') {
          setIsPostcodeOpen(false)
        }
      },
      width: '100%',
      height: '400px'
    }).open()
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
            onClick={handleKakaoPostcode}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            우편번호 찾기
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
    </div>
  )
}