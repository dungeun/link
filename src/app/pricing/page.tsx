'use client'

import Link from 'next/link'
import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans = {
    business: [
      {
        name: 'Starter',
        description: '소규모 브랜드를 위한 시작 플랜',
        monthlyPrice: 99000,
        yearlyPrice: 990000,
        features: [
          '월 5개 캠페인 생성',
          '기본 인플루언서 검색',
          '기본 성과 분석',
          '이메일 지원',
          '에스크로 결제'
        ],
        notIncluded: [
          'AI 매칭 추천',
          '고급 분석 리포트',
          '전담 매니저'
        ]
      },
      {
        name: 'Professional',
        description: '성장하는 브랜드를 위한 전문가 플랜',
        monthlyPrice: 299000,
        yearlyPrice: 2990000,
        popular: true,
        features: [
          '월 20개 캠페인 생성',
          'AI 인플루언서 매칭',
          '상세 성과 분석',
          '우선 지원',
          '에스크로 결제',
          '캠페인 템플릿',
          '실시간 모니터링'
        ],
        notIncluded: [
          '전담 매니저',
          'API 연동'
        ]
      },
      {
        name: 'Enterprise',
        description: '대규모 브랜드를 위한 맞춤형 솔루션',
        monthlyPrice: 'custom',
        yearlyPrice: 'custom',
        features: [
          '무제한 캠페인 생성',
          'AI 인플루언서 매칭',
          '고급 분석 및 인사이트',
          '24/7 우선 지원',
          '에스크로 결제',
          '전담 계정 매니저',
          'API 연동 지원',
          '맞춤형 리포트',
          '팀 협업 도구'
        ],
        notIncluded: []
      }
    ],
    influencer: [
      {
        name: 'Basic',
        description: '이제 막 시작하는 인플루언서를 위한 플랜',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
          '프로필 등록',
          '캠페인 지원',
          '기본 포트폴리오',
          '기본 통계',
          '수수료 15%'
        ],
        notIncluded: [
          '우선 매칭',
          '성장 분석',
          '교육 콘텐츠'
        ]
      },
      {
        name: 'Pro',
        description: '전문 인플루언서를 위한 프리미엄 플랜',
        monthlyPrice: 29000,
        yearlyPrice: 290000,
        popular: true,
        features: [
          '프로필 최적화',
          '우선 캠페인 매칭',
          '상세 포트폴리오',
          '성장 분석 도구',
          '수수료 10%',
          '전문가 교육 콘텐츠',
          '1:1 컨설팅 (월 1회)'
        ],
        notIncluded: []
      }
    ]
  }

  const faqs = [
    {
      question: '무료 체험이 가능한가요?',
      answer: '네, 모든 유료 플랜은 14일 무료 체험이 가능합니다. 신용카드 등록 없이 바로 시작할 수 있습니다.'
    },
    {
      question: '플랜 변경이 자유로운가요?',
      answer: '언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경사항은 다음 결제일부터 적용됩니다.'
    },
    {
      question: '수수료는 어떻게 책정되나요?',
      answer: '브랜드는 월 구독료만 지불하며, 인플루언서는 캠페인 성사 시 수수료를 지불합니다. Basic 플랜은 15%, Pro 플랜은 10%입니다.'
    },
    {
      question: '환불 정책은 어떻게 되나요?',
      answer: '구독 시작 후 7일 이내 100% 환불이 가능합니다. 연간 결제의 경우 사용하지 않은 기간에 대해 일할 계산하여 환불해드립니다.'
    },
    {
      question: 'Enterprise 플랜 견적은 어떻게 받나요?',
      answer: '문의하기를 통해 귀사의 요구사항을 알려주시면, 맞춤형 견적을 제공해드립니다.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              합리적인 가격으로
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                최고의 가치를
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              규모와 목적에 맞는 플랜을 선택하세요
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                월간 결제
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                연간 결제
                <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  2개월 무료
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Plans */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">비즈니스 플랜</h2>
            <p className="text-gray-600">브랜드를 위한 맞춤형 솔루션</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.business.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 ${
                  plan.popular ? 'ring-2 ring-cyan-500' : ''
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      가장 인기
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    {plan.monthlyPrice === 'custom' ? (
                      <div className="text-4xl font-bold">맞춤 견적</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">
                          ₩{(billingCycle === 'monthly' 
                            ? (typeof plan.monthlyPrice === 'number' ? plan.monthlyPrice : 0)
                            : (typeof plan.yearlyPrice === 'number' ? plan.yearlyPrice / 12 : 0)
                          ).toLocaleString()}
                        </div>
                        <div className="text-gray-500">
                          {billingCycle === 'monthly' ? '/월' : '/월 (연간 결제)'}
                        </div>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start opacity-50">
                        <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.monthlyPrice === 'custom' ? '/contact' : '/register?type=business'}
                    className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.monthlyPrice === 'custom' ? '문의하기' : '시작하기'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Influencer Plans */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">인플루언서 플랜</h2>
            <p className="text-gray-600">크리에이터를 위한 성장 파트너</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.influencer.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card relative bg-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 ${
                  plan.popular ? 'ring-2 ring-cyan-500' : ''
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      추천
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold">
                      {plan.monthlyPrice === 0 ? '무료' : `₩${(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12).toLocaleString()}`}
                    </div>
                    {plan.monthlyPrice !== 0 && (
                      <div className="text-gray-500">
                        {billingCycle === 'monthly' ? '/월' : '/월 (연간 결제)'}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start opacity-50">
                        <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register?type=influencer"
                    className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    시작하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">모든 플랜에 포함</h2>
            <p className="text-gray-600">기본적으로 제공되는 핵심 기능들</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">안전한 거래</h3>
              <p className="text-gray-600 text-sm">에스크로 시스템으로 안전한 거래 보장</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">실시간 분석</h3>
              <p className="text-gray-600 text-sm">캠페인 성과를 실시간으로 확인</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">고객 지원</h3>
              <p className="text-gray-600 text-sm">전문 팀의 신속한 지원</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2">AI 기술</h3>
              <p className="text-gray-600 text-sm">최신 AI로 최적의 매칭</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item bg-white rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-600" style={{ animationDelay: `${index * 100}ms` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            14일 무료 체험을 시작하세요
          </h2>
          <p className="text-xl text-white/80 mb-8">
            신용카드 없이 바로 시작할 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=business" 
              className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              브랜드로 시작하기
            </Link>
            <Link 
              href="/register?type=influencer" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              인플루언서로 시작하기
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}