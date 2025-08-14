'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ChevronDown, User as UserIcon, LogOut, Settings, Menu, X, Bell } from 'lucide-react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

interface HeaderProps {
  variant?: 'default' | 'transparent'
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const { config, loadSettingsFromAPI } = useUIConfigStore()
  const { user, isAuthenticated, logout } = useAuth()
  
  const isTransparent = variant === 'transparent'
  
  // 사용자 타입 확인
  const userType = user?.type?.toUpperCase()
  const isInfluencer = !user || userType === 'INFLUENCER' || userType === 'USER'
  const isBusiness = userType === 'BUSINESS'
  const isAdmin = userType === 'ADMIN'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    if (isTransparent) {
      window.addEventListener('scroll', handleScroll)
    }
    
    // 프로필 이미지 로드
    if (user) {
      // localStorage에서 프로필 이미지 가져오기
      const savedProfile = localStorage.getItem('userProfile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setProfileImage(profile.avatar || null)
        } catch (e) {
          console.error('Failed to parse profile:', e)
        }
      }
    }
    
    // UI 설정 로드
    console.log('Header: Loading UI settings...');
    loadSettingsFromAPI()
    
    return () => {
      if (isTransparent) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isTransparent, user])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 알림 데이터 로드 (예시)
  useEffect(() => {
    if (isAuthenticated) {
      // TODO: API에서 알림 데이터 로드
      setNotifications([
        { id: 1, message: '새로운 캠페인이 등록되었습니다', unread: true },
        { id: 2, message: '캠페인 신청이 승인되었습니다', unread: false },
      ])
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
  }

  const isActive = (path: string) => pathname === path


  // 사용자 타입별 대시보드 링크
  const dashboardLink = isAdmin ? '/admin' : isBusiness ? '/business/dashboard' : '/mypage'

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 flex-1">
            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link href="/">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                {config.header.logo.text}
              </h1>
            </Link>
            
            {/* 공통 메뉴 */}
            <nav className="hidden lg:flex items-center gap-6">
              {config.header.menus
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className="hover:opacity-80 transition font-medium text-white"
                  >
                    {menu.label}
                  </Link>
                ))}
            </nav>
          </div>
          

          {/* 사용자 메뉴와 권한별 메뉴 */}
          <nav className="flex items-center gap-3 sm:gap-6 flex-1 justify-end">
            {/* 알림 아이콘 */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-semibold text-gray-900">알림</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b hover:bg-gray-50 transition ${
                              notif.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-700">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          알림이 없습니다
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 권한별 메뉴 - 데스크톱 */}
            <div className="hidden lg:flex items-center gap-4">
              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <Link href="/admin/users" className="hover:opacity-80 transition font-medium text-white text-sm">
                    사용자 관리
                  </Link>
                  <Link href="/admin/campaigns" className="hover:opacity-80 transition font-medium text-white text-sm">
                    캠페인 관리
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
                    <span className="text-xs">마이페이지</span>
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
                    <span className="text-xs">대시보드</span>
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
                        <span className="text-xs">마이</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                      <LogOut className="w-5 h-5" />
                      <span className="text-xs">로그아웃</span>
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
                    로그인
                  </Link>
                  <Link href="/register" className="bg-white/20 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white/30 transition text-sm text-white">
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
        
        {/* 모바일 메뉴 */}
        {showMobileMenu && (
          <div className="lg:hidden mt-4 pt-4 border-t border-white/20">
            <nav className="flex flex-col gap-3">
              {config.header.menus
                .filter(menu => menu.visible)
                .sort((a, b) => a.order - b.order)
                .map(menu => (
                  <Link 
                    key={menu.id}
                    href={menu.href} 
                    className="hover:bg-white/10 px-3 py-2 rounded-lg transition font-medium text-white"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {menu.label}
                  </Link>
                ))}
              
              {/* 권한별 메뉴 */}
              {isAdmin && (
                <>
                  <div className="h-px bg-white/20 my-2" />
                  <Link 
                    href="/admin/users" 
                    className="hover:bg-white/10 px-3 py-2 rounded-lg transition text-white"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    사용자 관리
                  </Link>
                  <Link 
                    href="/admin/campaigns" 
                    className="hover:bg-white/10 px-3 py-2 rounded-lg transition text-white"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    캠페인 관리
                  </Link>
                </>
              )}
              
              {isInfluencer && user && (
                <>
                  <div className="h-px bg-white/20 my-2" />
                  <Link 
                    href="/mypage" 
                    className="hover:bg-white/10 px-3 py-2 rounded-lg transition text-white"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    마이페이지
                  </Link>
                </>
              )}
              
              {isBusiness && (
                <>
                  <div className="h-px bg-white/20 my-2" />
                  <Link 
                    href="/business/dashboard" 
                    className="hover:bg-white/10 px-3 py-2 rounded-lg transition text-white"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    대시보드
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}