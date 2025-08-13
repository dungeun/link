'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useLanguage } from '@/hooks/useLanguage'
import { logger } from '@/lib/logger'

interface Campaign {
  id: string
  title: string
  brand: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  platforms: string[]
  description: string
  createdAt: string
  budget: string
  imageUrl?: string
}

interface HomePageProps {
  initialSections: any[]
  initialLanguage?: string
  initialLanguagePacks?: Record<string, any>
}

export default function HomePage({ initialSections, initialLanguage = 'ko', initialLanguagePacks = {} }: HomePageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<any[]>(initialSections || [])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState(initialLanguage)
  const [langPacks, setLangPacks] = useState(initialLanguagePacks)
  
  // 언어팩 사용
  const { t: contextT, currentLanguage } = useLanguage()
  
  // 초기 렌더링을 위한 번역 함수 - contextT가 없을 때 fallback
  const t = (key: string, fallback?: string) => {
    if (contextT) {
      return contextT(key, fallback)
    }
    // 초기 언어팩 데이터 사용
    const pack = langPacks[key]
    if (pack) {
      const lang = currentLang === 'ja' ? 'jp' : currentLang
      return pack[lang] || fallback || key
    }
    return fallback || key
  }
  
  // UI 설정 가져오기 (폴백용)
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
  // 폴백용 설정들
  const bannerSlides = config.mainPage?.heroSlides?.filter(slide => slide.visible) || []
  const menuCategories = config.mainPage?.categoryMenus?.filter(menu => menu.visible) || []
  const sectionOrder = config.mainPage?.sectionOrder || []
  const customSectionOrders = (config.mainPage?.customSections || [])
    .filter(section => section.visible)
    .map((section) => ({
      id: section.id,
      type: 'custom' as const,
      order: section.order || 999,
      visible: section.visible,
    }))
  
  const allSections = [...sectionOrder]
  customSectionOrders.forEach(customOrder => {
    const existingIndex = allSections.findIndex(s => s.id === customOrder.id)
    if (existingIndex > -1) {
      allSections[existingIndex] = customOrder
    } else {
      allSections.push(customOrder)
    }
  })
  
  const visibleSections = allSections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order)
  
  // 카테고리별 기본 픽토그램
  const defaultCategoryIcons: Record<string, React.ReactNode> = {
    beauty: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    fashion: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    fashion: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    food: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    travel: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    tech: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    fitness: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    lifestyle: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    pet: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    ),
    parenting: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    game: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    education: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns?status=active&limit=10')
      const data = await response.json()
      
      if (data.campaigns) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      logger.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  // 언어 변경 시 섹션 데이터 재로드 
  const loadSections = async (lang: string) => {
    try {
      setSectionsLoading(true)
      console.log('Loading sections for language:', lang)
      const response = await fetch(`/api/home/sections?lang=${lang}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Sections API response:', data)
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections)
          console.log('Set sections:', data.sections.length)
          logger.info('Loaded sections from DB:', data.sections.length)
        } else {
          // 초기 서버 데이터가 있으면 유지
          if (initialSections && initialSections.length > 0) {
            setSections(initialSections)
          } else {
            setSections([])
          }
        }
      } else {
        console.error('API response not ok:', response.status)
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
      logger.error('Failed to load sections:', error)
      // 초기 서버 데이터가 있으면 유지
      if (initialSections && initialSections.length > 0) {
        setSections(initialSections)
      }
    } finally {
      setSectionsLoading(false)
    }
  }

  useEffect(() => {
    // UI 설정 로드 (폴백용)
    loadSettingsFromAPI()
    
    // 로그인 상태 확인
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 업체 사용자는 비즈니스 대시보드로 리다이렉트
    if (currentUser && (currentUser.type === 'BUSINESS' || currentUser.type === 'business')) {
      router.push('/business/dashboard')
    }

    // 캠페인 데이터 로드
    loadCampaigns()
  }, [router, loadSettingsFromAPI])

  // 언어 변경 시 섹션 데이터 재로드
  useEffect(() => {
    if (currentLanguage && currentLanguage !== currentLang) {
      console.log('Language changed to:', currentLanguage)
      setCurrentLang(currentLanguage)
      loadSections(currentLanguage)
      loadCampaigns()
    }
  }, [currentLanguage, currentLang])

  // 히어로 슬라이드 자동 전환
  useEffect(() => {
    const heroSection = sections.find(s => s.type === 'hero')
    if (heroSection?.content?.slides && heroSection.content.slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSection.content.slides.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [sections])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/campaigns?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  // 언어별 콘텐츠 가져오기 - 초기 렌더링 시에는 currentLang 사용
  const getLocalizedContent = (section: any) => {
    const lang = currentLanguage || currentLang
    if (lang === 'ko' || !section.translations) {
      return section.content
    }
    
    const langKey = lang === 'ja' ? 'jp' : lang
    const translation = section.translations[langKey]
    
    if (translation) {
      return { ...section.content, ...translation }
    }
    
    return section.content
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">

      <main className="container mx-auto px-6 py-8">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p>Sections loaded: {sections.length}</p>
            <p>Loading: {sectionsLoading ? 'Yes' : 'No'}</p>
            <p>Language: {currentLanguage}</p>
          </div>
        )}
        
        {/* DB 섹션 렌더링 (있으면) */}
        {sections.length > 0 ? (
          sections.map((section) => {
            const localizedContent = getLocalizedContent(section)
            
            switch (section.type) {
              case 'hero':
                return localizedContent?.slides ? (
                  <div key={section.id} className="relative mb-8">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {localizedContent.slides.map((slide: any, slideIndex: number) => (
                          <div key={slide.id} className="min-w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 현재 슬라이드 */}
                              <div className="w-full">
                                {slide.link ? (
                                  <Link href={slide.link} className="block group">
                                    <div className="relative">
                                      <div
                                        className={`w-full h-64 md:h-80 ${slide.bgColor} text-white relative rounded-2xl overflow-hidden`}
                                        style={{
                                          backgroundImage: slide.backgroundImage 
                                            ? `url(${slide.backgroundImage})`
                                            : undefined,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center'
                                        }}
                                      >
                                        <div className="absolute inset-0 flex items-center justify-center px-8">
                                          <div className="text-center max-w-2xl">
                                            {slide.tag && (
                                              <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium mb-3">
                                                {slide.tag}
                                              </span>
                                            )}
                                            <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">
                                              {slide.title}
                                            </h1>
                                            <p className="text-lg md:text-xl opacity-90">
                                              {slide.subtitle}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="absolute bottom-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                ) : (
                                  <div className="relative">
                                    <div
                                      className={`w-full h-64 md:h-80 ${slide.bgColor} text-white relative rounded-2xl overflow-hidden`}
                                      style={{
                                        backgroundImage: slide.backgroundImage 
                                          ? `url(${slide.backgroundImage})`
                                          : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                      }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center px-8">
                                        <div className="text-center max-w-2xl">
                                          {slide.tag && (
                                            <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium mb-3">
                                              {slide.tag}
                                            </span>
                                          )}
                                          <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">
                                            {slide.title}
                                          </h1>
                                          <p className="text-lg md:text-xl opacity-90">
                                            {slide.subtitle}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 다음 슬라이드 미리보기 */}
                              {localizedContent.slides.length > 1 && (
                                <div className="hidden lg:block w-full">
                                  {(() => {
                                    const nextIndex = (slideIndex + 1) % localizedContent.slides.length
                                    const nextSlide = localizedContent.slides[nextIndex]
                                    
                                    return (
                                      <div className="h-full">
                                        <div
                                          className={`w-full h-64 md:h-80 ${nextSlide.bgColor} text-white relative rounded-2xl overflow-hidden opacity-50`}
                                          style={{
                                            backgroundImage: nextSlide.backgroundImage 
                                              ? `url(${nextSlide.backgroundImage})`
                                              : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                          }}
                                        >
                                          <div className="absolute inset-0 flex items-center justify-center px-8">
                                            <div className="text-center max-w-2xl">
                                              <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-pre-line">
                                                {nextSlide.title}
                                              </h2>
                                              <p className="text-base md:text-lg opacity-90">
                                                {nextSlide.subtitle}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 슬라이드 인디케이터 */}
                    {localizedContent.slides.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {localizedContent.slides.map((_: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentSlide 
                                ? 'w-8 bg-gray-800' 
                                : 'bg-gray-400 hover:bg-gray-600'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null

              case 'category':
                return localizedContent?.categories ? (
                  <div key={section.id} className="mb-12">
                    <div className="overflow-x-auto px-4">
                      <div className="flex gap-6 pb-4 justify-center pt-6 pb-2">
                        {localizedContent.categories.map((category: any) => (
                          <Link
                            key={category.id}
                            href={`/campaigns?category=${category.categoryId}`}
                            className="flex flex-col items-center gap-2 min-w-[80px] group"
                          >
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors relative mt-2">
                              {category.icon ? (
                                category.icon.startsWith('http') ? (
                                  <img src={category.icon} alt={category.name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <span className="text-2xl">{category.icon}</span>
                                )
                              ) : (
                                defaultCategoryIcons[category.categoryId] || (
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                )
                              )}
                              {category.badge && (
                                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full font-bold min-w-[18px] text-center leading-none">
                                  {category.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-700 text-center">
                              {category.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null

              case 'quicklinks':
                return localizedContent?.links ? (
                  <div key={section.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {localizedContent.links.map((link: any) => (
                      <Link 
                        key={link.id}
                        href={link.link} 
                        className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors group"
                      >
                        {link.icon && (
                          link.icon.startsWith('http') ? (
                            <img src={link.icon} alt={link.title} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-2xl">{link.icon}</span>
                          )
                        )}
                        <span className="font-medium text-gray-800 group-hover:text-blue-600">
                          {link.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null

              case 'promo':
                const promoData = localizedContent?.banner || localizedContent
                return promoData ? (
                  <div key={section.id} className="mb-12">
                    {promoData.link ? (
                      <Link href={promoData.link}>
                        <div 
                          className="rounded-2xl p-6 cursor-pointer hover:opacity-95 transition-opacity relative overflow-hidden"
                          style={{
                            backgroundImage: promoData.backgroundImage 
                              ? `url(${promoData.backgroundImage})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: !promoData.backgroundImage 
                              ? promoData.backgroundColor || '#FEF3C7'
                              : undefined
                          }}
                        >
                          <div className={`flex items-center justify-between ${
                            promoData.backgroundImage ? 'relative z-10' : ''
                          }`}>
                            {promoData.backgroundImage && (
                              <div className="absolute inset-0 bg-black/20 -z-10" />
                            )}
                            <div>
                              <h3 className={`text-xl font-bold mb-1`}
                                style={{ 
                                  color: promoData.backgroundImage ? '#FFFFFF' : promoData.textColor || '#000000' 
                                }}
                              >
                                {promoData.title}
                              </h3>
                              <p style={{ 
                                color: promoData.backgroundImage ? '#FFFFFF' : promoData.textColor || '#000000',
                                opacity: promoData.backgroundImage ? 0.9 : 0.8
                              }}>
                                {promoData.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {promoData.icon && (
                                <span className="text-5xl">{promoData.icon}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div 
                        className="rounded-2xl p-6 relative overflow-hidden"
                        style={{
                          backgroundImage: promoData.backgroundImage 
                            ? `url(${promoData.backgroundImage})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: !promoData.backgroundImage 
                            ? promoData.backgroundColor || '#FEF3C7'
                            : undefined
                        }}
                      >
                        <div className={`flex items-center justify-between ${
                          promoData.backgroundImage ? 'relative z-10' : ''
                        }`}>
                          {promoData.backgroundImage && (
                            <div className="absolute inset-0 bg-black/20 -z-10" />
                          )}
                          <div>
                            <h3 className={`text-xl font-bold mb-1`}
                              style={{ 
                                color: promoData.backgroundImage ? '#FFFFFF' : promoData.textColor || '#000000' 
                              }}
                            >
                              {promoData.title}
                            </h3>
                            <p style={{ 
                              color: promoData.backgroundImage ? '#FFFFFF' : promoData.textColor || '#000000',
                              opacity: promoData.backgroundImage ? 0.9 : 0.8
                            }}>
                              {promoData.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {promoData.icon && (
                              <span className="text-5xl">{promoData.icon}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null

              default:
                return null
            }
          })
        ) : (
          // 폴백 UI - DB에 데이터가 없을 때
          sectionsLoading ? (
            <div className="text-center py-16">
              <p className="text-gray-500">콘텐츠를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">표시할 콘텐츠가 없습니다.</p>
            </div>
          )
        )}

        {/* 캠페인 섹션 */}
        <div className="mt-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('homepage.campaigns.title', '진행 중인 캠페인')}</h2>
            <Link 
              href="/campaigns" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('homepage.campaigns.viewAll', '더보기')} →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {campaigns.slice(0, 8).map((campaign) => (
                <Link 
                  key={campaign.id} 
                  href={`/campaigns/${campaign.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    {campaign.imageUrl && (
                      <img 
                        src={campaign.imageUrl} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                        D-{campaign.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-1">{campaign.brand}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {campaign.applicants}/{campaign.maxApplicants}명
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {campaign.budget}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <p className="text-gray-500">{t('homepage.campaigns.noCampaigns', '진행 중인 캠페인이 없습니다.')}</p>
            </div>
          )}
        </div>
      </main>
      </div>
      <Footer />
    </>
  )
}