'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'

interface Campaign {
  id: string
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
  rank?: number
}

interface SectionSettings {
  count?: number;
  period?: string;
  sortBy?: string;
}

interface Section {
  title?: string;
  subtitle?: string;
  settings?: SectionSettings;
}

interface LocalizedContent {
  title?: string;
  subtitle?: string;
}

interface RankingSectionProps {
  section: Section;
  localizedContent: LocalizedContent;
  t: (key: string, fallback?: string) => string;
}

function RankingSection({ section, localizedContent, t }: RankingSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  // 섹션 설정에서 개수와 기준 가져오기 - 메모이제이션
  const count = useMemo(() => section.settings?.count || 4, [section.settings?.count])
  const criteria = useMemo(() => 'popular', [])
  const showBadge = useMemo(() => true, [])

  // 제목과 부제목 (다국어 지원) - 메모이제이션
  const title = useMemo(() => localizedContent?.title || section.title || '인기 랭킹', [localizedContent?.title, section.title])
  const subtitle = useMemo(() => localizedContent?.subtitle || section.subtitle || '실시간 인기 캠페인', [localizedContent?.subtitle, section.subtitle])

  // 랭킹별 모서리 컬러 및 뱃지 색상 - 메모이제이션
  const getRankStyles = useCallback((rank: number) => {
    switch (rank) {
      case 1: 
        return {
          borderColor: 'border-l-orange-500',
          badgeColor: 'bg-orange-500 text-white',
          borderWidth: 'border-l-4'
        }
      case 2: 
        return {
          borderColor: 'border-l-orange-400',
          badgeColor: 'bg-orange-400 text-white', 
          borderWidth: 'border-l-4'
        }
      case 3: 
        return {
          borderColor: 'border-l-orange-300',
          badgeColor: 'bg-orange-300 text-white',
          borderWidth: 'border-l-4'
        }
      case 4:
        return {
          borderColor: 'border-l-orange-200',
          badgeColor: 'bg-orange-200 text-white',
          borderWidth: 'border-l-4'
        }
      default: 
        return {
          borderColor: 'border-l-gray-200',
          badgeColor: 'bg-gray-500 text-white',
          borderWidth: 'border-l-2'
        }
    }
  }, [])

  const loadRankingCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      // 랭킹 기준에 따라 API 호출
      const sortParam = criteria === 'popular' ? 'applicants' : 
                       criteria === 'deadline' ? 'deadline' : 
                       criteria === 'reward' ? 'budget' : 'applicants'
      
      const response = await fetch(`/api/campaigns?status=active&limit=${count}&sort=${sortParam}&ranking=true`)
      const data = await response.json()
      
      if (data.campaigns) {
        // 랭킹 번호 추가
        const rankedCampaigns = data.campaigns.map((campaign: Campaign, index: number) => ({
          ...campaign,
          rank: index + 1
        }))
        setCampaigns(rankedCampaigns)
      }
    } catch (error) {
      console.error('Failed to load ranking campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [criteria, count])

  useEffect(() => {
    loadRankingCampaigns()
  }, [loadRankingCampaigns])


  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
        </div>
        <Link 
          href={`/campaigns?sort=${criteria === 'popular' ? 'applicants' : criteria}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {campaigns.map((campaign) => {
            const rankStyles = campaign.rank ? getRankStyles(campaign.rank) : getRankStyles(0)
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all relative cursor-pointer hover:scale-105`}
                style={{ pointerEvents: 'auto' }}
              >
                {/* 랭킹 뱃지 */}
                {showBadge && campaign.rank && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className={`px-2 py-1 flex items-center justify-center text-sm font-bold ${rankStyles.badgeColor} min-w-[24px] h-6`}>
                      {campaign.rank}
                    </div>
                  </div>
                )}

              {/* 캠페인 이미지 */}
              <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {campaign.imageUrl && (
                  <img 
                    src={campaign.imageUrl} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 right-3">
                  <span className="bg-white px-2 py-1 rounded text-xs font-medium">
                    D-{campaign.deadline}
                  </span>
                </div>
              </div>

              {/* 캠페인 정보 */}
              <div className="p-2 md:p-3">
                <p className="text-xs text-gray-600 mb-1 truncate">{campaign.brand}</p>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-xs md:text-sm leading-tight">
                  {campaign.title}
                </h3>
                
                {/* 통계 정보 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-xs">
                      {campaign.applicants}/{campaign.maxApplicants}명
                    </span>
                    <span className="text-blue-600 font-medium text-xs">
                      {campaign.budget}
                    </span>
                  </div>
                  
                  {/* 인기도 표시 (신청자 수 기준) */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ 
                        width: `${Math.min((campaign.applicants / campaign.maxApplicants) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500">표시할 랭킹 캠페인이 없습니다.</p>
        </div>
      )}

      {/* 랭킹 기준 표시 */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {criteria === 'popular' && '신청자 수 기준 인기 랭킹'}
          {criteria === 'deadline' && '마감임박 순 랭킹'}
          {criteria === 'reward' && '리워드 높은 순 랭킹'}
          {criteria === 'participants' && '참여자 많은 순 랭킹'}
        </p>
      </div>
    </div>
  )
}

// React.memo로 성능 최적화
export default memo(RankingSection)