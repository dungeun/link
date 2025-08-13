'use client';

import Link from 'next/link'
import { useEffect } from 'react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'
import { useLanguage } from '@/hooks/useLanguage'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function Footer() {
  const { config, websiteSettings, loadSettingsFromAPI } = useUIConfigStore()
  const { columns, social, copyright } = config.footer
  const { t, currentLanguage } = useLanguage()
  const { settings: siteSettings } = useSiteSettings()

  useEffect(() => {
    loadSettingsFromAPI()
  }, [loadSettingsFromAPI])

  // 언어 변경 시 UI 설정 재로드
  useEffect(() => {
    loadSettingsFromAPI()
  }, [currentLanguage, loadSettingsFromAPI])

  // 관리자 설정이 있으면 우선 사용, 없으면 기본 설정 사용
  const footerEnabled = siteSettings.website?.footerEnabled ?? websiteSettings?.footerEnabled ?? true

  if (!footerEnabled) {
    return null
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 브랜드 정보 */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              {siteSettings.general?.siteName || config.header.logo.text}
            </h3>
            <p className="text-gray-400 mb-4">
              {siteSettings.general?.siteDescription || '브랜드와 인플루언서를 연결하는 스마트한 마케팅 플랫폼'}
            </p>
            <div className="flex space-x-4">
              {/* 관리자 설정의 소셜 링크 우선 사용 */}
              {siteSettings.website?.socialLinks ? (
                Object.entries(siteSettings.website.socialLinks)
                  .filter(([_, url]) => url)
                  .map(([platform, url]) => {
                  const icons: { [key: string]: JSX.Element } = {
                    twitter: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    ),
                    facebook: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    ),
                    youtube: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    ),
                    instagram: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    ),
                    linkedin: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )
                  };
                  
                    return (
                      <a 
                        key={platform}
                        href={url as string} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {icons[platform] || null}
                      </a>
                    );
                  })
              ) : (
                social && social
                  .filter(s => s.visible)
                  .map((socialItem, index) => {
                    return (
                      <a 
                        key={index}
                        href={socialItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {icons[socialItem.platform] || null}
                      </a>
                    );
                  })
              )}
            </div>
          </div>

          {/* 관리자 설정의 푸터 링크 또는 UI Config의 컬럼 사용 */}
          {siteSettings.website?.footerLinks && siteSettings.website.footerLinks.length > 0 ? (
            <div className="col-span-3 grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">서비스</h4>
                <ul className="space-y-2">
                  {siteSettings.website.footerLinks.map((link, index) => (
                    <li key={index}>
                      <Link 
                        href={link.url} 
                        className="text-gray-400 hover:text-white transition-colors"
                        target={link.newWindow ? '_blank' : undefined}
                        rel={link.newWindow ? 'noopener noreferrer' : undefined}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            columns
              .sort((a, b) => a.order - b.order)
              .map(column => (
                <div key={column.id}>
                  <h4 className="text-lg font-semibold mb-4">{t(column.title, column.title)}</h4>
                  <ul className="space-y-2">
                    {column.links
                      .filter(link => link.visible)
                      .sort((a, b) => a.order - b.order)
                      .map(link => (
                        <li key={link.id}>
                          <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                            {t(link.label, link.label)}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              <p>{siteSettings.website?.footerText || t(copyright, copyright)}</p>
              <p className="mt-1">
                사업자등록번호: 123-45-67890 | 대표: 홍길동 | 
                <br className="md:hidden" />
                주소: 서울특별시 강남구 테헤란로 123, 456호
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">
                <p>고객센터: {siteSettings.general?.supportEmail || '1588-1234'}</p>
                <p>평일 09:00~18:00 (주말/공휴일 휴무)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}