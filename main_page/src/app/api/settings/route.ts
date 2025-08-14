import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 공개적으로 접근 가능한 설정만 반환
    const publicSettings = {
      website: {
        logo: '/logo.png',
        favicon: '/favicon.ico',
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
          ogImage: '/og-image.jpg'
        }
      },
      general: {
        siteName: 'LinkPick',
        siteDescription: '인플루언서 마케팅 플랫폼'
      }
    }

    return NextResponse.json({
      settings: publicSettings
    })

  } catch (error) {
    console.error('Public settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}