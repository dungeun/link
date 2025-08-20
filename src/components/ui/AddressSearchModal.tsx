'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface AddressSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
}

export default function AddressSearchModal({ isOpen, onClose, onComplete }: AddressSearchModalProps) {
  const postcodeRef = useRef<HTMLDivElement>(null)
  const postcodeInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) return

    // 모달이 열릴 때 우편번호 서비스 초기화
    const initPostcode = () => {
      if (!(window as any).daum || !(window as any).daum.Postcode) {
        console.error('카카오 우편번호 API가 로드되지 않았습니다.')
        return
      }

      if (postcodeRef.current && !postcodeInstanceRef.current) {
        postcodeInstanceRef.current = new (window as any).daum.Postcode({
          oncomplete: function(data: any) {
            onComplete(data)
            onClose()
          },
          onclose: function(state: any) {
            if (state === 'FORCE_CLOSE') {
              onClose()
            }
          },
          onresize: function(size: any) {
            // 모달 내에서 크기 조정 시 처리
          },
          width: '100%',
          height: '100%'
        })

        // 모달 내 div에 임베드
        postcodeInstanceRef.current.embed(postcodeRef.current)
      }
    }

    // 약간의 지연 후 초기화 (모달 애니메이션 완료 후)
    const timer = setTimeout(initPostcode, 100)

    return () => {
      clearTimeout(timer)
      if (postcodeInstanceRef.current) {
        // 우편번호 서비스 정리
        try {
          postcodeInstanceRef.current = null
        } catch (e) {
          console.warn('우편번호 서비스 정리 중 오류:', e)
        }
      }
    }
  }, [isOpen, onComplete, onClose])

  // 모달 닫기 시 정리
  useEffect(() => {
    if (!isOpen && postcodeInstanceRef.current) {
      postcodeInstanceRef.current = null
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              우편번호 검색
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* 우편번호 검색 영역 */}
          <div className="relative h-96">
            <div 
              ref={postcodeRef} 
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>
          
          {/* 모달 푸터 */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}