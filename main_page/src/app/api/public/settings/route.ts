import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// GET /api/public/settings - 공개 설정 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    // 공개적으로 접근 가능한 설정만 조회
    const publicSettingKeys = [
      'general',
      'website'
    ]

    const settings: Record<string, any> = {}
    
    // 각 설정 키에 대해 DB 조회
    for (const key of publicSettingKeys) {
      const config = await prisma.siteConfig.findUnique({
        where: { key }
      })
      
      if (config) {
        try {
          settings[key] = JSON.parse(config.value)
        } catch (e) {
          // JSON 파싱 실패 시 문자열 그대로 사용
          settings[key] = config.value
        }
      }
    }

    // 설정이 없으면 기본값 사용
    const defaultSettings = {
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

    // DB 설정과 기본값 병합
    const mergedSettings = {
      ...defaultSettings,
      ...settings
    }
    
    return NextResponse.json({
      settings: mergedSettings
    })

  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}