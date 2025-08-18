'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import CampaignCard from '@/components/CampaignCard'

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
}

interface SectionSettings {
  count?: number;
  showViewAll?: boolean;
  gridLayout?: string;
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

interface ActiveCampaignsSectionProps {
  section: Section;
  localizedContent: LocalizedContent;
  t: (key: string, fallback?: string) => string;
}

function ActiveCampaignsSection({ section, localizedContent, t }: ActiveCampaignsSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  // 섹션 설정에서 값들 가져오기 - 메모이제이션
  const count = useMemo(() => section.settings?.count || 8, [section.settings?.count])
  const showViewAll = useMemo(() => section.settings?.showViewAll ?? true, [section.settings?.showViewAll])
  const gridLayout = useMemo(() => section.settings?.gridLayout || '2x4', [section.settings?.gridLayout])

  // 제목과 부제목 (다국어 지원) - 메모이제이션
  const title = useMemo(() => localizedContent?.title || section.title || '진행 중인 캠페인', [localizedContent?.title, section.title])
  const subtitle = useMemo(() => localizedContent?.subtitle || section.subtitle || '지금 참여할 수 있는 캠페인', [localizedContent?.subtitle, section.subtitle])

  // 그리드 클래스 계산 - 메모이제이션
  const gridClasses = useMemo(() => {
    switch (gridLayout) {
      case '2x3':
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
      case '1x2':
        return 'grid-cols-1 md:grid-cols-2'
      default: // '2x4'
        return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
    }
  }, [gridLayout])

  const loadActiveCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns?status=active&limit=${count}&sort=latest`)
      const data = await response.json()
      
      if (data.campaigns) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Failed to load active campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [count])

  useEffect(() => {
    loadActiveCampaigns()
  }, [loadActiveCampaigns])

  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {showViewAll && (
          <Link 
            href="/campaigns"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
          >
            {t('homepage.campaigns.viewAll', '전체보기')} →
          </Link>
        )}
      </div>

      {loading ? (
        <div className={`grid ${gridClasses} gap-4 md:gap-6`}>
          {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className={`grid ${gridClasses} gap-4 md:gap-6`}>
          {campaigns.slice(0, count).map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500">{t('homepage.campaigns.noCampaigns', '진행 중인 캠페인이 없습니다.')}</p>
        </div>
      )}
    </div>
  )
}

// React.memo로 성능 최적화
export default memo(ActiveCampaignsSection)