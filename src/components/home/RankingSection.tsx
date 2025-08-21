'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Medal, Award, Users, Calendar, Star, Zap } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useState, useEffect } from 'react'

// JSON 파일에서 오는 정적 랭킹 데이터
interface StaticRankingCampaign {
  id: string
  rank: number
  title: {
    ko: string
    en: string
    jp: string
  }
  brand: string
  category: string
  image: string
  participants: number
  dueDate: string
  isHot: boolean
}

// 데이터베이스에서 오는 실제 캠페인 데이터 (인기순)
interface DbRankingCampaign {
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

interface RankingSectionProps {
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
    campaigns: StaticRankingCampaign[] // 정적 데이터 (폴백용)
  }
}

export default function RankingSection({ data }: RankingSectionProps) {
  const { currentLanguage: language } = useLanguage()
  const [dbCampaigns, setDbCampaigns] = useState<DbRankingCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // 실시간 인기 캠페인 데이터 가져오기
  const fetchPopularCampaigns = async () => {
    try {
      const response = await fetch('/api/home/campaigns?filter=popular&limit=10')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.campaigns) {
        setDbCampaigns(result.campaigns)
        setLastUpdated(new Date())
      } else {
        console.warn('No popular campaigns found in response:', result)
        setDbCampaigns([])
      }
    } catch (err) {
      console.error('Failed to fetch popular campaigns:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setDbCampaigns([])
    }
  }

  // 초기 로드 및 30초마다 실시간 업데이트
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchPopularCampaigns()
      setLoading(false)
    }

    loadData()

    // 30초마다 실시간 업데이트
    const interval = setInterval(() => {
      fetchPopularCampaigns()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getRankIcon = (rank: number) => {
    return <span className="text-lg font-bold text-gray-700">{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    return 'bg-white border border-gray-200 text-gray-700'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) {
      return language === 'ko' ? '마감' : language === 'en' ? 'Closed' : '마감'
    } else if (diffDays === 1) {
      return language === 'ko' ? 'D-1' : language === 'en' ? '1 day left' : 'D-1'
    } else {
      return language === 'ko' ? `D-${diffDays}` : language === 'en' ? `${diffDays} days left` : `D-${diffDays}`
    }
  }

  const formatDeadline = (deadline: number) => {
    if (deadline === 0) {
      return language === 'ko' ? '오늘 마감' : language === 'en' ? 'Due today' : '오늘 마감'
    } else if (deadline === 1) {
      return language === 'ko' ? 'D-1' : language === 'en' ? '1 day left' : 'D-1'
    } else {
      return language === 'ko' ? `D-${deadline}` : language === 'en' ? `${deadline} days left` : `D-${deadline}`
    }
  }

  const formatLastUpdated = () => {
    const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)
    if (diff < 60) return `${diff}초 전 업데이트`
    const minutes = Math.floor(diff / 60)
    return `${minutes}분 전 업데이트`
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl font-bold text-gray-900">
              {data.title[language]}
            </h2>
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            {data.subtitle[language]}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>실시간 업데이트 • {formatLastUpdated()}</span>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">인기 캠페인을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">인기 캠페인을 불러오는데 실패했습니다</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        )}

        {/* 랭킹 리스트 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* 데이터베이스 캠페인이 있으면 우선 표시 */}
            {dbCampaigns.length > 0 ? (
              dbCampaigns.map((campaign, index) => (
                <Link 
                  key={campaign.id} 
                  href={`/campaigns/${campaign.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]">
                    <div className="flex items-center p-6">
                      {/* 랭킹 번호와 아이콘 */}
                      <div className="flex-shrink-0 mr-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(campaign.rank)}`}>
                          {getRankIcon(campaign.rank)}
                        </div>
                      </div>

                      {/* 캠페인 이미지 */}
                      <div className="flex-shrink-0 mr-6">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          {campaign.imageUrl && !campaign.imageUrl.includes('picsum.photos') && !campaign.imageUrl.includes('loremflickr.com') ? (
                            <Image
                              src={campaign.imageUrl}
                              alt={campaign.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Trophy className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                          {campaign.deadline <= 7 && (
                            <div className="absolute top-1 right-1">
                              <span className="px-1 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">
                                🔥
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 캠페인 정보 */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            {/* 브랜드 */}
                            <div className="text-sm text-gray-500 mb-1">{campaign.brand}</div>
                            
                            {/* 제목 */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {campaign.title}
                            </h3>

                            {/* 통계 정보 */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>
                                  {language === 'ko' ? `${campaign.applicants}명 참여` :
                                   language === 'en' ? `${campaign.applicants} participants` :
                                   `${campaign.applicants}명 참여`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDeadline(campaign.deadline)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">
                                  #{campaign.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 순위 표시 */}
                          <div className="flex-shrink-0 ml-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                #{campaign.rank}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {language === 'ko' ? '순위' : language === 'en' ? 'Rank' : '순위'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // 데이터베이스 캠페인이 없으면 정적 데이터 표시
              data.campaigns.map((campaign, index) => (
            <Link 
              key={campaign.id} 
              href={`/campaigns/${campaign.id}`}
              className="group block"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01]">
                <div className="flex items-center p-6">
                  {/* 랭킹 번호와 아이콘 */}
                  <div className="flex-shrink-0 mr-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(campaign.rank)}`}>
                      {getRankIcon(campaign.rank)}
                    </div>
                  </div>

                  {/* 캠페인 이미지 */}
                  <div className="flex-shrink-0 mr-6">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {campaign.image ? (
                        <Image
                          src={campaign.image}
                          alt={campaign.title[language]}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Trophy className="w-8 h-8 opacity-50" />
                        </div>
                      )}
                      {campaign.isHot && (
                        <div className="absolute top-1 right-1">
                          <span className="px-1 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">
                            🔥
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 캠페인 정보 */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        {/* 브랜드 */}
                        <div className="text-sm text-gray-500 mb-1">{campaign.brand}</div>
                        
                        {/* 제목 */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {campaign.title[language]}
                        </h3>

                        {/* 통계 정보 */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>
                              {language === 'ko' ? `${campaign.participants}명 참여` :
                               language === 'en' ? `${campaign.participants} participants` :
                               `${campaign.participants}명 참여`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(campaign.dueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">
                              #{campaign.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 순위 표시 */}
                      <div className="flex-shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            #{campaign.rank}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {language === 'ko' ? '순위' : language === 'en' ? 'Rank' : '순위'}
                          </div>
                        </div>
                      </div>
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
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">인기 캠페인이 없습니다</h3>
            <p className="text-gray-500 mb-6">참여자가 많은 캠페인이 등록되면 여기에 표시됩니다.</p>
          </div>
        )}

        {/* 더보기 버튼 */}
        {!loading && !error && (dbCampaigns.length > 0 || data.campaigns.length > 0) && (
          <div className="text-center mt-12">
            <Link 
              href="/campaigns?sort=popular"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Trophy className="w-4 h-4" />
              {language === 'ko' ? '전체 랭킹 보기' : 
               language === 'en' ? 'View All Rankings' : 
               '全てのランキングを見る'}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}