'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
// JSON-first: 무한 스크롤 대신 간단한 페이지네이션
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
// JSON-first: UI Config Store 대신 정적 JSON 사용
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useLanguage } from '@/hooks/useLanguage'
import { logger } from '@/lib/logger'
import { StaticUITexts, createTranslationFunction } from '@/lib/cache/json-loader'
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
  GraduationCap,
  Trophy,
  PlusCircle,
  BarChart3,
  Shield,
  Tag,
  ShoppingCart,
  AlertTriangle,
  Smartphone,
  BookOpen,
  ThumbsUp,
  Users,
  Flower2
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
// JSON-first: Web Worker와 Performance Monitoring 불필요

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
  initialSections: any[] // JSON-first 섹션 데이터
  initialLanguage?: LanguageCode
  initialLanguagePacks?: Record<string, any>
  initialCampaigns?: any[]
  initialCategoryStats?: Record<string, number>
  staticUITexts?: StaticUITexts | null
  preloadMetadata?: {
    loadTime: number
    cached: boolean
    source: string
  }
}

function HomePage({ 
  initialSections, 
  initialLanguage = 'ko',
  initialLanguagePacks = {},
  initialCampaigns = [],
  initialCategoryStats = {},
  staticUITexts = null,
  preloadMetadata
}: HomePageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // JSON-first 섹션 데이터 (이미 언어별로 번역됨)
  const [sections] = useState(() => initialSections || [])
  
  // 캠페인 관련 상태는 필요시 별도 구현
  const [loading, setLoading] = useState(false)
  
  // JSON-first: 더이상 복잡한 처리가 필요없음
  
  // JSON-first: Web Worker 처리 불필요
  
  // 언어팩 사용
  const { t: contextT, currentLanguage } = useLanguage()
  
  // JSON 기반 정적 UI 텍스트 번역 함수
  const getStaticTexts = (lang: LanguageCode) => {
    const adjustedLang = lang
    return staticUITexts[adjustedLang] || staticUITexts['ko'] || null
  }
  
  // 통합 번역 함수 - JSON 정적 텍스트 우선, 동적 컨텐츠는 contextT 사용
  const t = (key: string, fallback?: string): string => {
    const currentLang = currentLanguage || initialLanguage
    // 언어 코드 변환: 'ja' -> 'jp'
    const normalizedLang: LanguageCode = 
      (currentLang as string) === 'ja' ? 'jp' : 
      (currentLang as string) === 'jp' ? 'jp' :
      (currentLang as string) === 'en' ? 'en' : 'ko'
    const staticTexts = getStaticTexts(normalizedLang)
    
    // 정적 UI 텍스트에서 먼저 찾기
    if (staticTexts) {
      const staticTranslation = createTranslationFunction(staticTexts)(key)
      if (staticTranslation !== key) {
        return staticTranslation
      }
    }
    
    // contextT로 동적 컨텐츠 번역 시도
    if (contextT) {
      return contextT(key, fallback)
    }
    
    return fallback || key
  }
  
  // JSON 섹션 데이터에서 다국어 텍스트 가져오기 - 현재 선택된 언어 우선
  const getLocalizedText = (textObj: any, fallback?: string): string => {
    if (!textObj) {
      return fallback || ''
    }
    if (typeof textObj === 'string') {
      return textObj
    }
    
    // 현재 언어 확인
    const currentLang = currentLanguage || initialLanguage || 'ko'
    const normalizedLang: LanguageCode = 
      (currentLang as string) === 'ja' ? 'jp' : 
      (currentLang as string) === 'jp' ? 'jp' :
      (currentLang as string) === 'en' ? 'en' : 'ko'
    
    // 현재 선택된 언어로 먼저 시도
    if (textObj[normalizedLang]) {
      return textObj[normalizedLang]
    }
    
    // 없으면 한국어 → 영어 → 일본어 순으로 폴백
    return textObj.ko || textObj.en || textObj.jp || fallback || ''
  }
  
  // JSON-first: 모든 데이터가 이미 준비됨, UI Config Store 불필요

  
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
    'Shield': Shield,
    'Tag': Tag,
    'ShoppingCart': ShoppingCart,
    'AlertTriangle': AlertTriangle,
    'Smartphone': Smartphone,
    'BookOpen': BookOpen,
    'ThumbsUp': ThumbsUp,
    'Users': Users,
    'Flower2': Flower2,
    'GraduationCap': GraduationCap,
    'Trophy': Trophy,
    'PlusCircle': PlusCircle,
    'BarChart3': BarChart3,
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
        return <img src={category.icon} alt={getLocalizedText(category.name)} className={`${sizeClasses} object-contain`} />
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

  // JSON-first: 캠페인 로딩 관련 상태 제거 (필요시 별도 구현)
  // const [campaigns, setCampaigns] = useState<Campaign[]>([])
  // const [cursor, setCursor] = useState<string | null>(null)
  // const [hasMore, setHasMore] = useState(true)

  // Sections are now preloaded with language data - no need for loadSections function

  useEffect(() => {
    // 로그인 상태 확인
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    
    // 업체 사용자는 비즈니스 대시보드로 리다이렉트
    if (currentUser && currentUser.type === 'BUSINESS') {
      router.push('/business/dashboard')
    }
  }, [router])

  // 히어로 슬라이드 자동 전환
  useEffect(() => {
    const heroSection = sections.find(s => s.type === 'hero')
    if (heroSection?.data?.slides && heroSection.data.slides.length > 1) {
      const slides = heroSection.data.slides
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

  // JSON-first: 섹션 데이터가 이미 언어별로 번역되어 제공됨

  return (
    <>
      <CriticalCSS />
      <Header />
      <div className="min-h-screen bg-white main-content">

      <main className="container mx-auto px-6 py-8">
        
        {/* JSON-first 섹션 렌더링 (이미 언어별로 번역된 데이터) */}
        {sections.length > 0 ? (
          sections.map((section) => {
            
            switch (section.type) {
              case 'hero':
                return section.data?.slides ? (
                  <div key={section.id} className="relative mb-8 hero-section">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-500 ease-out hero-slide"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {section.data.slides?.map((slide: any, slideIndex: number) => (
                          <div key={slide.id} className="min-w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 현재 슬라이드 */}
                              <div className="w-full">
                                {slide.link ? (
                                  <Link href={slide.link} className="block group">
                                    <div className="relative">
                                      <div
                                        className={`w-full h-64 md:h-80 text-white relative rounded-2xl overflow-hidden ${slide.bgColor || 'bg-gradient-to-r from-purple-600 to-blue-600'}`}
                                      >
                                        {slide.backgroundImage && (
                                          <Image
                                            src={slide.backgroundImage}
                                            alt={getLocalizedText(slide.title) || ''}
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
                                                {getLocalizedText(slide.tag)}
                                              </span>
                                            )}
                                            <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">
                                              {getLocalizedText(slide.title)}
                                            </h1>
                                            <p className="text-lg md:text-xl opacity-90">
                                              {getLocalizedText(slide.subtitle)}
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
                                      className={`w-full h-64 md:h-80 text-white relative rounded-2xl overflow-hidden ${slide.bgColor || 'bg-gradient-to-r from-purple-600 to-blue-600'}`}
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
                                              {getLocalizedText(slide.tag)}
                                            </span>
                                          )}
                                          <h1 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">
                                            {getLocalizedText(slide.title)}
                                          </h1>
                                          <p className="text-lg md:text-xl opacity-90">
                                            {getLocalizedText(slide.subtitle)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 다음 슬라이드 미리보기 */}
                              {section.data.slides && section.data.slides.length > 1 && (
                                <div className="hidden lg:block w-full">
                                  {(() => {
                                    const slides = section.data.slides
                                    const nextIndex = (slideIndex + 1) % slides.length
                                    const nextSlide = slides[nextIndex]
                                    
                                    return (
                                      <div className="h-full">
                                        <div
                                          className={`w-full h-64 md:h-80 text-white relative rounded-2xl overflow-hidden opacity-50 ${nextSlide.bgColor || 'bg-gradient-to-r from-green-400 to-blue-400'}`}
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
                                                {getLocalizedText(nextSlide.title)}
                                              </h2>
                                              <p className="text-base md:text-lg opacity-90">
                                                {getLocalizedText(nextSlide.subtitle)}
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
                    {section.data.slides?.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {section.data.slides?.map((_: any, index: number) => (
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
                return section.data?.links ? (
                  <div key={section.id} className="mb-12">
                    {/* 데스크톱: 3단 그리드 */}
                    <div className="hidden md:grid md:grid-cols-3 gap-4">
                      {section.data.links?.map((link: any) => (
                        <Link 
                          key={link.id}
                          href={link.link || link.url || '#'} 
                          className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors group"
                        >
                          {link.icon && (
                            link.icon.startsWith('http') ? (
                              <Image 
                                src={link.icon} 
                                alt={getLocalizedText(link.title)} 
                                width={32}
                                height={32}
                                className="object-contain"
                                loading="lazy"
                              />
                            ) : (
                              // 이모지 우선 사용 (관리자 설정 그대로)
                              <span className="text-2xl">{link.icon}</span>
                            )
                          )}
                          <span className="font-medium text-gray-800 group-hover:text-blue-600">
                            {getLocalizedText(link.title)}
                          </span>
                        </Link>
                      ))}
                    </div>
                    
                    {/* 모바일: 1개씩 슬라이드 */}
                    <div className="md:hidden">
                      <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 px-4">
                        {section.data.links?.map((link: any) => (
                          <Link 
                            key={link.id}
                            href={link.link || link.url || '#'} 
                            className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors group w-[calc(100vw-2rem)] max-w-[320px] flex-shrink-0"
                          >
                            {link.icon && (
                              link.icon.startsWith('http') ? (
                                <Image 
                                  src={link.icon} 
                                  alt={getLocalizedText(link.title)} 
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                // 이모지 우선 사용 (관리자 설정 그대로)
                                <span className="text-2xl">{link.icon}</span>
                              )
                            )}
                            <span className="font-medium text-gray-800 group-hover:text-blue-600">
                              {getLocalizedText(link.title)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null

              case 'promo':
                const promoData = section.data?.banner || section.data
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
                                {getLocalizedText((promoData as any).title)}
                              </h3>
                              <p style={{ 
                                color: (promoData as any).backgroundImage ? '#FFFFFF' : (promoData as any).textColor || '#000000',
                                opacity: (promoData as any).backgroundImage ? 0.9 : 0.8
                              }}>
                                {getLocalizedText((promoData as any).subtitle)}
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
                              {getLocalizedText(promoData.title)}
                            </h3>
                            <p style={{ 
                              color: promoData.backgroundImage ? '#FFFFFF' : promoData.textColor || '#000000',
                              opacity: promoData.backgroundImage ? 0.9 : 0.8
                            }}>
                              {getLocalizedText(promoData.subtitle)}
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
                return section.data?.categories ? (
                  <div key={section.id} className="mb-12">
                    {/* 데스크톱: 가로 스크롤, 모바일: 그리드 */}
                    <div className="px-4">
                      {/* 모바일: 그리드 레이아웃 */}
                      <div className="grid grid-cols-4 gap-3 sm:hidden">
                        {(section.data.categories as any[]).map((category: any) => (
                          <Link
                            key={category.id}
                            href={category.link || category.url || `/category/${category.slug || category.categoryId || 'all'}`}
                            className="flex flex-col items-center gap-1.5 group"
                          >
                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors relative">
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
                                  {getLocalizedText(category.badge)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-700 text-center leading-tight">
                              {getLocalizedText(category.name)}
                            </span>
                          </Link>
                        ))}
                      </div>

                      {/* 태블릿/데스크톱: 가로 스크롤 */}
                      <div className="hidden sm:block overflow-x-auto">
                        <div className="flex gap-3 lg:gap-2 pb-4 justify-center pt-4 pb-2 min-w-max">
                          {(section.data.categories as any[]).map((category: any) => (
                            <Link
                              key={category.id}
                              href={category.link || category.url || `/category/${category.slug || category.categoryId || 'all'}`}
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
                                    {getLocalizedText(category.badge)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-700 text-center">
                                {getLocalizedText(category.name)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null

              case 'ranking':
                return section.data ? (
                  <RankingSection key={section.id} data={section.data} />
                ) : null

              case 'recommended':
                return (
                  <div key={section.id} className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">{getLocalizedText(section.data?.title)}</h2>
                    <div className="text-center py-8 text-gray-500">
                      추천 섹션 (임시)
                    </div>
                  </div>
                )
              case 'activeCampaigns':
              case 'campaigns':
              case 'active-campaigns':
                return section.data ? (
                  <ActiveCampaignsSection key={section.id} data={section.data} />
                ) : null
              

              default:
                return null
            }
          })
        ) : (
          // 폴백 UI - JSON 데이터가 없을 때
          loading ? (
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