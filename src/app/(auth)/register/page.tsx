'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const DaumPostcode = dynamic(() => import('@/components/DaumPostcode'), {
  ssr: false
})

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  
  const defaultRole = searchParams.get('type') as 'business' | 'influencer' | null
  
  const [formData, setFormData] = useState({
    role: defaultRole || '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    companyName: '',
    businessNumber: '',
    agreeTerms: false,
    agreeMarketing: false
  })
  const [businessFile, setBusinessFile] = useState<File | null>(null)
  
  const [showPostcode, setShowPostcode] = useState(false)

  const handleRoleSelect = (role: 'business' | 'influencer') => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // 파일 크기 검증 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      
      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('JPG, PNG, GIF, PDF 파일만 업로드 가능합니다.')
        return
      }
      
      setBusinessFile(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!formData.agreeTerms) {
      setError('이용약관에 동의해주세요.')
      return
    }

    // 비즈니스 계정일 경우 사업자등록증 필수
    if (formData.role === 'business' && !businessFile) {
      setError('사업자등록증을 첨부해주세요.')
      return
    }

    setIsLoading(true)

    try {
      let response;
      
      if (formData.role === 'business' && businessFile) {
        // FormData로 전송 (파일 포함)
        const submitData = new FormData()
        submitData.append('type', 'BUSINESS')
        submitData.append('email', formData.email)
        submitData.append('password', formData.password)
        submitData.append('name', formData.name)
        submitData.append('phone', formData.phone)
        submitData.append('address', formData.address + (formData.addressDetail ? ' ' + formData.addressDetail : ''))
        submitData.append('companyName', formData.companyName || formData.name)
        submitData.append('businessNumber', formData.businessNumber)
        submitData.append('businessFile', businessFile)
        
        response = await fetch('/api/auth/register', {
          method: 'POST',
          body: submitData
        })
      } else {
        // JSON으로 전송 (인플루언서)
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
            address: formData.address + (formData.addressDetail ? ' ' + formData.addressDetail : ''),
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.')
      }

      // 로컬 스토리지에 토큰 저장
      if (data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
      }

      // 사용자 정보 저장
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // 역할에 따라 다른 대시보드로 이동
      if (formData.role === 'business') {
        router.push('/business/dashboard')
      } else {
        router.push('/mypage')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 1 && !defaultRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-2xl text-gray-800 mb-2">환영합니다!</h2>
            <p className="text-gray-600">어떤 목적으로 LinkPick을 사용하시나요?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleRoleSelect('business')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-indigo-400"
            >
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">비즈니스</h3>
              <p className="text-gray-600">
                인플루언서를 찾고 마케팅 캠페인을 진행하고 싶어요
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('influencer')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-purple-400"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">인플루언서</h3>
              <p className="text-gray-600">
                브랜드와 협업하고 콘텐츠로 수익을 창출하고 싶어요
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl px-8 py-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-xl text-gray-600">
              {formData.role === 'business' ? '비즈니스' : '인플루언서'} 계정 만들기
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="8자 이상 입력해주세요"
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="비밀번호를 다시 입력해주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="010-1234-5678"
              />
            </div>

            {formData.role === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="회사명을 입력해주세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="000-00-00000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자등록증 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      id="businessFile"
                      name="businessFile"
                      type="file"
                      required
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="businessFile"
                      className="cursor-pointer bg-white px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      파일 선택
                    </label>
                    <span className="ml-3 text-sm text-gray-500">
                      {businessFile ? businessFile.name : '파일을 선택해주세요'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG, GIF, PDF 파일만 가능 (최대 5MB)
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.address}
                    readOnly
                    onClick={() => setShowPostcode(true)}
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 cursor-pointer"
                    placeholder="주소를 검색해주세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPostcode(true)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.addressDetail}
                  onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="상세 주소"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-1 rounded text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">
                  <Link href="/terms" className="text-indigo-600 hover:text-indigo-700">이용약관</Link> 및{' '}
                  <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700">개인정보처리방침</Link>에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeMarketing}
                  onChange={(e) => setFormData({ ...formData, agreeMarketing: e.target.checked })}
                  className="mt-1 rounded text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">
                  마케팅 정보 수신에 동의합니다 (선택)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
            >
              {isLoading ? '회원가입 중...' : '회원가입 완료'}
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

          <p className="mt-8 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
      
      {showPostcode && (
        <DaumPostcode
          onComplete={(data) => {
            setFormData({ ...formData, address: data.address })
            setShowPostcode(false)
          }}
          onClose={() => setShowPostcode(false)}
        />
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}