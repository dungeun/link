'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutPage() {

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white hero-content">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-800">
              인플루언서 마케팅의
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                새로운 기준
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-800" style={{ animationDelay: '200ms' }}>
              LinkPick은 AI 기술과 데이터 분석을 통해 브랜드와 인플루언서를 연결하는
              혁신적인 리뷰 마케팅 플랫폼입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">우리의 미션</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center mission-item animate-in fade-in slide-in-from-bottom-4 duration-600">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">투명한 연결</h3>
                <p className="text-gray-600">
                  브랜드와 인플루언서 간의 투명하고 공정한 거래를 보장합니다.
                </p>
              </div>
              <div className="text-center mission-item animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '100ms' }}>
                <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">데이터 기반</h3>
                <p className="text-gray-600">
                  정확한 데이터 분석으로 최적의 매칭과 성과를 제공합니다.
                </p>
              </div>
              <div className="text-center mission-item animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '200ms' }}>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">상호 성장</h3>
                <p className="text-gray-600">
                  모든 참여자가 함께 성장할 수 있는 생태계를 구축합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">우리의 이야기</h2>
            <div className="prose prose-lg mx-auto">
              <p className="text-gray-700 mb-6">
                2024년, 인플루언서 마케팅 시장의 불투명성과 비효율성을 해결하고자 LinkPick이 탄생했습니다.
                우리는 브랜드가 적합한 인플루언서를 찾기 어렵고, 인플루언서가 공정한 대우를 받지 못하는
                현실을 목격했습니다.
              </p>
              <p className="text-gray-700 mb-6">
                AI 기술과 빅데이터 분석을 결합하여, 우리는 양측 모두에게 이익이 되는 플랫폼을 만들었습니다.
                투명한 가격 정책, 정확한 성과 측정, 그리고 안전한 거래 시스템을 통해
                인플루언서 마케팅의 새로운 표준을 제시하고 있습니다.
              </p>
              <p className="text-gray-700">
                현재 50,000명 이상의 인플루언서와 2,500개 이상의 브랜드가 LinkPick을 통해
                성공적인 캠페인을 진행하고 있으며, 매달 30% 이상의 성장을 기록하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">핵심 가치</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg value-card animate-in fade-in slide-in-from-bottom-4 duration-600">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">신뢰</h3>
                </div>
                <p className="text-gray-600">
                  모든 거래와 데이터를 투명하게 공개하여 참여자 간의 신뢰를 구축합니다.
                  에스크로 시스템과 검증된 리뷰를 통해 안전한 거래를 보장합니다.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg value-card animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">혁신</h3>
                </div>
                <p className="text-gray-600">
                  최신 AI 기술과 데이터 분석을 활용하여 지속적으로 서비스를 개선합니다.
                  사용자 피드백을 적극 반영하여 더 나은 경험을 제공합니다.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg value-card animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">공정성</h3>
                </div>
                <p className="text-gray-600">
                  모든 참여자에게 공정한 기회를 제공하고, 합리적인 수수료 정책을 유지합니다.
                  크리에이터의 창의성과 브랜드의 가치를 동등하게 존중합니다.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg value-card animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">성장</h3>
                </div>
                <p className="text-gray-600">
                  플랫폼 참여자들의 지속적인 성장을 지원합니다. 교육 프로그램, 분석 도구,
                  네트워킹 기회를 제공하여 함께 발전합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">리더십 팀</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center team-member animate-in fade-in slide-in-from-bottom-4 duration-600">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" alt="CEO" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="text-xl font-bold mb-2">김민준</h3>
                <p className="text-cyan-600 font-medium mb-3">CEO & Co-founder</p>
                <p className="text-gray-600 text-sm">
                  전 네이버 마케팅 플랫폼 팀장<br />
                  10년간의 디지털 마케팅 경험
                </p>
              </div>
              <div className="text-center team-member animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '100ms' }}>
                <img src="https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=150&h=150&fit=crop&crop=face" alt="CTO" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="text-xl font-bold mb-2">이서연</h3>
                <p className="text-cyan-600 font-medium mb-3">CTO & Co-founder</p>
                <p className="text-gray-600 text-sm">
                  전 카카오 AI 연구소<br />
                  머신러닝 및 데이터 분석 전문가
                </p>
              </div>
              <div className="text-center team-member animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: '200ms' }}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" alt="COO" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="text-xl font-bold mb-2">박지호</h3>
                <p className="text-cyan-600 font-medium mb-3">COO</p>
                <p className="text-gray-600 text-sm">
                  전 쿠팡 사업개발 총괄<br />
                  이커머스 및 운영 전문가
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            함께 성장하고 싶으신가요?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            LinkPick과 함께 인플루언서 마케팅의 미래를 만들어갑니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              지금 시작하기
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-200">
              문의하기
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}