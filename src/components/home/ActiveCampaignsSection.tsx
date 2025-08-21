'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Users, Star, Clock, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useState, useEffect } from 'react'

// JSON 파일에서 오는 정적 캠페인 데이터
interface StaticCampaign {
  id: string
  title: {
    ko: string
    en: string
    jp: string
  }
  brand: string
  category: string
  image: string
  thumbnail: string
  description: {
    ko: string
    en: string
    jp: string
  }
  reward: {
    type: 'cash' | 'product'
    value: string
    valueEn: string
    valueJp: string
  }
  participants: number
  maxParticipants: number
  dueDate: string
  tags: string[]
  isHot: boolean
  isNew: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

// 데이터베이스에서 오는 실제 캠페인 데이터
interface DbCampaign {
  id: string
  rank: number
  title: string
  brand: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  platforms: string[]
  description: string
  createdAt: string
  budget: string
  imageUrl?: string
}

interface ActiveCampaignsSectionProps {
  data: {
    title: {
      ko: string
      en: string
      jp: string
    }
    subtitle: {
      ko: string
      en: string
      jp: string
    }
    sectionName?: {
      ko: string
      en: string
      jp: string
    }
    viewMore: {
      ko: string
      en: string
      jp: string
    }
    campaigns: StaticCampaign[] // 정적 데이터 (폴백용)
  }
}

export default function ActiveCampaignsSection({ data }: ActiveCampaignsSectionProps) {
  const { language } = useLanguage()
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데이터베이스에서 실제 캠페인 데이터 가져오기
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/home/campaigns?filter=all&limit=8')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.campaigns) {
          setDbCampaigns(result.campaigns)
        } else {
          console.warn('No campaigns found in response:', result)
          setDbCampaigns([])
        }
      } catch (err) {
        console.error('Failed to fetch campaigns:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        setDbCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    const difficultyTexts = {
      easy: { ko: '쉬움', en: 'Easy', jp: '簡単' },
      medium: { ko: '보통', en: 'Medium', jp: '普通' },
      hard: { ko: '어려움', en: 'Hard', jp: '難しい' }
    }
    return difficultyTexts[difficulty]?.[language] || difficulty
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : language === 'jp' ? 'ja-JP' : 'en-US')
  }

  return (
    <section className="py-16 bg-white">
      {/* 섹션명 - 관리자에서 설정 가능 */}
      {data.sectionName && (
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 text-left">
            {data.sectionName[language]}
          </h2>
        </div>
      )}

      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {data.title[language]}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {data.subtitle[language]}
          </p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">캠페인을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">캠페인을 불러오는데 실패했습니다</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {/* 캠페인 그리드 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* 데이터베이스 캠페인이 있으면 우선 표시 */}
            {dbCampaigns.length > 0 ? (
              dbCampaigns.map((campaign) => (
                <Link 
                  key={campaign.id} 
                  href={`/campaigns/${campaign.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] hover:-translate-y-1 h-[480px] flex flex-col">
                    {/* 캠페인 이미지 */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {campaign.imageUrl && !campaign.imageUrl.includes('picsum.photos') && !campaign.imageUrl.includes('loremflickr.com') ? (
                        <Image
                          src={campaign.imageUrl}
                          alt={campaign.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">이미지 없음</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 배지들 */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {campaign.deadline <= 7 && (
                          <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                            🔥 마감임박
                          </span>
                        )}
                        {new Date(campaign.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                          <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* 참여 현황 */}
                      <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                        <Users className="w-4 h-4 inline mr-1" />
                        {campaign.applicants}/{campaign.maxApplicants}
                      </div>
                    </div>

                    {/* 캠페인 정보 */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex-1">
                        {/* 브랜드 */}
                        <div className="text-sm text-gray-500 mb-2 font-medium">{campaign.brand}</div>

                        {/* 제목 */}
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                          {campaign.title}
                        </h3>

                        {/* 설명 */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {campaign.description}
                        </p>
                      </div>

                      <div className="mt-auto">
                        {/* 리워드 */}
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-base font-bold text-gray-900">
                            {campaign.budget}
                          </span>
                        </div>

                        {/* 마감일과 카테고리 */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {campaign.deadline === 0 ? '오늘 마감' : `${campaign.deadline}일 남음`}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                            #{campaign.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // 데이터베이스 캠페인이 없으면 정적 데이터 표시
              data.campaigns.map((campaign) => (
            <Link 
              key={campaign.id} 
              href={`/campaigns/${campaign.id}`}
              className="group block"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] hover:-translate-y-1 h-[480px] flex flex-col">
                {/* 캠페인 이미지 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={campaign.thumbnail}
                    alt={campaign.title[language]}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  
                  {/* 배지들 */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {campaign.isNew && (
                      <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                        NEW
                      </span>
                    )}
                    {campaign.isHot && (
                      <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                        🔥 HOT
                      </span>
                    )}
                  </div>

                  {/* 난이도 배지 */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 text-sm font-bold rounded-full shadow-lg ${getDifficultyColor(campaign.difficulty)}`}>
                      {getDifficultyText(campaign.difficulty)}
                    </span>
                  </div>

                  {/* 참여 현황 */}
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                    <Users className="w-4 h-4 inline mr-1" />
                    {campaign.participants}/{campaign.maxParticipants}
                  </div>
                </div>

                {/* 캠페인 정보 */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                    {/* 브랜드 */}
                    <div className="text-sm text-gray-500 mb-2 font-medium">{campaign.brand}</div>

                    {/* 제목 */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {campaign.title[language]}
                    </h3>

                    {/* 설명 */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {campaign.description[language]}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {/* 리워드 */}
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-base font-bold text-gray-900">
                        {language === 'ko' ? campaign.reward.value : 
                         language === 'en' ? campaign.reward.valueEn : 
                         campaign.reward.valueJp}
                      </span>
                    </div>

                    {/* 마감일과 카테고리 */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{formatDate(campaign.dueDate)}</span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                        #{campaign.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
              ))
            )}
          </div>
        )}

        {/* 캠페인이 없을 때 */}
        {!loading && !error && dbCampaigns.length === 0 && data.campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">진행중인 캠페인이 없습니다</h3>
            <p className="text-gray-500 mb-6">새로운 캠페인이 곧 등록될 예정입니다.</p>
            <Link 
              href="/campaigns"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              모든 캠페인 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 더보기 버튼 */}
        {!loading && !error && (dbCampaigns.length > 0 || data.campaigns.length > 0) && (
          <div className="text-center">
            <Link 
              href="/campaigns"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {data.viewMore[language]}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}