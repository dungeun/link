'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { HTMLSanitizer } from '@/lib/utils/html-sanitizer'
import { logger } from '@/lib/logger/structured-logger'

export default function TermsPage() {
  const [content, setContent] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    try {
      const response = await fetch('/api/legal/terms')
      if (response.ok) {
        const data = await response.json()
        setContent(data.content || '')
        setLastUpdated(data.lastUpdated || new Date().toISOString().split('T')[0])
      }
    } catch (error) {
      logger.error('Failed to load terms', error as Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
              <p className="text-sm text-gray-600">최종 수정일: {lastUpdated}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : content ? (
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: HTMLSanitizer.sanitize(content) }}
              />
            ) : (
              <div className="text-gray-600">
                <p>이용약관이 아직 작성되지 않았습니다.</p>
              </div>
            )}

            <div className="mt-12 pt-8 border-t">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Link 
                  href="/"
                  className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  홈으로 돌아가기
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  개인정보처리방침 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}