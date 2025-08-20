'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown, User as UserIcon, LogOut, Settings, Menu, X } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { useLanguage } from '@/hooks/useLanguage'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import Image from 'next/image'
import { logger } from '@/lib/utils/structured-logger'
import { HeaderMenuItem } from '@/lib/cache/header-manager'

interface HeaderProps {
  variant?: 'default' | 'transparent'
}

function Header({ variant = 'default' }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [headerMenus, setHeaderMenus] = useState<HeaderMenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [headerLogo, setHeaderLogo] = useState<string>('LinkPick')
  const { user, isAuthenticated, logout } = useAuth()
  const { t, currentLanguage } = useLanguage()
  const { settings: siteSettings } = useSiteSettings()
  
  const isTransparent = useMemo(() => variant === 'transparent', [variant])
  
  // 사용자 타입 확인 - 메모이제이션 적용
  const userType = useMemo(() => user?.type?.toUpperCase(), [user?.type])
  const isInfluencer = useMemo(() => !user || userType === 'INFLUENCER' || userType === 'USER', [user, userType])
  const isBusiness = useMemo(() => userType === 'BUSINESS', [userType])
  const isAdmin = useMemo(() => userType === 'ADMIN', [userType])

  // Scroll 이벤트 처리
  useEffect(() => {
    if (!isTransparent) return;
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isTransparent])
  
  // 프로필 이미지 로드
  useEffect(() => {
    if (!user) return;
    
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setProfileImage(profile.avatar || null)
      } catch (e) {
        logger.error('Failed to parse profile', e as Error, { module: 'Header' })
      }
    }
  }, [user])
  
  // JSON에서 헤더 메뉴 로드 (즉시 한국어로 로드됨)
  useEffect(() => {
    const loadHeaderMenus = async () => {
      try {
        setMenuLoading(true)
        logger.debug('Loading header menus from JSON', { 
          module: 'Header', 
          metadata: { language: currentLanguage } 
        });
        
        const response = await fetch('/cache/header.json')
        if (response.ok) {
          const headerData = await response.json()
          if (headerData?.header?.menus) {
            setHeaderMenus(headerData.header.menus)
            logger.info('Header menus loaded from JSON successfully')
          }
          if (headerData?.header?.logo?.text) {
            setHeaderLogo(headerData.header.logo.text)
            logger.info('Header logo loaded from JSON successfully')
          }
        } else {
          logger.error('Failed to load header JSON', new Error(`HTTP ${response.status}`), { module: 'Header' });
        }
      } catch (error) {
        logger.error('Failed to load header menus', error as Error, { module: 'Header' })
      } finally {
        setMenuLoading(false)
      }
    }

    loadHeaderMenus()
  }, [])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  // 다국어 텍스트 가져오기 - 현재 선택된 언어 우선
  const getLocalizedText = useCallback((textObj: any, fallback?: string): string => {
    if (!textObj) {
      return fallback || ''
    }
    if (typeof textObj === 'string') {
      return textObj
    }
    
    // 현재 언어 확인
    const currentLang = currentLanguage || 'ko'
    const normalizedLang = currentLang === 'ja' ? 'jp' : currentLang === 'jp' ? 'jp' : currentLang === 'en' ? 'en' : 'ko'
    
    // 현재 선택된 언어로 먼저 시도
    if (textObj[normalizedLang]) {
      return textObj[normalizedLang]
    }
    
    // 없으면 한국어 → 영어 → 일본어 순으로 폴백
    return textObj.ko || textObj.en || textObj.jp || fallback || ''
  }, [currentLanguage])


  // 사용자 타입별 대시보드 링크 - 메모이제이션 적용
  const dashboardLink = useMemo(() => 
    isAdmin ? '/admin' : isBusiness ? '/business/dashboard' : '/dashboard',
    [isAdmin, isBusiness]
  )

  return (
    <header 
      className="text-white sticky top-0 z-50"
      style={{
        background: `linear-gradient(to right, ${siteSettings.website.primaryColor || '#3B82F6'}, ${siteSettings.website.secondaryColor || '#10B981'})`
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 flex-1">
            {/* 모바일 메뉴 버튼 - 개선된 터치 영역 */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-3 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="메뉴 토글"
            >
              {showMobileMenu ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
            
            {/* 로고 - 모바일 반응형 최적화 */}
            <Link href="/" className="flex items-center min-w-0 flex-shrink-0">
              {siteSettings.website.logo && siteSettings.website.logo !== '/logo.svg' ? (
                <div className="relative h-8 sm:h-10 lg:h-12 w-auto">
                  <Image
                    src={siteSettings.website.logo}
                    alt={headerLogo}
                    width={120}
                    height={40}
                    className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-lg sm:text-xl lg:text-3xl font-black text-white truncate">
                  {headerLogo}
                </h1>
              )}
            </Link>
            
            {/* 공통 메뉴 */}
            <nav className="hidden lg:flex items-center gap-6">
              {!menuLoading && headerMenus
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className="hover:opacity-80 transition font-medium text-white"
                  >
                    {getLocalizedText(menu.label, menu.label as any)}
                  </Link>
                ))}
            </nav>
          </div>
          

          {/* 사용자 메뉴와 권한별 메뉴 */}
          <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-end">
            {/* 언어 선택 - 관리자 페이지가 아닐 때만 표시 */}
            {!pathname.startsWith('/admin') && <LanguageSelector />}
            
            {/* 권한별 메뉴 - 데스크톱 */}
            <div className="hidden lg:flex items-center gap-4">
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/admin/users" className="hover:opacity-80 transition font-medium text-white text-sm">
                    {t('menu.user_management', '사용자 관리')}
                  </Link>
                  <Link href="/admin/campaigns" className="hover:opacity-80 transition font-medium text-white text-sm">
                    {t('menu.campaign_management', '캠페인 관리')}
                  </Link>
                </>
              )}
              
              {/* 인플루언서 전용 메뉴 */}
              {isInfluencer && user && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/mypage" className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs">{t('menu.mypage', '마이페이지')}</span>
                  </Link>
                </>
              )}
              
              {/* 업체 전용 메뉴 */}
              {isBusiness && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/business/dashboard" className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-xs">{t('menu.dashboard', '대시보드')}</span>
                  </Link>
                </>
              )}
            </div>
            
            {/* 로그인/로그아웃 버튼 */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  {/* 데스크톱 버튼 */}
                  <div className="hidden sm:flex items-center gap-2">
                    {!isInfluencer && !isBusiness && (
                      <Link 
                        href={dashboardLink} 
                        className="flex flex-col items-center gap-1 hover:opacity-80 transition"
                      >
                        <UserIcon className="w-5 h-5" />
                        <span className="text-xs">{t('menu.my', '마이')}</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                      <LogOut className="w-5 h-5" />
                      <span className="text-xs">{t('menu.logout', '로그아웃')}</span>
                    </button>
                  </div>
                  
                  {/* 모바일 버튼 */}
                  <div className="sm:hidden">
                    <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg transition">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:opacity-80 transition text-sm text-white">
                    {t('menu.login', '로그인')}
                  </Link>
                  <Link href="/register" className="bg-white/20 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white/30 transition text-sm text-white">
                    {t('menu.signup', '회원가입')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
        
        {/* 모바일 메뉴 - 풀스크린 최적화 */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm">
            <div className="flex flex-col h-full">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white">{t('menu.menu', '메뉴')}</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200"
                  aria-label={t('menu.close_menu', '메뉴 닫기')}
                >
                  <X className="w-7 h-7 text-white" />
                </button>
              </div>

              {/* 메뉴 컨텐츠 */}
              <div className="flex-1 overflow-y-auto p-6">
                <nav className="space-y-2">
                  {!menuLoading && headerMenus
                    .filter(menu => menu.visible)
                    .sort((a, b) => a.order - b.order)
                    .map(menu => (
                      <Link 
                        key={menu.id}
                        href={menu.href} 
                        className="flex items-center px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 font-medium text-white text-lg"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-4"></span>
                        {getLocalizedText(menu.label, menu.label as any)}
                      </Link>
                    ))}
                  
                  {/* 권한별 메뉴 구분선 */}
                  {(isAdmin || isInfluencer || isBusiness) && (
                    <div className="h-px bg-white/20 my-6" />
                  )}
                  
                  {/* 관리자 메뉴 */}
                  {isAdmin && (
                    <>
                      <div className="px-4 py-2 text-white/60 text-sm font-medium uppercase tracking-wider">
                        {t('menu.admin_menu', '관리자 메뉴')}
                      </div>
                      <Link 
                        href="/admin/users" 
                        className="flex items-center px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white text-lg"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-4"></span>
                        {t('menu.user_management', '사용자 관리')}
                      </Link>
                      <Link 
                        href="/admin/campaigns" 
                        className="flex items-center px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white text-lg"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-4"></span>
                        {t('menu.campaign_management', '캠페인 관리')}
                      </Link>
                    </>
                  )}
                  
                  {/* 인플루언서 메뉴 */}
                  {isInfluencer && user && (
                    <>
                      <div className="px-4 py-2 text-white/60 text-sm font-medium uppercase tracking-wider">
                        {t('menu.personal_menu', '개인 메뉴')}
                      </div>
                      <Link 
                        href="/mypage" 
                        className="flex items-center px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white text-lg"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-4"></span>
                        {t('menu.mypage', '마이페이지')}
                      </Link>
                    </>
                  )}
                  
                  {/* 비즈니스 메뉴 */}
                  {isBusiness && (
                    <>
                      <div className="px-4 py-2 text-white/60 text-sm font-medium uppercase tracking-wider">
                        {t('menu.business_menu', '비즈니스 메뉴')}
                      </div>
                      <Link 
                        href="/business/dashboard" 
                        className="flex items-center px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white text-lg"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-4"></span>
                        {t('menu.dashboard', '대시보드')}
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              {/* 하단 로그인/로그아웃 버튼 */}
              <div className="p-6 border-t border-white/20">
                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-xl">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-white/60 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-6 py-4 bg-red-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-red-600 active:scale-95"
                    >
                      {t('menu.logout', '로그아웃')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link 
                      href="/login" 
                      className="block w-full px-6 py-4 bg-white/10 text-white text-center rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-white/20"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('menu.login', '로그인')}
                    </Link>
                    <Link 
                      href="/register" 
                      className="block w-full px-6 py-4 bg-blue-500 text-white text-center rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-blue-600"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('menu.signup', '회원가입')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// React.memo로 성능 최적화
export default memo(Header)