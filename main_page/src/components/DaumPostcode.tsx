'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    daum: any
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
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.daum && window.daum.Postcode) {
        new window.daum.Postcode({
          oncomplete: function(data: any) {
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
          height: '100%'
        }).embed(document.getElementById('daum-postcode-wrap'))
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">주소 검색</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="daum-postcode-wrap" className="w-full h-[400px]"></div>
      </div>
    </div>
  )
}