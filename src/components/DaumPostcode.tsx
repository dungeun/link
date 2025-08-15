'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
        }) => void;
        onclose?: () => void;
        width: string;
        height: string;
        animation?: boolean;
        autoMapping?: boolean;
      }) => {
        embed: (element: HTMLElement) => void;
      };
    };
  }
}

interface DaumPostcodeProps {
  onComplete: (data: {
    address: string
    addressType: string
    bname: string
    buildingName: string
  }) => void
  onClose?: () => void
}

export default function DaumPostcode({ onComplete, onClose }: DaumPostcodeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 스크립트가 이미 로드되어 있는지 확인
    const existingScript = document.querySelector('script[src*="daumcdn.net/mapjsapi/bundle/postcode"]')
    
    if (existingScript && window.daum?.Postcode) {
      // 스크립트가 이미 로드되어 있으면 바로 실행
      initPostcode()
    } else {
      // 스크립트 로드
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        initPostcode()
      }

      return () => {
        if (!existingScript) {
          document.body.removeChild(script)
        }
      }
    }
  }, [])

  const initPostcode = () => {
    if (window.daum && window.daum.Postcode && containerRef.current) {
      new window.daum.Postcode({
        oncomplete: function(data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
        }) {
          let fullAddress = data.address
          let extraAddress = ''

          if (data.addressType === 'R') {
            if (data.bname !== '') {
              extraAddress += data.bname
            }
            if (data.buildingName !== '') {
              extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName
            }
            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : ''
          }

          onComplete({
            address: fullAddress,
            addressType: data.addressType,
            bname: data.bname,
            buildingName: data.buildingName,
          })
        },
        onclose: onClose,
        width: '100%',
        height: '100%',
        animation: true,
        autoMapping: true
      }).embed(containerRef.current)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      data-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h3 className="text-lg font-semibold text-gray-900">주소 검색</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div ref={containerRef} className="w-full h-[450px] bg-white"></div>
      </div>
    </div>
  )
}