import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // DB에서 설정 조회
    const settingKeys = [
      'general',
      'website', 
      'payments',
      'content',
      'notifications',
      'security',
      'legal'
    ]

    const settings: Record<string, any> = {}
    
    // 각 설정 키에 대해 DB 조회
    for (const key of settingKeys) {
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
          ogImage: '/og-image.svg'
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
    console.error('Get settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const newSettings = await request.json()
    
    // 각 설정 항목을 DB에 저장
    for (const [key, value] of Object.entries(newSettings)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue }
      })
    }

    return NextResponse.json({
      success: true,
      message: '설정이 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('Update settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}