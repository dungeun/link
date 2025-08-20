'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { logger } from '@/lib/logger'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import CampaignCard from '@/components/CampaignCard'

// 🚀 최적화: JSON 기반 정적 UI 텍스트 시스템
import { StaticUITexts, createTranslationFunction } from '@/lib/cache/json-loader'

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
import { 
  UISection, 
  LanguageCode,
  HeroSlide,
  QuickLink
} from '@/types/global'

interface Campaign {
  id: string
  title: string
  brand?: string
  applicants?: number
  maxApplicants?: number
  deadline?: any
  category?: string
  platforms?: string[]
  description?: string
  createdAt?: string
  budget?: any
  imageUrl?: string
  thumbnailUrl?: string
  reward?: number
  business?: {
    name?: string
    companyName?: string
  }
  stats?: {
    applications?: number
  }
}

interface OptimizedHomePageProps {
  initialSections: UISection[]
  initialLanguage?: LanguageCode
  initialCampaigns?: Campaign[]
  initialCategoryStats?: Record<string, number>
  preloadMetadata?: {
    totalCampaigns: number
    loadTime: number
    cached: boolean
    timestamp?: string
  }
}

function OptimizedHomePage({ 
  initialSections, 
  initialLanguage = 'ko', 
  initialCampaigns = [],
  initialCategoryStats = {},
  preloadMetadata
}: OptimizedHomePageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // 🚀 최적화: 언어 상태만 관리 (언어팩은 정적 import)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(initialLanguage)
  
  // 캠페인 데이터 상태 관리
  const [campaigns] = useState<Campaign[]>(() => initialCampaigns)
  const [loading] = useState(false) // 프리로드되었으므로 항상 false
  const [sections] = useState<UISection[]>(() => initialSections || [])
  
  // 🚀 최적화: JSON 기반 정적 번역 함수 (API 호출 없음, 0ms)
  const t = useCallback((key: string, fallback?: string): string => {
    // TODO: JSON 기반 번역 시스템 연동
    return fallback || key
  }, [currentLanguage])
  
  // 🚀 최적화: 언어 전환 (정적 파일이므로 즉시 반영)
  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    setCurrentLanguage(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
    // API 호출 없이 즉시 언어 변경!
  }, [])
  
  // UI 설정 가져오기
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
  // UI 섹션에서 hero 데이터 추출
  const heroSection = sections.find(s => s.type === 'hero')
  const categorySection = sections.find(s => s.type === 'category')
  
  // Hero 슬라이드 데이터
  const bannerSlides = useMemo(() => {
    if (heroSection?.content?.slides && Array.isArray(heroSection.content.slides)) {
      return heroSection.content.slides.filter(slide => slide && typeof slide === 'object' && (slide as any).visible !== false)
    }
    return config.mainPage?.heroSlides?.filter(slide => slide.visible) || []
  }, [heroSection, config.mainPage?.heroSlides])
  
  // 카테고리 메뉴 데이터  
  const menuCategories = useMemo(() => {
    if (categorySection?.content?.categories && Array.isArray(categorySection.content.categories)) {
      return categorySection.content.categories.filter(cat => cat && typeof cat === 'object' && (cat as any).visible !== false)
    }
    return config.mainPage?.categoryMenus?.filter(menu => menu.visible) || []
  }, [categorySection, config.mainPage?.categoryMenus])

  // 성능 모니터링 표시
  const [performanceMetrics, setPerformanceMetrics] = useState({
    pageLoad: 0,
    cacheHit: false,
    languageSwitch: 0
  })

  useEffect(() => {
    // 페이지 로드 시간 측정
    if (preloadMetadata) {
      setPerformanceMetrics(prev => ({
        ...prev,
        pageLoad: preloadMetadata.loadTime,
        cacheHit: preloadMetadata.cached
      }))
    }
  }, [preloadMetadata])

  // 언어 전환 시간 측정
  const measureLanguageSwitch = useCallback((lang: LanguageCode) => {
    const start = performance.now()
    handleLanguageChange(lang)
    const end = performance.now()
    setPerformanceMetrics(prev => ({
      ...prev,
      languageSwitch: end - start
    }))
  }, [handleLanguageChange])

  // 사용자 정보 로드 (현재 비활성화 - AuthService deprecated)
  useEffect(() => {
    // AuthService가 deprecated되어 null만 반환함
    // 실제 인증이 필요하면 useAuth 훅 사용
    setUser(null)
  }, [])

  // 배너 자동 슬라이드
  useEffect(() => {
    if (bannerSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [bannerSlides.length])

  // UI 설정 로드 (한 번만)
  useEffect(() => {
    loadSettingsFromAPI()
  }, [])

  // 카테고리 아이콘 매핑
  const categoryIcons: Record<string, any> = {
    '뷰티': Sparkles,
    '패션': Shirt,
    '음식': UtensilsCrossed,
    '여행': Plane,
    'IT': Laptop,
    '운동': Dumbbell,
    '생활': Home,
    '건강': Heart,
    '육아': Baby,
    '게임': Gamepad2,
    '교육': GraduationCap
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CriticalCSS />
      
      {/* 헤더 */}
      <Header />
      
      {/* 🚀 성능 모니터링 배너 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 text-sm">
          <div className="container mx-auto flex justify-between items-center">
            <span className="font-bold">🚀 최적화된 버전</span>
            <div className="flex gap-4">
              <span>페이지 로드: {performanceMetrics.pageLoad}ms</span>
              <span>캐시: {performanceMetrics.cacheHit ? '✅ HIT' : '❌ MISS'}</span>
              <span>언어 전환: {performanceMetrics.languageSwitch.toFixed(2)}ms</span>
              <span>캠페인: {campaigns.length}개</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 언어 선택기 (테스트용) */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => measureLanguageSwitch('ko')}
            className={`px-3 py-1 rounded ${currentLanguage === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            한국어
          </button>
          <button
            onClick={() => measureLanguageSwitch('en')}
            className={`px-3 py-1 rounded ${currentLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button
            onClick={() => measureLanguageSwitch('jp')}
            className={`px-3 py-1 rounded ${currentLanguage === 'jp' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            日本語
          </button>
        </div>
      </div>

      {/* Hero 섹션 - 배너 슬라이더 */}
      {bannerSlides.length > 0 ? (
        <section className="relative h-[400px] overflow-hidden">
          {bannerSlides.map((slide, index) => (
            <div
              key={(slide as any)?.id || index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: (slide as any)?.bgColor || 'linear-gradient(to right, #3B82F6, #8B5CF6)'
              }}
            >
              <div className="container mx-auto px-4 h-full flex items-center">
                <div className="text-white max-w-2xl">
                  {(slide as any)?.tag && (
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
                      {(slide as any)?.tag}
                    </span>
                  )}
                  <h1 className="text-4xl font-bold mb-4">
                    {(slide as any)?.title || t('home.hero.title', '브랜드와 인플루언서를 연결하는 플랫폼')}
                  </h1>
                  <p className="text-xl mb-8">
                    {(slide as any)?.subtitle || t('home.hero.subtitle', '최고의 마케팅 캠페인을 경험해보세요')}
                  </p>
                  <Link
                    href={(slide as any)?.link || '/campaigns'}
                    className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    {(slide as any)?.buttonText || t('home.hero.cta', '캠페인 둘러보기')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
          
          {/* 슬라이더 인디케이터 */}
          {bannerSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {bannerSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'w-8 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="relative h-[400px] bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">
                {t('home.hero.title', '브랜드와 인플루언서를 연결하는 플랫폼')}
              </h1>
              <p className="text-xl mb-8">
                {t('home.hero.subtitle', '최고의 마케팅 캠페인을 경험해보세요')}
              </p>
              <Link
                href="/campaigns"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                {t('home.hero.cta', '캠페인 둘러보기')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 카테고리 메뉴 */}
      <section className="py-8 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto pb-2">
            {menuCategories.map((category, index) => {
              const Icon = categoryIcons[(category as any)?.name] || Home
              return (
                <Link
                  key={index}
                  href={`/categories/${(category as any)?.slug || (category as any)?.name}`}
                  className="flex flex-col items-center min-w-[80px] group"
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition">
                    <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-blue-600">
                    {(category as any)?.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* 캠페인 섹션 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">
            {t('home.campaigns.title', '진행중인 캠페인')}
          </h2>
          
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  {campaign.imageUrl || campaign.thumbnailUrl ? (
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={campaign.imageUrl || campaign.thumbnailUrl || ''}
                        alt={campaign.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-400" />
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{campaign.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {campaign.brand || campaign.business?.name || campaign.business?.companyName}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-600 font-semibold">
                        {campaign.reward ? `${campaign.reward.toLocaleString()}원` : campaign.budget}
                      </span>
                      <span className="text-gray-500">
                        {campaign.applicants || campaign.stats?.applications || 0} / {campaign.maxApplicants || 0}
                      </span>
                    </div>
                    
                    {campaign.category && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {campaign.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {t('home.campaigns.empty', '현재 진행중인 캠페인이 없습니다')}
            </div>
          )}
        </div>
      </section>

      {/* 카테고리별 통계 */}
      {Object.keys(initialCategoryStats).length > 0 && (
        <section className="py-8 bg-gray-100">
          <div className="container mx-auto px-4">
            <h3 className="text-lg font-semibold mb-4">
              {t('home.stats.title', '카테고리별 캠페인')}
            </h3>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(initialCategoryStats).map(([category, count]) => (
                <div key={category} className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">{category}</span>
                  <span className="ml-2 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <Footer />
    </div>
  )
}

export default memo(OptimizedHomePage)