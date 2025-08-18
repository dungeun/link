'use client';

import Link from 'next/link'
import { useEffect, useMemo, memo } from 'react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import { useLanguage } from '@/hooks/useLanguage'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Twitter, Facebook, Youtube, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

function Footer() {
  const { config, websiteSettings } = useUIConfigStore()
  const { columns = [], social = [], copyright = '' } = config.footer || {}
  const { t, currentLanguage } = useLanguage()
  const { settings: siteSettings } = useSiteSettings()

  // API 호출 제거 - 무한 루프 방지

  // 관리자 설정이 있으면 우선 사용, 없으면 기본 설정 사용 - 메모이제이션
  const footerEnabled = useMemo(() => 
    siteSettings.website?.footerEnabled ?? websiteSettings?.footerEnabled ?? true, 
    [siteSettings.website?.footerEnabled, websiteSettings?.footerEnabled]
  )

  // 소셜 아이콘 정의 - 메모이제이션
  const socialIcons = useMemo(() => ({
    twitter: <Twitter className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    linkedin: <Linkedin className="w-5 h-5" />
  }), [])

  if (!footerEnabled) {
    return null
  }

  // 서비스 컬럼 제외하고 나머지 컬럼만 필터링
  const filteredColumns = columns
    ?.filter(col => !col.title?.includes('service') && !col.title?.includes('서비스'))
    .sort((a, b) => a.order - b.order)

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 메인 푸터 콘텐츠 */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* 브랜드 정보 & 회사 정보 통합 (왼쪽) */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                  {siteSettings.general?.siteName || config.header?.logo?.text || 'LinkPick'}
                </h3>
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t('footer.description', siteSettings.general?.siteDescription || '브랜드와 인플루언서를 연결하는 스마트한 마케팅 플랫폼')}
              </p>
              
              {/* 소셜 링크 */}
              <div className="flex space-x-3 mb-8">
                {siteSettings.website?.socialLinks ? (
                  Object.entries(siteSettings.website.socialLinks)
                    .filter(([_, url]) => url)
                    .map(([platform, url]) => (
                      <a 
                        key={platform}
                        href={url as string} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                        aria-label={platform}
                      >
                        {socialIcons[platform as keyof typeof socialIcons]}
                      </a>
                    ))
                ) : (
                  social?.filter(s => s.visible).map((socialItem, index) => (
                    <a 
                      key={index}
                      href={socialItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                      aria-label={socialItem.platform}
                    >
                      {socialIcons[socialItem.platform as keyof typeof socialIcons]}
                    </a>
                  ))
                )}
              </div>

              {/* 회사 정보와 고객지원 가로 배치 */}
              <div className="pt-6 mt-6 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  {/* 회사 정보 (왼쪽) */}
                  <div className="text-gray-400 space-y-2">
                    <p className="font-medium text-white mb-2">LinkPick</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>{t('footer.info.ceo', '대표')}: 홍길동</span>
                      <span>{t('footer.info.businessNo', '사업자등록번호')}: 123-45-67890</span>
                    </div>
                    <div className="text-xs">
                      <span>{t('footer.info.telecom', '통신판매업')}: 2024-서울강남-1234</span>
                    </div>
                    <div className="flex items-start gap-1 text-xs">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>서울특별시 강남구 테헤란로 123, 456호</span>
                    </div>
                  </div>
                  
                  {/* 고객 지원 (오른쪽) */}
                  <div className="text-gray-400 space-y-2">
                    <p className="font-medium text-white mb-2">{t('footer.support.title', '고객지원')}</p>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>1588-1234</span>
                        <span className="mx-2">|</span>
                        <Mail className="w-3 h-3" />
                        <span>support@linkpick.com</span>
                      </div>
                      <p className="text-gray-500">{t('footer.support.hours', '평일 09:00~18:00 (주말/공휴일 휴무)')}</p>
                    </div>
                    
                    {/* 저작권 */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        {(() => {
                          const footerText = siteSettings.website?.footerText;
                          if (typeof footerText === 'object' && footerText) {
                            return footerText[currentLanguage] || footerText.ko || footerText.en;
                          }
                          return footerText || t(copyright, `© ${new Date().getFullYear()} LinkPick. All rights reserved.`);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 링크 컬럼들 (오른쪽) */}
            {siteSettings.website?.footerLinks?.length > 0 ? (
              // Admin 설정의 푸터 링크 사용
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-white font-semibold mb-4">{t('footer.links.title', '바로가기')}</h4>
                    <ul className="space-y-3">
                      {siteSettings.website.footerLinks.map((link, index) => (
                        <li key={index}>
                          <Link 
                            href={link.url} 
                            target={link.newWindow ? '_blank' : '_self'}
                            rel={link.newWindow ? 'noopener noreferrer' : undefined}
                            className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
                          >
                            {(() => {
                              const title = link.title;
                              if (typeof title === 'object' && title) {
                                return title[currentLanguage] || title.ko || title.en;
                              }
                              return title || '';
                            })()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : filteredColumns?.length > 0 ? (
              filteredColumns.slice(0, 2).map(column => (
                <div key={column.id} className="lg:col-span-1">
                  <h4 className="text-white font-semibold mb-4">
                    {t(column.title, column.title)}
                  </h4>
                  <ul className="space-y-3">
                    {column.links
                      ?.filter(link => link.visible)
                      .sort((a, b) => a.order - b.order)
                      .map(link => (
                        <li key={link.id}>
                          <Link 
                            href={link.href} 
                            className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
                          >
                            {t(link.label, link.label)}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            ) : (
              // 기본 푸터 링크 (서비스 제외)
              <>
                <div className="lg:col-span-1">
                  <h4 className="text-white font-semibold mb-4">{t('footer.company.title', '회사')}</h4>
                  <ul className="space-y-3">
                    <li><Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm">{t('footer.company.about', '회사소개')}</Link></li>
                    <li><Link href="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm">{t('footer.company.contact', '문의하기')}</Link></li>
                    <li><Link href="/careers" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm">{t('footer.company.careers', '채용')}</Link></li>
                  </ul>
                </div>
                <div className="lg:col-span-1">
                  <h4 className="text-white font-semibold mb-4">{t('footer.legal.title', '법적 고지')}</h4>
                  <ul className="space-y-3">
                    <li><Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm">{t('footer.legal.terms', '이용약관')}</Link></li>
                    <li><Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm">{t('footer.legal.privacy', '개인정보처리방침')}</Link></li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  )
}

// React.memo로 성능 최적화
export default memo(Footer)