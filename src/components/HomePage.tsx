'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useLanguage } from '@/hooks/useLanguage'
import { logger } from '@/lib/logger'
import dynamic from 'next/dynamic'
// Lucide 픽토그램 아이콘 import
import {
  Sparkles,
  Shirt,
  UtensilsCrossed,
  Plane,
  Laptop,
  Dumbbell,
  Home,
  Heart,
  Baby,
  Gamepad2,
  GraduationCap
} from 'lucide-react'

// Code splitting for heavy components
const RankingSection = dynamic(() => import('@/components/home/RankingSection'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false
})

const RecommendedSection = dynamic(() => import('@/components/home/RecommendedSection'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false
})

const CategorySection = dynamic(() => import('@/components/home/CategorySection'), {
  loading: () => <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />,
  ssr: true
})

const ActiveCampaignsSection = dynamic(() => import('@/components/home/ActiveCampaignsSection'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />,
  ssr: false
})

import { CriticalCSS } from '@/components/CriticalCSS'
import Image from 'next/image'
import CampaignCard from '@/components/CampaignCard'
import { useWebWorker } from '@/hooks/useWebWorker'
import { initializePerformanceMonitoring, useWebVitals } from '@/lib/performance'

import { 
  BaseCampaign, 
  UISection, 
  LanguagePack, 
  LanguageCode, 
  UISectionContent,
  HeroSlide,
  QuickLink,
  JsonValue
} from '@/types/global'

interface Campaign extends Omit<BaseCampaign, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'budget'> {
  brand: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  platforms: string[]
  description: string
  createdAt: string
  budget: string
  campaignType?: string
  reviewPrice?: number
  imageUrl?: string
}

interface HomePageProps {
  initialSections: UISection[]
  initialLanguage?: LanguageCode
  initialLanguagePacks?: Record<string, LanguagePack>
  initialCampaigns?: Campaign[]
  initialCategoryStats?: Record<string, number>
  preloadMetadata?: {
    totalCampaigns: number
    loadTime: number
    cached: boolean
  }
}

function HomePage({ 
  initialSections, 
  initialLanguage = 'ko', 
  initialLanguagePacks = {},
  initialCampaigns = [],
  initialCategoryStats = {},
  preloadMetadata
}: HomePageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // 캠페인 데이터 상태 관리 - 무한 스크롤 지원
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => initialCampaigns)
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [sections] = useState<UISection[]>(() => initialSections || [])
  const [sectionsLoading] = useState(() => false) // 프리로드되었으므로 항상 false
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => initialLanguage)
  const [langPacks] = useState<Record<string, LanguagePack>>(() => initialLanguagePacks)
  
  // Web Worker for campaign processing
  const { postMessage: postWorkerMessage, subscribe } = useWebWorker('/workers/campaignWorker.js')
  
  // Performance monitoring
  const { getVitals, checkBudgets } = useWebVitals()
  
  // Web Worker error handling
  useEffect(() => {
    const unsubscribe = subscribe('ERROR', (error) => {
      logger.error('Worker error:', error)
    })
    
    // Campaigns are now preloaded, no need for worker processing
    
    return () => {
      unsubscribe()
    }
  }, [subscribe])
  
  // 언어팩 사용
  const { t: contextT, currentLanguage } = useLanguage()
  
  // 초기 렌더링을 위한 번역 함수 - contextT가 없을 때 fallback
  const t = (key: string, fallback?: string): string => {
    if (contextT) {
      return contextT(key, fallback)
    }
    // 초기 언어팩 데이터 사용
    const pack = langPacks[key]
    if (pack) {
      const lang: keyof LanguagePack = (currentLang as string) === 'ja' ? 'jp' : currentLang
      const translation = pack[lang]
      if (typeof translation === 'string') {
        return translation
      }
    }
    return fallback || key
  }
  
  // UI 설정 가져오기 (폴백용)
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
  // 폴백용 설정들 - 메모이제이션 적용
  const bannerSlides = useMemo(() => 
    config.mainPage?.heroSlides?.filter(slide => slide.visible) || [], 
    [config.mainPage?.heroSlides]
  )
  
  const menuCategories = useMemo(() => 
    config.mainPage?.categoryMenus?.filter(menu => menu.visible) || [], 
    [config.mainPage?.categoryMenus]
  )
  
  const sectionOrder = useMemo(() => 
    config.mainPage?.sectionOrder || [], 
    [config.mainPage?.sectionOrder]
  )
  
  const customSectionOrders = useMemo(() => 
    (config.mainPage?.customSections || [])
      .filter(section => section.visible)
      .map((section) => ({
        id: section.id,
        type: 'custom' as const,
        order: section.order || 999,
        visible: section.visible,
      })),
    [config.mainPage?.customSections]
  )
  
  const allSections = useMemo(() => {
    const sections = [...sectionOrder]
    customSectionOrders.forEach(customOrder => {
      const existingIndex = sections.findIndex(s => s.id === customOrder.id)
      if (existingIndex > -1) {
        sections[existingIndex] = customOrder
      } else {
        sections.push(customOrder)
      }
    })
    return sections
  }, [sectionOrder, customSectionOrders])
  
  const visibleSections = useMemo(() => 
    allSections
      .filter(s => s.visible)
      .sort((a, b) => a.order - b.order),
    [allSections]
  )

  // 디버깅 로그: 렌더링 시마다 상태를 확인합니다.
  console.log("--- HomePage 렌더링 정보 ---");
  console.log("DB에서 가져온 데이터 (sections):", sections);
  console.log("Zustand에서 가져온 순서/필터 (visibleSections):", visibleSections);
  console.log("---------------------------------");
  
  // Lucide 아이콘 맵핑
  const lucideIcons = useMemo(() => ({
    'Sparkles': Sparkles,
    'Shirt': Shirt,
    'UtensilsCrossed': UtensilsCrossed,
    'Plane': Plane,
    'Laptop': Laptop,
    'Dumbbell': Dumbbell,
    'Home': Home,
    'Heart': Heart,
    'Baby': Baby,
    'Gamepad2': Gamepad2,
    'GraduationCap': GraduationCap,
  }), [])

  // 카테고리별 기본 픽토그램 - Lucide 아이콘 사용
  const defaultCategoryIcons = useMemo(() => ({
    beauty: <Sparkles className="w-8 h-8" />,
    fashion: <Shirt className="w-8 h-8" />,
    food: <UtensilsCrossed className="w-8 h-8" />,
    travel: <Plane className="w-8 h-8" />,
    tech: <Laptop className="w-8 h-8" />,
    fitness: <Dumbbell className="w-8 h-8" />,
    lifestyle: <Home className="w-8 h-8" />,
    pet: <Heart className="w-8 h-8" />,
    parenting: <Baby className="w-8 h-8" />,
    game: <Gamepad2 className="w-8 h-8" />,
    education: <GraduationCap className="w-8 h-8" />,
  }), [])

  // Lucide 아이콘 렌더링 함수
  const renderCategoryIcon = useCallback((category: any, size: 'small' | 'large' = 'small') => {
    const sizeClasses = size === 'small' ? 'w-6 h-6' : 'w-7 h-7 lg:w-8 lg:h-8'
    
    if (category.icon) {
      // HTTP URL인 경우 이미지로 렌더링
      if (category.icon.startsWith('http')) {
        return <img src={category.icon} alt={category.name} className={`${sizeClasses} object-contain`} />
      }
      
      // Lucide 아이콘 이름인 경우 동적 렌더링
      const IconComponent = (lucideIcons as any)[category.icon]
      if (IconComponent) {
        return <IconComponent className={sizeClasses} />
      }
      
      // 기타 텍스트/이모지인 경우
      return <span className={size === 'small' ? 'text-lg' : 'text-xl lg:text-2xl'}>{category.icon}</span>
    }
    
    // 기본 아이콘 사용
    return (defaultCategoryIcons as any)[category.categoryId || ''] || (
      <svg className={sizeClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  }, [lucideIcons, defaultCategoryIcons])

  // 추가 캠페인 로드 (무한 스크롤)
  const loadMoreCampaigns = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (cursor) params.append('cursor', cursor)
      params.append('limit', '8')
      params.append('sort', 'latest')
      
      const response = await fetch(`/api/campaigns/optimized?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load campaigns')
      }
      
      const data = await response.json()
      
      setCampaigns(prev => [...prev, ...data.items])
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
      
      logger.info('HomePage: Loaded more campaigns', {
        count: data.items?.length,
        total: campaigns.length + data.items?.length
      })
    } catch (error) {
      logger.error('HomePage: Failed to load campaigns', error)
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading, campaigns.length])

  // 무한 스크롤 Hook 사용
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMoreCampaigns,
    hasMore,
    loading,
    threshold: 200
  })

  // Sections are now preloaded with language data - no need for loadSections function

  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()
    
    // 로그인 상태 확인
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 업체 사용자는 비즈니스 대시보드로 리다이렉트
    if (currentUser && currentUser.type === 'BUSINESS') {
      router.push('/business/dashboard')
    }

    // 캠페인 데이터는 이미 프리로드됨
  }, [router])

  // 언어 변경 시 섹션 데이터 재로드
  useEffect(() => {
    if (currentLanguage && currentLanguage !== currentLang) {
      console.log('Language changed to:', currentLanguage)
      setCurrentLang(currentLanguage as any)
      // 섹션 및 캠페인 데이터는 이미 프리로드됨
    }
  }, [currentLanguage, currentLang])

  // 히어로 슬라이드 자동 전환
  useEffect(() => {
    const heroSection = sections.find(s => s.type === 'hero')
    if (heroSection?.content?.slides && Array.isArray(heroSection.content.slides) && heroSection.content.slides.length > 1) {
      const slides = heroSection.content.slides
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [sections])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/campaigns?search=${encodeURIComponent(searchTerm)}`)
    }
  }, [searchTerm, router])

  // 언어별 콘텐츠 가져오기 - 초기 렌더링 시에는 currentLang 사용
  const getLocalizedContent = useCallback((section: UISection): UISectionContent => {
    const lang = currentLanguage || currentLang
    if (lang === 'ko' || !section.translations) {
      return section.content
    }
    
    const langKey = (lang as any) === 'ja' ? 'jp' : lang
    const translation = (section.translations as any)[langKey]
    
    if (translation) {
      return { ...section.content, ...translation }
    }
    
    return section.content
  }, [currentLanguage, currentLang])

  return (
    <>
      <CriticalCSS />
      <Header />
      <div className="min-h-screen bg-white main-content">

      <main className="container mx-auto px-6 py-8">
        
        {/* DB 섹션 렌더링 (있으면) - visibleSections 순서 적용 */}
        {sections.length > 0 ? (
          // visibleSections 순서대로 sections를 정렬하여 렌더링
          visibleSections
            .map(orderedSection => {
              // 해당 타입의 실제 섹션 데이터를 찾기
              const dbSection = sections.find(s => s.type === orderedSection.type)
              console.log(`Searching for section type: ${orderedSection.type}`, dbSection)
              return dbSection ? { ...dbSection, order: orderedSection.order } : null
            })
            .filter(section => section !== null)
            .map((section) => {
            const localizedContent = getLocalizedContent(section)
            console.log(`Rendering section type: ${section.type}, content:`, localizedContent)
            
            switch (section.type) {
              case 'hero':
                return localizedContent?.slides ? (
                  <div key={section.id} className="relative mb-8 hero-section">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-out hero-slide"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {(localizedContent.slides as any)?.map((slide: any, slideIndex: number) => (
                          <div key={slide.id} className="min-w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 현재 슬라이드 */}
                              <div className="w-full">
                                {slide.link ? (
                                  <Link href={slide.link} className="block group">
                                    <div className="relative">
                                      <div
                                        className={`w-full h-64 md:h-80 ${slide.bgColor} text-white relative rounded-2xl overflow-hidden`}
                                      >
                                        {slide.backgroundImage && (
                                          <Image
                                            src={slide.backgroundImage}
                                            alt={slide.title || ''}
                                            fill
                                            className="hero-image"
                                            priority={slideIndex === 0}
                                            quality={85}
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                          />
                                        )}
                                        {!slide.backgroundImage && (
                                          <div className={`absolute inset-0 ${slide.bgColor}`} />
                                        )}
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
                              {localizedContent.slides && (localizedContent.slides as any).length > 1 && (
                                <div className="hidden lg:block w-full">
                                  {(() => {
                                    const slides = localizedContent.slides as any
                                    const nextIndex = (slideIndex + 1) % slides.length
                                    const nextSlide = slides[nextIndex]
                                    
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
                    {(localizedContent.slides as any)?.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {(localizedContent.slides as any)?.map((_: any, index: number) => (
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

              

              case 'quicklinks':
                return localizedContent?.links ? (
                  <div key={section.id} className="mb-12">
                    {/* 데스크톱: 3단 그리드 */}
                    <div className="hidden md:grid md:grid-cols-3 gap-4">
                      {(localizedContent.links as any)?.map((link: any) => (
                        <Link 
                          key={link.id}
                          href={link.link} 
                          className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors group"
                        >
                          {link.icon && (
                            link.icon.startsWith('http') ? (
                              <Image 
                                src={link.icon} 
                                alt={link.title} 
                                width={32}
                                height={32}
                                className="object-contain"
                                loading="lazy"
                              />
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
                    
                    {/* 모바일: 1개씩 슬라이드 */}
                    <div className="md:hidden">
                      <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 px-4">
                        {(localizedContent.links as any)?.map((link: any) => (
                          <Link 
                            key={link.id}
                            href={link.link} 
                            className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors group w-[calc(100vw-2rem)] max-w-[320px] flex-shrink-0"
                          >
                            {link.icon && (
                              link.icon.startsWith('http') ? (
                                <Image 
                                  src={link.icon} 
                                  alt={link.title} 
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                  loading="lazy"
                                />
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
                    </div>
                  </div>
                ) : null

              case 'promo':
                const promoData = (localizedContent as any)?.banner || (localizedContent as any)
                return promoData ? (
                  <div key={section.id} className="mb-12">
                    {(promoData as any).link ? (
                      <Link href={(promoData as any).link}>
                        <div 
                          className="rounded-2xl p-6 cursor-pointer hover:opacity-95 transition-opacity relative overflow-hidden"
                          style={{
                            backgroundImage: (promoData as any).backgroundImage 
                              ? `url(${(promoData as any).backgroundImage})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: !(promoData as any).backgroundImage 
                              ? (promoData as any).backgroundColor || '#FEF3C7'
                              : undefined
                          }}
                        >
                          <div className={`flex items-center justify-between ${
                            (promoData as any).backgroundImage ? 'relative z-10' : ''
                          }`}>
                            {(promoData as any).backgroundImage && (
                              <div className="absolute inset-0 bg-black/20 -z-10" />
                            )}
                            <div>
                              <h3 className={`text-xl font-bold mb-1`}
                                style={{ 
                                  color: (promoData as any).backgroundImage ? '#FFFFFF' : (promoData as any).textColor || '#000000' 
                                }}
                              >
                                {(promoData as any).title}
                              </h3>
                              <p style={{ 
                                color: (promoData as any).backgroundImage ? '#FFFFFF' : (promoData as any).textColor || '#000000',
                                opacity: (promoData as any).backgroundImage ? 0.9 : 0.8
                              }}>
                                {(promoData as any).subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {(promoData as any).icon && (
                                <span className="text-5xl">{(promoData as any).icon}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div 
                        className="rounded-2xl p-6 relative overflow-hidden"
                        style={{
                          backgroundImage: (promoData as any).backgroundImage 
                            ? `url(${(promoData as any).backgroundImage})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: !(promoData as any).backgroundImage 
                            ? (promoData as any).backgroundColor || '#FEF3C7'
                            : undefined
                        }}
                      >
                        <div className={`flex items-center justify-between ${
                          (promoData as any).backgroundImage ? 'relative z-10' : ''
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

              case 'category':
                return localizedContent?.categories ? (
                  <div key={section.id} className="mb-12">
                    {/* 데스크톱: 가로 스크롤, 모바일: 그리드 */}
                    <div className="px-4">
                      {/* 모바일: 그리드 레이아웃 */}
                      <div className="grid grid-cols-4 gap-3 sm:hidden">
                        {(localizedContent.categories as Array<{
                          id: string;
                          link?: string;
                          categoryId?: string;
                          name: string;
                          icon?: string;
                          iconType?: string;
                          badge?: string;
                          badgeColor?: string;
                        }>).map((category) => (
                          <Link
                            key={category.id}
                            href={category.link || `/category/${category.categoryId}`}
                            className="flex flex-col items-center gap-1.5 group"
                          >
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors relative">
                              {renderCategoryIcon(category, 'small')}
                              {category.badge && (
                                <span className={`absolute -top-1 -right-1 text-[8px] px-1 py-0.5 text-white rounded-full font-bold min-w-[14px] text-center leading-none ${
                                  category.badgeColor === 'blue' ? 'bg-blue-500' :
                                  category.badgeColor === 'green' ? 'bg-green-500' :
                                  category.badgeColor === 'purple' ? 'bg-purple-500' :
                                  category.badgeColor === 'orange' ? 'bg-orange-500' :
                                  category.badgeColor === 'yellow' ? 'bg-yellow-500' :
                                  category.badgeColor === 'pink' ? 'bg-pink-500' :
                                  'bg-red-500'
                                }`}>
                                  {category.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-700 text-center leading-tight">
                              {category.name}
                            </span>
                          </Link>
                        ))}
                      </div>

                      {/* 태블릿/데스크톱: 가로 스크롤 */}
                      <div className="hidden sm:block overflow-x-auto">
                        <div className="flex gap-3 lg:gap-2 pb-4 justify-center pt-4 pb-2 min-w-max">
                          {(localizedContent.categories as Array<{
                            id: string;
                            link?: string;
                            categoryId?: string;
                            name: string;
                            icon?: string;
                            iconType?: string;
                            badge?: string;
                            badgeColor?: string;
                          }>).map((category) => (
                            <Link
                              key={category.id}
                              href={category.link || `/category/${category.categoryId}`}
                              className="flex flex-col items-center gap-2 min-w-[60px] lg:min-w-[70px] group"
                            >
                              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors relative">
                                {renderCategoryIcon(category, 'large')}
                                {category.badge && (
                                  <span className={`absolute -top-1.5 -right-1.5 text-[9px] lg:text-[10px] px-1.5 py-0.5 text-white rounded-full font-bold min-w-[16px] lg:min-w-[18px] text-center leading-none ${
                                    category.badgeColor === 'blue' ? 'bg-blue-500' :
                                    category.badgeColor === 'green' ? 'bg-green-500' :
                                    category.badgeColor === 'purple' ? 'bg-purple-500' :
                                    category.badgeColor === 'orange' ? 'bg-orange-500' :
                                    category.badgeColor === 'yellow' ? 'bg-yellow-500' :
                                    category.badgeColor === 'pink' ? 'bg-pink-500' :
                                    'bg-red-500'
                                  }`}>
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
                  </div>
                ) : null

              case 'ranking':
                return (
                  <RankingSection
                    key={section.id}
                    section={section as any}
                    localizedContent={localizedContent}
                    t={t}
                  />
                )

              case 'recommended':
                return (
                  <RecommendedSection
                    key={section.id}
                    section={section as any}
                    localizedContent={localizedContent}
                    t={t}
                  />
                )
              case 'active-campaigns':
                return (
                  <ActiveCampaignsSection
                    key={section.id}
                    section={section as any}
                    localizedContent={localizedContent}
                    t={t}
                  />
                )
              

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

      </main>
      </div>
      <Footer />
    </>
  )
}

// React.memo로 성능 최적화
export default memo(HomePage)