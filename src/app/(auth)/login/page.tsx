'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [demoAccounts, setDemoAccounts] = useState<{
    influencer: { email: string; name: string; password: string } | null;
    business: { email: string; name: string; password: string } | null;
    admin: { email: string; name: string; password: string } | null;
  }>({ influencer: null, business: null, admin: null })
  
  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const errorType = urlParams.get('error')
      const message = urlParams.get('message')
      
      if (errorType === 'admin_required' && message) {
        setUrlError(message)
        // URL에서 파라미터 제거
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [])

  // 데모 계정 정보 가져오기
  useEffect(() => {
    fetchDemoAccounts()
  }, [])
  
  const fetchDemoAccounts = async () => {
    try {
      const response = await fetch('/api/auth/demo-accounts')
      if (response.ok) {
        const data = await response.json()
        setDemoAccounts(data)
      }
    } catch (error) {
      console.error('Failed to fetch demo accounts:', error)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return // 중복 제출 방지
    
    setError('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('=== handleSubmit 로그인 성공 ===');
        console.log('User type:', data.user.type);
        console.log('Response data:', data);
        
        // 토큰 저장 - accessToken 우선 사용
        const token = data.accessToken || data.token;
        if (token) {
          localStorage.setItem('auth-token', token)
          localStorage.setItem('accessToken', token) // 관리자 페이지 호환성
          
          // 쿠키에도 토큰 저장 (미들웨어 호환성을 위해)
          document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
          document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
          
          console.log('토큰 저장됨:', { accessToken: !!token });
        } else {
          console.error('토큰이 없습니다:', data);
          alert('로그인에 실패했습니다. 토큰이 없습니다.');
          return;
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // 직접 리다이렉트 실행 - 전체 URL 사용
        const url = data.user.type === 'ADMIN' ? '/admin' : 
                    data.user.type === 'BUSINESS' ? '/business/dashboard' : '/';
        console.log('리다이렉트 실행:', url);
        
        // 디버깅: 현재 위치 확인
        console.log('현재 위치:', window.location.pathname);
        console.log('리다이렉트 전 document.readyState:', document.readyState);
        
        // 모든 작업이 완료된 후 리다이렉트
        setTimeout(() => {
          console.log('setTimeout 내부 - 리다이렉트 실행');
          window.location.href = url;
        }, 0);
        
        return;
      } else {
        setError(data.error || data.message || '이메일 또는 비밀번호가 올바르지 않습니다.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (userType: 'user' | 'admin' | 'business') => {
    if (isLoading) return // 중복 클릭 방지
    
    setIsLoading(true)
    setError('')
    
    // 선택된 계정 정보 가져오기
    let email = ''
    let password = ''
    
    if (userType === 'user' && demoAccounts.influencer) {
      email = demoAccounts.influencer.email
      password = demoAccounts.influencer.password
    } else if (userType === 'business' && demoAccounts.business) {
      email = demoAccounts.business.email
      password = demoAccounts.business.password
    } else if (userType === 'admin' && demoAccounts.admin) {
      email = demoAccounts.admin.email
      password = demoAccounts.admin.password
    } else {
      // 폴백: 기본 계정 사용
      const credentials = {
        user: { email: 'influencer@example.com', password: 'influencer2024' },
        business: { email: 'business@company.com', password: 'business2024' },
        admin: { email: 'admin@linkpick.co.kr', password: 'admin2024' }
      }
      email = credentials[userType].email
      password = credentials[userType].password
    }
    
    const cred = { email, password }
    setFormData(cred)
    
    try {
      console.log('Quick login attempt:', cred)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      })

      const data = await response.json()
      console.log('Login response:', { status: response.status, data })

      if (response.ok) {
        console.log('=== handleQuickLogin 로그인 성공 ===');
        console.log('User type:', data.user.type);
        console.log('Response data:', data);
        
        // 토큰 저장 - accessToken 우선 사용
        const token = data.accessToken || data.token;
        if (token) {
          localStorage.setItem('auth-token', token)
          localStorage.setItem('accessToken', token) // 관리자 페이지 호환성
          
          // 쿠키에도 토큰 저장 (미들웨어 호환성을 위해)
          document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
          document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
          
          console.log('토큰 저장됨 (localStorage + 쿠키):', { accessToken: !!token });
        } else {
          console.error('토큰이 없습니다:', data);
          alert('로그인에 실패했습니다. 토큰이 없습니다.');
          return;
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // 직접 리다이렉트 실행 - 전체 URL 사용
        const url = data.user.type === 'ADMIN' ? '/admin' : 
                    data.user.type === 'BUSINESS' ? '/business/dashboard' : '/';
        console.log('리다이렉트 실행:', url);
        
        // 디버깅: 현재 위치 확인
        console.log('현재 위치:', window.location.pathname);
        console.log('리다이렉트 전 document.readyState:', document.readyState);
        
        // 모든 작업이 완료된 후 리다이렉트
        setTimeout(() => {
          console.log('setTimeout 내부 - 리다이렉트 실행');
          window.location.href = url;
        }, 0);
        
        return;
      } else {
        setError(data.error || data.message || '로그인에 실패했습니다.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Quick login error:', error)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl px-8 py-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-xl text-gray-600">다시 만나서 반가워요!</h2>
          </div>


          {/* 에러 메시지 표시 */}
          {(error || urlError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm font-medium">
                  {urlError || error}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:opacity-50"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-indigo-600 border-gray-300" />
                <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
            >
              {isLoading ? '처리 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Quick Login Buttons */}
            <div className="mt-6 space-y-3">
              <div className="text-center">
                <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">데모 로그인</span>
                <div className="mt-2 text-xs text-gray-500">
                  <p>테스트 계정 (랜덤 선택):</p>
                  {demoAccounts.influencer && (
                    <p className="mt-1">인플루언서: {demoAccounts.influencer.name}</p>
                  )}
                  {demoAccounts.business && (
                    <p>클라이언트: {demoAccounts.business.name}</p>
                  )}
                  {demoAccounts.admin && (
                    <p>관리자: {demoAccounts.admin.name}</p>
                  )}
                  <div className="mt-2 text-gray-400 space-y-1">
                    <p>인플루언서: influencer2024</p>
                    <p>클라이언트: business2024</p>
                    <p>관리자: admin2024</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickLogin('user')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-emerald-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-medium">인플루언서</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('business')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs text-blue-600 font-medium">클라이언트</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs text-purple-600 font-medium">관리자</span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">소셜 로그인</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2 text-sm text-gray-700">Google</span>
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FADA0A] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#000000" d="M12 3C6.477 3 2 6.477 2 11c0 2.4 1.109 4.553 2.864 6.031V22l4.917-2.694C10.498 19.436 11.237 19.5 12 19.5c5.523 0 10-3.477 10-7.5S17.523 3 12 3zm-.5 10h-3c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h3c.276 0 .5.224.5.5s-.224.5-.5.5zm3.5-2.5c0 .276-.224.5-.5.5h-6c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h6c.276 0 .5.224.5.5z"/>
                  </svg>
                  <span className="ml-2 text-sm text-gray-900">Kakao</span>
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-[#03C75A] border border-[#03C75A] rounded-lg hover:bg-[#02B550] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#FFFFFF" d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                  </svg>
                  <span className="ml-2 text-sm text-white">Naver</span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{' '}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}