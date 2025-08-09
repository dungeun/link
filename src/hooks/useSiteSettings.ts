'use client'

import { useState, useEffect } from 'react'

interface SiteSettings {
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
    footerText: string
    footerLinks: Array<{
      title: string
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
  payments?: {
    platformFeeRate: number
    minimumPayout: number
    paymentMethods: string[]
    autoPayoutEnabled: boolean
    payoutSchedule: string
  }
  content?: {
    maxFileSize: number
    allowedFileTypes: string[]
    contentModerationEnabled: boolean
    autoApprovalEnabled: boolean
    maxCampaignDuration: number
  }
  notifications?: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    notificationDelay: number
  }
  legal?: {
    termsOfService: string
    privacyPolicy: string
    termsLastUpdated: string
    privacyLastUpdated: string
  }
}

// 기본 설정값
const defaultSettings: SiteSettings = {
  general: {
    siteName: 'LinkPick',
    siteDescription: '인플루언서 마케팅 플랫폼',
    supportEmail: 'support@linkpick.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true
  },
  website: {
    logo: '/logo.svg',
    favicon: '/favicon.svg',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    footerEnabled: true,
    footerText: '© 2024 LinkPick. All rights reserved.',
    footerLinks: [
      { title: '이용약관', url: '/terms', newWindow: false },
      { title: '개인정보처리방침', url: '/privacy', newWindow: false },
      { title: '고객지원', url: '/support', newWindow: false },
      { title: '회사소개', url: '/about', newWindow: false }
    ],
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      linkedin: ''
    },
    seo: {
      metaTitle: 'LinkPick - 인플루언서 마케팅 플랫폼',
      metaDescription: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
      metaKeywords: '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
      ogImage: '/og-image.svg'
    },
    analytics: {
      googleAnalyticsId: '',
      facebookPixelId: '',
      hotjarId: ''
    }
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // 공개 API 엔드포인트 사용 (인증 불필요)
      const response = await fetch('/api/public/settings')

      if (response.ok) {
        const data = await response.json()
        // 기본값과 병합
        const mergedSettings = {
          ...defaultSettings,
          ...data.settings,
          general: {
            ...defaultSettings.general,
            ...(data.settings?.general || {})
          },
          website: {
            ...defaultSettings.website,
            ...(data.settings?.website || {}),
            socialLinks: {
              ...defaultSettings.website.socialLinks,
              ...(data.settings?.website?.socialLinks || {})
            },
            seo: {
              ...defaultSettings.website.seo,
              ...(data.settings?.website?.seo || {})
            },
            analytics: {
              ...defaultSettings.website.analytics,
              ...(data.settings?.website?.analytics || {})
            }
          }
        }
        setSettings(mergedSettings)
      } else {
        // 오류 발생 시 기본값 사용
        console.warn('Failed to load site settings, using defaults')
      }
    } catch (err) {
      // 오류 발생 시 기본값 사용
      console.error('Error loading site settings:', err)
      setError('설정을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // CSS 변수로 색상 적용하는 유틸리티 함수
  const applyThemeColors = () => {
    if (typeof window !== 'undefined' && settings.website) {
      const root = document.documentElement
      root.style.setProperty('--color-primary', settings.website.primaryColor)
      root.style.setProperty('--color-secondary', settings.website.secondaryColor)
    }
  }

  // 설정이 변경될 때마다 테마 색상 적용
  useEffect(() => {
    applyThemeColors()
  }, [settings.website?.primaryColor, settings.website?.secondaryColor])

  return {
    settings,
    loading,
    error,
    reload: loadSettings
  }
}