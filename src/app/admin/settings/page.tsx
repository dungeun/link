'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ApiConfigSection } from '@/components/admin/ApiConfigSection'
import { apiGet, apiPut } from '@/lib/api/client'

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    supportEmail: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
  }
  website: {
    logo: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    footerEnabled: boolean
    footerText: {
      ko: string
      en: string
    }
    footerLinks: Array<{
      title: {
        ko: string
        en: string
      }
      url: string
      newWindow: boolean
    }>
    socialLinks: {
      facebook: string
      twitter: string
      instagram: string
      youtube: string
      linkedin: string
    }
    seo: {
      metaTitle: string
      metaDescription: string
      metaKeywords: string
      ogImage: string
    }
    analytics: {
      googleAnalyticsId: string
      facebookPixelId: string
      hotjarId: string
    }
  }
  payments: {
    platformFeeRate: number
    minimumPayout: number
    paymentMethods: string[]
    autoPayoutEnabled: boolean
    payoutSchedule: string
  }
  content: {
    maxFileSize: number
    allowedFileTypes: string[]
    contentModerationEnabled: boolean
    autoApprovalEnabled: boolean
    maxCampaignDuration: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    notificationDelay: number
  }
  legal: {
    termsOfService: string
    privacyPolicy: string
    termsLastUpdated: string
    privacyLastUpdated: string
  }
  seo: {
    title: string
    description: string
    keywords: string
    author: string
    robots: string
    canonical: string
  }
  metadata: {
    favicon: string
    appleTouchIcon: string
    ogImage: string
    ogTitle: string
    ogDescription: string
    ogUrl: string
    ogSiteName: string
    ogType: string
    ogLocale: string
    twitterCard: string
    twitterSite: string
    twitterCreator: string
    twitterImage: string
    themeColor: string
    msapplicationTileColor: string
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Revu',
      siteDescription: '리뷰 플랫폼 - 인플루언서와 브랜드를 연결하는 리뷰 마케팅 플랫폼',
      supportEmail: 'support@revu.com',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    website: {
      logo: '/logo.png',
      favicon: '/favicon.ico',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      footerEnabled: true,
      footerText: {
        ko: '© 2024 LinkPick. All rights reserved.',
        en: '© 2024 LinkPick. All rights reserved.'
      },
      footerLinks: [
        { title: { ko: '이용약관', en: 'Terms of Service' }, url: '/terms', newWindow: false },
        { title: { ko: '개인정보처리방침', en: 'Privacy Policy' }, url: '/privacy', newWindow: false },
        { title: { ko: '고객지원', en: 'Support' }, url: '/support', newWindow: false },
        { title: { ko: '회사소개', en: 'About Us' }, url: '/about', newWindow: false }
      ],
      socialLinks: {
        facebook: 'https://facebook.com/linkpick',
        twitter: 'https://twitter.com/linkpick',
        instagram: 'https://instagram.com/linkpick',
        youtube: 'https://youtube.com/linkpick',
        linkedin: 'https://linkedin.com/company/linkpick'
      },
      seo: {
        metaTitle: 'LinkPick - 인플루언서 마케팅 플랫폼',
        metaDescription: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
        metaKeywords: '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
        ogImage: '/og-image.jpg'
      },
      analytics: {
        googleAnalyticsId: '',
        facebookPixelId: '',
        hotjarId: ''
      }
    },
    payments: {
      platformFeeRate: 15,
      minimumPayout: 10000,
      paymentMethods: ['bank_transfer', 'paypal'],
      autoPayoutEnabled: true,
      payoutSchedule: 'monthly'
    },
    content: {
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'png', 'gif', 'mp4', 'mov'],
      contentModerationEnabled: true,
      autoApprovalEnabled: false,
      maxCampaignDuration: 90
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationDelay: 5
    },
    legal: {
      termsOfService: '',
      privacyPolicy: '',
      termsLastUpdated: new Date().toISOString().split('T')[0],
      privacyLastUpdated: new Date().toISOString().split('T')[0]
    },
    seo: {
      title: 'LinkPick - 인플루언서 마케팅 플랫폼',
      description: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
      keywords: '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
      author: 'LinkPick',
      robots: 'index, follow',
      canonical: 'https://linkpick.com'
    },
    metadata: {
      favicon: '/favicon.svg',
      appleTouchIcon: '/apple-touch-icon.png',
      ogImage: '/og-image.svg',
      ogTitle: 'LinkPick - 인플루언서 마케팅 플랫폼',
      ogDescription: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
      ogUrl: 'https://linkpick.com',
      ogSiteName: 'LinkPick',
      ogType: 'website',
      ogLocale: 'ko_KR',
      twitterCard: 'summary_large_image',
      twitterSite: '@linkpick',
      twitterCreator: '@linkpick',
      twitterImage: '/og-image.svg',
      themeColor: '#3B82F6',
      msapplicationTileColor: '#3B82F6'
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'website' | 'seo' | 'payments' | 'content' | 'notifications' | 'legal' | 'api'>('general')
  const [footerTextLang, setFooterTextLang] = useState<'ko' | 'en'>('ko')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setInitialLoading(true)
      const response = await apiGet('/api/admin/settings')

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        setError('설정을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('설정을 불러오는데 실패했습니다.')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiPut('/api/admin/settings', settings)

      if (response.ok) {
        setSuccess('설정이 성공적으로 저장되었습니다.')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error('설정 저장에 실패했습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section: keyof SystemSettings, field: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* PC 1920px 최적화된 헤더 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">시스템 설정</h1>
              <p className="text-xl text-gray-600">플랫폼의 전반적인 설정을 관리합니다</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 수정: {new Date().toLocaleString('ko-KR')}
              </div>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? '저장중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </div>

        {/* 알림 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white border-b">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              일반 설정
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'website'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              웹사이트
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'seo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SEO 및 메타데이터
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              결제
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              콘텐츠
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              알림
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'legal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              약관 및 정책
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API 설정
            </button>
          </nav>
        </div>

        {/* 일반 설정 */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">일반 설정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 이름
              </label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 설명
              </label>
              <textarea
                rows={3}
                value={settings.general.siteDescription}
                onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객지원 이메일
              </label>
              <input
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* PC 1920px 최적화된 체크박스 그리드 */}
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => handleInputChange('general', 'maintenanceMode', e.target.checked)}
                    className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  />
                  <label className="ml-4 text-base font-medium text-gray-900">
                    유지보수 모드
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600">사이트를 임시적으로 비활성화합니다</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.general.registrationEnabled}
                    onChange={(e) => handleInputChange('general', 'registrationEnabled', e.target.checked)}
                    className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  />
                  <label className="ml-4 text-base font-medium text-gray-900">
                    회원가입 허용
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600">새로운 사용자의 가입을 허용합니다</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.general.emailVerificationRequired}
                    onChange={(e) => handleInputChange('general', 'emailVerificationRequired', e.target.checked)}
                    className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  />
                  <label className="ml-4 text-base font-medium text-gray-900">
                    이메일 인증 필수
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600">회원가입 시 이메일 인증이 필요합니다</p>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* 웹사이트 설정 */}
        {activeTab === 'website' && (
          <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">웹사이트 설정</h2>
          
          {/* 브랜딩 */}
          <div className="space-y-8">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">브랜딩</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    로고 이미지
                  </label>
                  <div className="max-w-xs">
                    <ImageUpload
                      value={settings.website.logo}
                      onChange={(value) => handleInputChange('website', 'logo', value)}
                      category="temp"
                      maxSize={2}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    헤더에 표시될 로고입니다. 높이 40px에 최적화됩니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    파비콘
                  </label>
                  <div className="max-w-xs">
                    <ImageUpload
                      value={settings.website.favicon}
                      onChange={(value) => handleInputChange('website', 'favicon', value)}
                      category="temp"
                      maxSize={1}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    브라우저 탭에 표시될 아이콘입니다. 32x32px 정사각형이 권장됩니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메인 컬러
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.website.primaryColor}
                      onChange={(e) => handleInputChange('website', 'primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.website.primaryColor}
                      onChange={(e) => handleInputChange('website', 'primaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보조 컬러
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={settings.website.secondaryColor}
                      onChange={(e) => handleInputChange('website', 'secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.website.secondaryColor}
                      onChange={(e) => handleInputChange('website', 'secondaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 설정 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">푸터 설정</h3>
              
              {/* 푸터 활성화 체크박스 */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.website.footerEnabled}
                    onChange={(e) => handleInputChange('website', 'footerEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    푸터 표시
                  </label>
                </div>
              </div>

              {settings.website.footerEnabled && (
                <>
                  {/* 푸터 텍스트 (다국어) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      푸터 텍스트
                    </label>
                    <div className="border border-gray-200 rounded-lg">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                          <button
                            type="button"
                            onClick={() => setFooterTextLang('ko')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${
                              footerTextLang === 'ko'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            한국어
                          </button>
                          <button
                            type="button"
                            onClick={() => setFooterTextLang('en')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${
                              footerTextLang === 'en'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            English
                          </button>
                        </nav>
                      </div>
                      <div className="p-4">
                        <input
                          type="text"
                          value={settings.website.footerText[footerTextLang]}
                          onChange={(e) => {
                            const newFooterText = { ...settings.website.footerText, [footerTextLang]: e.target.value }
                            handleInputChange('website', 'footerText', newFooterText)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={footerTextLang === 'ko' ? '© 2024 LinkPick. All rights reserved.' : '© 2024 LinkPick. All rights reserved.'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 푸터 링크 관리 */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        푸터 링크
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newLink = {
                            title: { ko: '', en: '' },
                            url: '',
                            newWindow: false
                          }
                          const newLinks = [...settings.website.footerLinks, newLink]
                          handleInputChange('website', 'footerLinks', newLinks)
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        링크 추가
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {settings.website.footerLinks.map((link, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                제목 (한국어)
                              </label>
                              <input
                                type="text"
                                value={link.title.ko}
                                onChange={(e) => {
                                  const newLinks = [...settings.website.footerLinks]
                                  newLinks[index] = {
                                    ...newLinks[index],
                                    title: { ...newLinks[index].title, ko: e.target.value }
                                  }
                                  handleInputChange('website', 'footerLinks', newLinks)
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                제목 (English)
                              </label>
                              <input
                                type="text"
                                value={link.title.en}
                                onChange={(e) => {
                                  const newLinks = [...settings.website.footerLinks]
                                  newLinks[index] = {
                                    ...newLinks[index],
                                    title: { ...newLinks[index].title, en: e.target.value }
                                  }
                                  handleInputChange('website', 'footerLinks', newLinks)
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                URL
                              </label>
                              <input
                                type="text"
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...settings.website.footerLinks]
                                  newLinks[index] = { ...newLinks[index], url: e.target.value }
                                  handleInputChange('website', 'footerLinks', newLinks)
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="/terms"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={link.newWindow}
                                  onChange={(e) => {
                                    const newLinks = [...settings.website.footerLinks]
                                    newLinks[index] = { ...newLinks[index], newWindow: e.target.checked }
                                    handleInputChange('website', 'footerLinks', newLinks)
                                  }}
                                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-xs text-gray-700">
                                  새 창에서 열기
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = settings.website.footerLinks.filter((_, i) => i !== index)
                                  handleInputChange('website', 'footerLinks', newLinks)
                                }}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 소셜 미디어 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">소셜 미디어</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.facebook}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, facebook: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://facebook.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.instagram}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, instagram: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://instagram.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.twitter}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, twitter: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://twitter.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.youtube}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, youtube: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/linkpick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={settings.website.socialLinks.linkedin}
                    onChange={(e) => {
                      const newSocialLinks = { ...settings.website.socialLinks, linkedin: e.target.value }
                      handleInputChange('website', 'socialLinks', newSocialLinks)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/company/linkpick"
                  />
                </div>
              </div>
            </div>

            {/* SEO 설정 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">SEO 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 제목
                  </label>
                  <input
                    type="text"
                    value={settings.website.seo.metaTitle}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaTitle: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="LinkPick - 인플루언서 마케팅 플랫폼"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 설명
                  </label>
                  <textarea
                    rows={3}
                    value={settings.website.seo.metaDescription}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaDescription: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메타 키워드
                  </label>
                  <input
                    type="text"
                    value={settings.website.seo.metaKeywords}
                    onChange={(e) => {
                      const newSeo = { ...settings.website.seo, metaKeywords: e.target.value }
                      handleInputChange('website', 'seo', newSeo)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="인플루언서, 마케팅, 브랜드, 광고, 소셜미디어"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OG 이미지
                  </label>
                  <div className="max-w-md">
                    <ImageUpload
                      value={settings.website.seo.ogImage}
                      onChange={(value) => {
                        const newSeo = { ...settings.website.seo, ogImage: value }
                        handleInputChange('website', 'seo', newSeo)
                      }}
                      category="temp"
                      maxSize={5}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    소셜 미디어에서 공유될 때 표시되는 이미지입니다. 1200x630px 권장.
                  </p>
                </div>
              </div>
            </div>

            {/* 분석 도구 */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">분석 도구</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.googleAnalyticsId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, googleAnalyticsId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="GA-XXXXXXXXX-X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.facebookPixelId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, facebookPixelId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotjar ID
                  </label>
                  <input
                    type="text"
                    value={settings.website.analytics.hotjarId}
                    onChange={(e) => {
                      const newAnalytics = { ...settings.website.analytics, hotjarId: e.target.value }
                      handleInputChange('website', 'analytics', newAnalytics)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* SEO 및 메타데이터 설정 */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO 및 메타데이터 설정</h2>
            <div className="space-y-6">
              {/* 기본 SEO 설정 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">기본 SEO 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      페이지 제목
                    </label>
                    <input
                      type="text"
                      value={settings.seo.title}
                      onChange={(e) => handleInputChange('seo', 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="LinkPick - 인플루언서 마케팅 플랫폼"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      페이지 설명
                    </label>
                    <textarea
                      rows={3}
                      value={settings.seo.description}
                      onChange={(e) => handleInputChange('seo', 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      키워드
                    </label>
                    <input
                      type="text"
                      value={settings.seo.keywords}
                      onChange={(e) => handleInputChange('seo', 'keywords', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="인플루언서, 마케팅, 브랜드, 광고, 소셜미디어"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        작성자
                      </label>
                      <input
                        type="text"
                        value={settings.seo.author}
                        onChange={(e) => handleInputChange('seo', 'author', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="LinkPick"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Robots
                      </label>
                      <input
                        type="text"
                        value={settings.seo.robots}
                        onChange={(e) => handleInputChange('seo', 'robots', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="index, follow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canonical URL
                      </label>
                      <input
                        type="text"
                        value={settings.seo.canonical}
                        onChange={(e) => handleInputChange('seo', 'canonical', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkpick.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Graph 설정 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Open Graph 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG 제목
                    </label>
                    <input
                      type="text"
                      value={settings.metadata.ogTitle}
                      onChange={(e) => handleInputChange('metadata', 'ogTitle', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="LinkPick - 인플루언서 마케팅 플랫폼"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG 설명
                    </label>
                    <textarea
                      rows={3}
                      value={settings.metadata.ogDescription}
                      onChange={(e) => handleInputChange('metadata', 'ogDescription', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG URL
                      </label>
                      <input
                        type="text"
                        value={settings.metadata.ogUrl}
                        onChange={(e) => handleInputChange('metadata', 'ogUrl', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://linkpick.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG 사이트명
                      </label>
                      <input
                        type="text"
                        value={settings.metadata.ogSiteName}
                        onChange={(e) => handleInputChange('metadata', 'ogSiteName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="LinkPick"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG 타입
                      </label>
                      <select
                        value={settings.metadata.ogType}
                        onChange={(e) => handleInputChange('metadata', 'ogType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="website">website</option>
                        <option value="article">article</option>
                        <option value="product">product</option>
                        <option value="profile">profile</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OG 로케일
                      </label>
                      <input
                        type="text"
                        value={settings.metadata.ogLocale}
                        onChange={(e) => handleInputChange('metadata', 'ogLocale', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ko_KR"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OG 이미지
                    </label>
                    <div className="max-w-md">
                      <ImageUpload
                        value={settings.metadata.ogImage}
                        onChange={(value) => handleInputChange('metadata', 'ogImage', value)}
                        category="seo"
                        maxSize={5}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      소셜 미디어에서 공유될 때 표시되는 이미지입니다. 1200x630px 권장.
                    </p>
                  </div>
                </div>
              </div>

              {/* Twitter Card 설정 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Twitter Card 설정</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카드 타입
                      </label>
                      <select
                        value={settings.metadata.twitterCard}
                        onChange={(e) => handleInputChange('metadata', 'twitterCard', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="summary">summary</option>
                        <option value="summary_large_image">summary_large_image</option>
                        <option value="app">app</option>
                        <option value="player">player</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사이트 계정
                      </label>
                      <input
                        type="text"
                        value={settings.metadata.twitterSite}
                        onChange={(e) => handleInputChange('metadata', 'twitterSite', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="@linkpick"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        작성자 계정
                      </label>
                      <input
                        type="text"
                        value={settings.metadata.twitterCreator}
                        onChange={(e) => handleInputChange('metadata', 'twitterCreator', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="@linkpick"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter 이미지
                    </label>
                    <div className="max-w-md">
                      <ImageUpload
                        value={settings.metadata.twitterImage}
                        onChange={(value) => handleInputChange('metadata', 'twitterImage', value)}
                        category="seo"
                        maxSize={5}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Twitter에서 공유될 때 표시되는 이미지입니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 파비콘 및 아이콘 설정 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">파비콘 및 아이콘</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      파비콘
                    </label>
                    <div className="max-w-md">
                      <ImageUpload
                        value={settings.metadata.favicon}
                        onChange={(value) => handleInputChange('metadata', 'favicon', value)}
                        category="seo"
                        maxSize={1}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      브라우저 탭에 표시되는 아이콘입니다. ICO, PNG 형식 권장.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apple Touch Icon
                    </label>
                    <div className="max-w-md">
                      <ImageUpload
                        value={settings.metadata.appleTouchIcon}
                        onChange={(value) => handleInputChange('metadata', 'appleTouchIcon', value)}
                        category="seo"
                        maxSize={1}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      iOS 기기에서 북마크 시 표시되는 아이콘입니다. 180x180px 권장.
                    </p>
                  </div>
                </div>
              </div>

              {/* 테마 설정 */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">테마 색상</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      테마 색상
                    </label>
                    <input
                      type="color"
                      value={settings.metadata.themeColor}
                      onChange={(e) => handleInputChange('metadata', 'themeColor', e.target.value)}
                      className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      모바일 브라우저 주소창 색상
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MS 타일 색상
                    </label>
                    <input
                      type="color"
                      value={settings.metadata.msapplicationTileColor}
                      onChange={(e) => handleInputChange('metadata', 'msapplicationTileColor', e.target.value)}
                      className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Windows 타일 배경 색상
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 결제 설정 */}
        {activeTab === 'payments' && (
          <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  플랫폼 수수료 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.payments.platformFeeRate}
                  onChange={(e) => handleInputChange('payments', 'platformFeeRate', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 출금액 (원)
                </label>
                <input
                  type="number"
                  min="1000"
                  value={settings.payments.minimumPayout}
                  onChange={(e) => handleInputChange('payments', 'minimumPayout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정산 주기
              </label>
              <select
                value={settings.payments.payoutSchedule}
                onChange={(e) => handleInputChange('payments', 'payoutSchedule', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">주간</option>
                <option value="monthly">월간</option>
                <option value="quarterly">분기별</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.payments.autoPayoutEnabled}
                onChange={(e) => handleInputChange('payments', 'autoPayoutEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                자동 정산 활성화
              </label>
            </div>
          </div>
          </div>
        )}

        {/* 콘텐츠 설정 */}
        {activeTab === 'content' && (
          <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 파일 크기 (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.content.maxFileSize}
                  onChange={(e) => handleInputChange('content', 'maxFileSize', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 캠페인 기간 (일)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.content.maxCampaignDuration}
                  onChange={(e) => handleInputChange('content', 'maxCampaignDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                허용된 파일 형식
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['jpg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx'].map(type => (
                  <div key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.content.allowedFileTypes.includes(type)}
                      onChange={(e) => {
                        const currentTypes = settings.content.allowedFileTypes
                        const newTypes = e.target.checked
                          ? [...currentTypes, type]
                          : currentTypes.filter(t => t !== type)
                        handleInputChange('content', 'allowedFileTypes', newTypes)
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 uppercase">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.content.contentModerationEnabled}
                  onChange={(e) => handleInputChange('content', 'contentModerationEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  콘텐츠 검토 활성화
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.content.autoApprovalEnabled}
                  onChange={(e) => handleInputChange('content', 'autoApprovalEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  자동 승인 활성화
                </label>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* 알림 설정 */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  이메일 알림
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  SMS 알림
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => handleInputChange('notifications', 'pushNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  푸시 알림
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                알림 지연 시간 (분)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.notifications.notificationDelay}
                onChange={(e) => handleInputChange('notifications', 'notificationDelay', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          </div>
        )}

        {/* 약관 및 정책 설정 */}
        {activeTab === 'legal' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">약관 및 정책</h2>
            <div className="space-y-6">
              {/* 이용약관 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">이용약관</h3>
                  <div className="text-sm text-gray-500">
                    최종 수정일: {settings.legal.termsLastUpdated}
                  </div>
                </div>
                <textarea
                  rows={20}
                  value={settings.legal.termsOfService}
                  onChange={(e) => {
                    const newLegal = { 
                      ...settings.legal, 
                      termsOfService: e.target.value,
                      termsLastUpdated: new Date().toISOString().split('T')[0]
                    }
                    handleInputChange('legal', 'termsOfService', e.target.value)
                    handleInputChange('legal', 'termsLastUpdated', new Date().toISOString().split('T')[0])
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="이용약관 내용을 입력하세요..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  HTML 태그를 사용할 수 있습니다. 변경사항은 저장 후 즉시 적용됩니다.
                </p>
              </div>

              {/* 개인정보처리방침 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">개인정보처리방침</h3>
                  <div className="text-sm text-gray-500">
                    최종 수정일: {settings.legal.privacyLastUpdated}
                  </div>
                </div>
                <textarea
                  rows={20}
                  value={settings.legal.privacyPolicy}
                  onChange={(e) => {
                    const newLegal = { 
                      ...settings.legal, 
                      privacyPolicy: e.target.value,
                      privacyLastUpdated: new Date().toISOString().split('T')[0]
                    }
                    handleInputChange('legal', 'privacyPolicy', e.target.value)
                    handleInputChange('legal', 'privacyLastUpdated', new Date().toISOString().split('T')[0])
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="개인정보처리방침 내용을 입력하세요..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  HTML 태그를 사용할 수 있습니다. 변경사항은 저장 후 즉시 적용됩니다.
                </p>
              </div>

              {/* 미리보기 링크 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">미리보기 링크</p>
                <div className="space-y-2">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    이용약관 페이지 보기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    개인정보처리방침 페이지 보기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API 설정 */}
        {activeTab === 'api' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API 연동 설정</h2>
            <p className="text-gray-600 mb-6">
              외부 서비스 API 키와 연동 정보를 관리합니다. 각 서비스의 API 키는 안전하게 암호화되어 저장됩니다.
            </p>
            <ApiConfigSection />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
