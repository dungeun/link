'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

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

interface RankingSectionProps {
  section: any
  localizedContent: any
  t: (key: string, fallback?: string) => string
}

export default function RankingSection({ section, localizedContent, t }: RankingSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  // 섹션 설정에서 개수와 기준 가져오기
  const count = section.settings?.count || 5
  const criteria = section.settings?.criteria || 'popular'
  const showBadge = section.settings?.showBadge !== false

  // 제목과 부제목 (다국어 지원)
  const title = localizedContent?.title || section.title || '인기 랭킹'
  const subtitle = localizedContent?.subtitle || section.subtitle || '실시간 인기 캠페인'

  const loadRankingCampaigns = async () => {
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
  }

  useEffect(() => {
    loadRankingCampaigns()
  }, [criteria, count])

  // 랭킹 뱃지 색상
  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-white' // 금
      case 2: return 'bg-gray-400 text-white'  // 은
      case 3: return 'bg-amber-600 text-white' // 동
      default: return 'bg-blue-500 text-white'
    }
  }

  // 랭킹 아이콘
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return rank.toString()
    }
  }

  if (!section.visible) return null

  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        <Link 
          href={`/campaigns?sort=${criteria === 'popular' ? 'applicants' : criteria}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative"
            >
              {/* 랭킹 뱃지 */}
              {showBadge && campaign.rank && (
                <div className="absolute top-3 left-3 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(campaign.rank)}`}>
                    {campaign.rank <= 3 ? getRankIcon(campaign.rank) : campaign.rank}
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
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                    D-{campaign.deadline}
                  </span>
                </div>
              </div>

              {/* 캠페인 정보 */}
              <div className="p-3">
                <p className="text-xs text-gray-600 mb-1">{campaign.brand}</p>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                  {campaign.title}
                </h3>
                
                {/* 통계 정보 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {campaign.applicants}/{campaign.maxApplicants}명
                    </span>
                    <span className="text-blue-600 font-medium">
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
          ))}
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