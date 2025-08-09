'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

const languages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', shortName: 'KO' },
  { code: 'en', name: 'English', flag: '🇺🇸', shortName: 'EN' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', shortName: 'JA' },
]

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentLanguage, setLanguage, t } = useLanguage()

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'ko' | 'en' | 'ja')
    setIsOpen(false)
    
    // 페이지 새로고침 (선택사항 - 전체 앱 리렌더링)
    // window.location.reload()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        aria-label={t('language.selector.label', '언어 선택')}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.shortName}</span>
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