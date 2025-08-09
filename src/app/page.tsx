'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useLanguage } from '@/hooks/useLanguage'

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

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  // 언어팩 사용
  const { t } = useLanguage()
  
  // UI 설정 가져오기
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  
  // 배너 슬라이드 데이터 - UI 설정에서 가져오기
  const bannerSlides = config.mainPage?.heroSlides?.filter(slide => slide.visible) || []
  
  // 메뉴 카테고리 - UI 설정에서 가져오기
  const menuCategories = config.mainPage?.categoryMenus?.filter(menu => menu.visible) || []
  
  // 섹션 순서 가져오기
  const sectionOrder = config.mainPage?.sectionOrder || [
    { id: 'hero', type: 'hero', order: 1, visible: true },
    { id: 'category', type: 'category', order: 2, visible: true },
    { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
    { id: 'promo', type: 'promo', order: 4, visible: true },
    { id: 'ranking', type: 'ranking', order: 5, visible: true },
    { id: 'recommended', type: 'recommended', order: 6, visible: true },
  ]
  
  // 커스텀 섹션들도 순서에 추가
  const customSectionOrders = (config.mainPage?.customSections || [])
    .filter(section => section.visible)
    .map((section) => ({
      id: section.id,
      type: 'custom' as const,
      order: section.order || 999,
      visible: section.visible,
    }))
  
  // 모든 섹션 합치고 정렬
  const allSections = [...sectionOrder]
  customSectionOrders.forEach(customOrder => {
    const existingIndex = allSections.findIndex(s => s.id === customOrder.id)
    if (existingIndex > -1) {
      allSections[existingIndex] = customOrder
    } else {
      allSections.push(customOrder)
    }
  })
  
  // 표시할 섹션만 필터링하고 순서대로 정렬
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    pet: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </svg>
    ),
    parenting: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    game: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
    education: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  }

  // 캠페인 데이터 로드
  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/home/campaigns?limit=10')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // UI 설정 로드
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


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/campaigns?search=${encodeURIComponent(searchTerm)}`)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">

      <main className="w-full max-w-[1920px] mx-auto px-6 py-8">
        {/* 섹션들을 순서대로 렌더링 */}
        {visibleSections.map((section) => {
          switch (section.type) {
            case 'hero':
              // 메인 배너 슬라이드 (모바일: 1개씩, 데스크톱: 2개씩)
              return bannerSlides.length > 0 ? (
                <div key={section.id} className="relative mb-8">
                  <div className="overflow-hidden">
                    <div 
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {bannerSlides.map((slide, slideIndex) => (
                        <div key={slide.id} className="min-w-full">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 현재 슬라이드 */}
                            <div className="w-full">
                              {slide.link && slide.backgroundImage ? (
                                <Link href={slide.link} className="block group">
                                  <div className="relative">
                                    <div
                                      className={`w-full h-64 md:h-80 ${slide.bgColor} text-white relative rounded-2xl overflow-hidden`}
                                      style={{
                                        backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                      }}
                                    >
                                      <div className={`p-6 md:p-8 h-full flex flex-col justify-center ${slide.backgroundImage ? 'bg-black/30' : ''}`}>
                                        <div>
                                          {slide.tag && (
                                            <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-2">
                                              {t(slide.tag, slide.tag)}
                                            </span>
                                          )}
                                          <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-pre-line">
                                            {t(slide.title, slide.title)}
                                          </h2>
                                          <p className="text-base opacity-90">{t(slide.subtitle, slide.subtitle)}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-2xl" />
                                  </div>
                                </Link>
                              ) : (
                                <div
                                  className={`w-full h-64 md:h-80 ${slide.bgColor} text-white relative rounded-2xl overflow-hidden`}
                                  style={{
                                    backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                >
                                  <div className={`p-6 md:p-8 h-full flex flex-col justify-center ${slide.backgroundImage ? 'bg-black/30' : ''}`}>
                                    <div>
                                      {slide.tag && (
                                        <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-2">
                                          {t(slide.tag, slide.tag)}
                                        </span>
                                      )}
                                      <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-pre-line">
                                        {t(slide.title, slide.title)}
                                      </h2>
                                      <p className="text-base opacity-90">{t(slide.subtitle, slide.subtitle)}</p>
                                      {slide.link && !slide.backgroundImage && (
                                        <Link 
                                          href={slide.link}
                                          className="inline-block mt-4 bg-white/20 backdrop-blur border border-white/30 px-4 py-2 rounded-full hover:bg-white/30 transition text-sm"
                                        >
                                          {t('home.banner.view_more', '자세히 보기')} {t('common.arrow_right', '→')}
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 데스크톱에서만 표시되는 두 번째 슬라이드 */}
                            {slideIndex + 1 < bannerSlides.length && (
                              <div className="w-full hidden lg:block">
                                {bannerSlides[slideIndex + 1].link && bannerSlides[slideIndex + 1].backgroundImage ? (
                                  <Link href={bannerSlides[slideIndex + 1].link} className="block group">
                                    <div className="relative">
                                      <div
                                        className={`w-full h-64 md:h-80 ${bannerSlides[slideIndex + 1].bgColor} text-white relative rounded-2xl overflow-hidden`}
                                        style={{
                                          backgroundImage: bannerSlides[slideIndex + 1].backgroundImage ? `url(${bannerSlides[slideIndex + 1].backgroundImage})` : undefined,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center'
                                        }}
                                      >
                                        <div className={`p-6 md:p-8 h-full flex flex-col justify-center ${bannerSlides[slideIndex + 1].backgroundImage ? 'bg-black/30' : ''}`}>
                                          <div>
                                            {bannerSlides[slideIndex + 1].tag && (
                                              <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-2">
                                                {t(bannerSlides[slideIndex + 1].tag, bannerSlides[slideIndex + 1].tag)}
                                              </span>
                                            )}
                                            <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-pre-line">
                                              {t(bannerSlides[slideIndex + 1].title, bannerSlides[slideIndex + 1].title)}
                                            </h2>
                                            <p className="text-base opacity-90">{t(bannerSlides[slideIndex + 1].subtitle, bannerSlides[slideIndex + 1].subtitle)}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-2xl" />
                                    </div>
                                  </Link>
                                ) : (
                                  <div
                                    className={`w-full h-64 md:h-80 ${bannerSlides[slideIndex + 1].bgColor} text-white relative rounded-2xl overflow-hidden`}
                                    style={{
                                      backgroundImage: bannerSlides[slideIndex + 1].backgroundImage ? `url(${bannerSlides[slideIndex + 1].backgroundImage})` : undefined,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  >
                                    <div className={`p-6 md:p-8 h-full flex flex-col justify-center ${bannerSlides[slideIndex + 1].backgroundImage ? 'bg-black/30' : ''}`}>
                                      <div>
                                        {bannerSlides[slideIndex + 1].tag && (
                                          <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-2">
                                            {t(bannerSlides[slideIndex + 1].tag, bannerSlides[slideIndex + 1].tag)}
                                          </span>
                                        )}
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2 whitespace-pre-line">
                                          {t(bannerSlides[slideIndex + 1].title, bannerSlides[slideIndex + 1].title)}
                                        </h2>
                                        <p className="text-base opacity-90">{t(bannerSlides[slideIndex + 1].subtitle, bannerSlides[slideIndex + 1].subtitle)}</p>
                                        {bannerSlides[slideIndex + 1].link && !bannerSlides[slideIndex + 1].backgroundImage && (
                                          <Link 
                                            href={bannerSlides[slideIndex + 1].link}
                                            className="inline-block mt-4 bg-white/20 backdrop-blur border border-white/30 px-4 py-2 rounded-full hover:bg-white/30 transition text-sm"
                                          >
                                            {t('home.banner.view_more', '자세히 보기')} {t('common.arrow_right', '→')}
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 슬라이드 컨트롤 */}
                  {bannerSlides.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {bannerSlides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentSlide ? 'bg-gray-800 w-8' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
              
            case 'category':
              // 카테고리 메뉴 그리드
              return (
                <div key={section.id} className="mb-8">
                  <div className="flex justify-center">
                    <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
                      {menuCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/campaigns?category=${category.categoryId}`}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-gray-200 transition relative">
                          {category.icon && (category.icon.startsWith('data:') || category.icon.startsWith('http')) ? (
                            <img src={category.icon} alt={category.name} className="w-8 h-8 object-contain" />
                          ) : (
                            defaultCategoryIcons[category.categoryId] || (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            )
                          )}
                          {category.badge && (
                            <span className={`absolute -top-1 -right-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              category.badge === 'HOT' ? 'bg-red-500 text-white' : 
                              category.badge === '신규' ? 'bg-blue-500 text-white' : 
                              'bg-gray-500 text-white'
                            }`}>
                              {t(category.badge, category.badge)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-700">{t(category.name, category.name)}</span>
                      </Link>
                    ))}
                    </div>
                  </div>
                </div>
              );
              
            case 'quicklinks':
              // 바로가기 링크
              return config.mainPage?.quickLinks && config.mainPage.quickLinks.filter(link => link.visible).length > 0 ? (
                <div key={section.id} className="grid grid-cols-3 gap-4 mb-8">
                  {config.mainPage.quickLinks.filter(link => link.visible).map((link) => (
                    <Link 
                      key={link.id}
                      href={link.link} 
                      className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3 hover:bg-gray-200 transition"
                    >
                      {link.icon && (
                        link.icon.startsWith('data:') || link.icon.startsWith('http') ? (
                          <img src={link.icon} alt={link.title} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-2xl">{link.icon}</span>
                        )
                      )}
                      <span className="font-medium">{t(link.title, link.title)}</span>
                    </Link>
                  ))}
                </div>
              ) : null;
              
            case 'promo':
              // 프로모션 배너
              return config.mainPage?.promoBanner?.visible ? (
                config.mainPage.promoBanner.link ? (
                  <Link key={section.id} href={config.mainPage.promoBanner.link} className="block mb-8">
                    <div 
                      className="rounded-2xl p-6 relative overflow-hidden hover:shadow-lg transition group"
                      style={{
                        backgroundImage: config.mainPage.promoBanner.backgroundImage 
                          ? `url(${config.mainPage.promoBanner.backgroundImage})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: !config.mainPage.promoBanner.backgroundImage 
                          ? '#FEF3C7' 
                          : undefined
                      }}
                    >
                      <div className={`flex items-center justify-between ${
                        config.mainPage.promoBanner.backgroundImage ? 'relative z-10' : ''
                      }`}>
                        {config.mainPage.promoBanner.backgroundImage && (
                          <div className="absolute inset-0 bg-black/20 -z-10" />
                        )}
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${
                            config.mainPage.promoBanner.backgroundImage ? 'text-white' : 'text-gray-900'
                          }`}>
                            {t(config.mainPage.promoBanner.title, config.mainPage.promoBanner.title)}
                          </h3>
                          <p className={config.mainPage.promoBanner.backgroundImage ? 'text-white/90' : 'text-gray-700'}>
                            {t(config.mainPage.promoBanner.subtitle, config.mainPage.promoBanner.subtitle)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {config.mainPage.promoBanner.icon && (
                            <span className="text-5xl">{config.mainPage.promoBanner.icon}</span>
                          )}
                          <svg className="w-6 h-6 opacity-50 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    key={section.id}
                    className="rounded-2xl p-6 mb-8 relative overflow-hidden"
                    style={{
                      backgroundImage: config.mainPage.promoBanner.backgroundImage 
                        ? `url(${config.mainPage.promoBanner.backgroundImage})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: !config.mainPage.promoBanner.backgroundImage 
                        ? '#FEF3C7' 
                        : undefined
                    }}
                  >
                    <div className={`flex items-center justify-between ${
                      config.mainPage.promoBanner.backgroundImage ? 'relative z-10' : ''
                    }`}>
                      {config.mainPage.promoBanner.backgroundImage && (
                        <div className="absolute inset-0 bg-black/20 -z-10" />
                      )}
                      <div>
                        <h3 className={`text-xl font-bold mb-1 ${
                          config.mainPage.promoBanner.backgroundImage ? 'text-white' : 'text-gray-900'
                        }`}>
                          {config.mainPage.promoBanner.title}
                        </h3>
                        <p className={config.mainPage.promoBanner.backgroundImage ? 'text-white/90' : 'text-gray-700'}>
                          {config.mainPage.promoBanner.subtitle}
                        </p>
                      </div>
                      {config.mainPage.promoBanner.icon && (
                        <span className="text-5xl">{config.mainPage.promoBanner.icon}</span>
                      )}
                    </div>
                  </div>
                )
              ) : null;
              
            case 'ranking':
              // 랭킹 섹션
              return config.mainPage?.rankingSection?.visible ? (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{t(config.mainPage.rankingSection.title, config.mainPage.rankingSection.title)}</h2>
                      {config.mainPage.rankingSection.subtitle && (
                        <p className="text-gray-600 mt-1">{t(config.mainPage.rankingSection.subtitle, config.mainPage.rankingSection.subtitle)}</p>
                      )}
                    </div>
                    <Link href="/campaigns" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {t('home.ranking.view_all', '전체보기')} {t('common.arrow_right', '→')}
                    </Link>
                  </div>
                  
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[...Array(config.mainPage.rankingSection.count || 5)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {campaigns
                        .sort((a, b) => {
                          // 랭킹 기준에 따른 정렬
                          switch (config.mainPage.rankingSection.criteria) {
                            case 'deadline':
                              return a.deadline - b.deadline; // 마감일 가까운 순
                            case 'reward':
                              return parseInt(b.budget) - parseInt(a.budget); // 리워드 높은 순
                            case 'participants':
                              return b.applicants - a.applicants; // 참여자 많은 순
                            case 'popular':
                            default:
                              // 인기순 (현재는 참여자 기준으로 대체)
                              return b.applicants - a.applicants;
                          }
                        })
                        .slice(0, config.mainPage.rankingSection.count || 5)
                        .map((campaign, index) => (
                          <Link
                            key={campaign.id}
                            href={`/campaigns/${campaign.id}`}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group relative"
                          >
                            {/* 순위 뱃지 */}
                            {config.mainPage.rankingSection.showBadge && index < 3 && (
                              <div className={`absolute top-2 left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                                'bg-gradient-to-br from-orange-400 to-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                            )}
                            
                            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                              {campaign.imageUrl ? (
                                <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-4xl opacity-50">🏆</span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                {campaign.category}
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-600">{campaign.brand}</span>
                                {campaign.platforms?.includes('instagram') && <span className="text-xs">📷</span>}
                                {campaign.platforms?.includes('youtube') && <span className="text-xs">📹</span>}
                              </div>
                              <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
                                {campaign.title}
                              </h3>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>{t('home.ranking.days_left', 'D-{days}').replace('{days}', campaign.deadline.toString())}</span>
                                <span className="font-medium text-indigo-600">{campaign.budget}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{t('home.ranking.applicants', '신청 {current}/{max}').replace('{current}', campaign.applicants.toString()).replace('{max}', campaign.maxApplicants.toString())}</span>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                                        i < Math.floor((campaign.applicants / campaign.maxApplicants) * 5)
                                          ? 'bg-indigo-600'
                                          : 'bg-gray-200'
                                      }`} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      }
                    </div>
                  )}
                </section>
              ) : null;
              
            case 'recommended':
              // 추천 캠페인
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{t('home.recommended.title', '추천 캠페인')}</h2>
                    <Link href="/campaigns" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {t('home.recommended.view_all', '전체보기')} {t('common.arrow_right', '→')}
                    </Link>
                  </div>
                  
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {campaigns.slice(0, 10).map((campaign) => (
                        <Link
                          key={campaign.id}
                          href={`/campaigns/${campaign.id}`}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group"
                        >
                          <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                            {campaign.imageUrl ? (
                              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl opacity-50">📸</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                                {campaign.category}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
{t('home.recommended.days_remaining', '{days}일 남음').replace('{days}', campaign.deadline.toString())}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
                              {campaign.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">{campaign.brand}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">
{t('home.recommended.applicants_count', '지원 {current}/{max}명').replace('{current}', campaign.applicants.toString()).replace('{max}', campaign.maxApplicants.toString())}
                              </span>
                              <span className="font-medium text-indigo-600">
                                {campaign.budget}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              );
              
            case 'custom':
              // 커스텀 섹션
              const customSection = config.mainPage?.customSections?.find(cs => cs.id === section.id);
              if (!customSection || !customSection.visible) return null;
              
              return (
                <section key={section.id} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{customSection.title}</h2>
                      {customSection.subtitle && (
                        <p className="text-gray-600 mt-1">{customSection.subtitle}</p>
                      )}
                    </div>
                    {customSection.showMoreButton && (
                      <Link href={customSection.moreButtonLink || '/campaigns'} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        {customSection.moreButtonText || t('home.custom.more_button_default', '더보기')} {t('common.arrow_right', '→')}
                      </Link>
                    )}
                  </div>
                  
                  {loading ? (
                    <div 
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid"
                      style={{ 
                        ['--lg-columns' as any]: customSection.columns || 5
                      }}
                    >
                      {[...Array(customSection.columns * customSection.rows)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div 
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                        customSection.columns === 3 ? 'lg:grid-cols-3' :
                        customSection.columns === 4 ? 'lg:grid-cols-4' :
                        customSection.columns === 5 ? 'lg:grid-cols-5' :
                        customSection.columns === 6 ? 'lg:grid-cols-6' :
                        'lg:grid-cols-5'
                      }`}
                    >
                      {(() => {
                        // 필터링된 캠페인 가져오기
                        let filteredCampaigns = [...campaigns];
                        
                        if (customSection.type === 'auto' && customSection.filter) {
                          // 카테고리 필터링
                          if (customSection.filter.category) {
                            filteredCampaigns = filteredCampaigns.filter(c => 
                              c.category === customSection.filter!.category
                            );
                          }
                          
                          // 플랫폼 필터링
                          if (customSection.filter.platform) {
                            filteredCampaigns = filteredCampaigns.filter(c => 
                              c.platforms?.includes(customSection.filter!.platform!)
                            );
                          }
                          
                          // 정렬
                          switch (customSection.filter.sortBy) {
                            case 'latest':
                              filteredCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                              break;
                            case 'popular':
                              filteredCampaigns.sort((a, b) => b.applicants - a.applicants);
                              break;
                            case 'deadline':
                              filteredCampaigns.sort((a, b) => a.deadline - b.deadline);
                              break;
                            case 'budget':
                              filteredCampaigns.sort((a, b) => parseInt(b.budget) - parseInt(a.budget));
                              break;
                          }
                        }
                        
                        // 표시할 개수만큼 자르기
                        const displayCount = customSection.columns * customSection.rows;
                        return filteredCampaigns.slice(0, displayCount).map((campaign) => (
                          <Link
                            key={campaign.id}
                            href={`/campaigns/${campaign.id}`}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group"
                          >
                            <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                              {campaign.imageUrl ? (
                                <img 
                                  src={campaign.imageUrl} 
                                  alt={campaign.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <svg className="w-16 h-16 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs">
                                  {campaign.category}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
                                {campaign.title}
                              </h3>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>{campaign.budget}</span>
                                <span>{t('home.recommended.days_remaining', '{days}일 남음').replace('{days}', campaign.deadline.toString())}</span>
                              </div>
                            </div>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}
                </section>
              );
              
            default:
              return null;
          }
        })}

        {/* 하단 CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">{t('home.bottom_cta.title', '지금 바로 시작하세요')}</h3>
          <p className="text-white/80 mb-6">{t('home.bottom_cta.subtitle', '5분이면 충분합니다. 복잡한 절차 없이 바로 시작할 수 있어요.')}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register?type=business"
              className="bg-white text-indigo-600 px-6 py-3 rounded-full font-medium hover:shadow-lg transition"
            >
              {t('home.bottom_cta.brand_button', '브랜드로 시작하기')}
            </Link>
            <Link
              href="/register?type=influencer"
              className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition"
            >
              {t('home.bottom_cta.influencer_button', '인플루언서로 시작하기')}
            </Link>
          </div>
        </div>
      </main>
    </div>
    <Footer />
    </>
  )
}
