'use client'

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

const languages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', shortName: 'KO' },
  { code: 'en', name: 'English', flag: '🇺🇸', shortName: 'EN' },
  { code: 'jp', name: '日本語', flag: '🇯🇵', shortName: 'JP' },
]

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentLanguage, setLanguage, t } = useLanguage()

  // 하이드레이션 문제 방지를 위해 마운트 상태 추적
  useEffect(() => {
    setMounted(true)
  }, [])

  // 현재 언어 정보 - 메모이제이션
  const currentLang = useMemo(() => 
    languages.find(lang => lang.code === currentLanguage) || languages[0],
    [currentLanguage]
  )

  // 외부 클릭 핸들러 - 메모이제이션
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // 언어 변경 핸들러 - 메모이제이션
  const handleLanguageChange = useCallback((langCode: string) => {
    setLanguage(langCode as 'ko' | 'en' | 'jp')
    setIsOpen(false)
    
    // 페이지 새로고침 (선택사항 - 전체 앱 리렌더링)
    // window.location.reload()
  }, [setLanguage])

  // 토글 핸들러 - 메모이제이션
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // 마운트되기 전에는 기본 언어(한국어) 표시하여 하이드레이션 오류 방지 - 메모이제이션
  const displayLang = useMemo(() => 
    mounted ? currentLang : languages[0],
    [mounted, currentLang]
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        aria-label={t('language.selector.label', '언어 선택')}
      >
        <span className="text-lg">{displayLang.flag}</span>
        <span className="hidden sm:inline">{displayLang.shortName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3
                  ${currentLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// React.memo로 성능 최적화
export default memo(LanguageSelector)