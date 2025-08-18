'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'

interface Campaign {
  id: string
  title: string
  brand: string
  brand_name?: string
  applicants: number
  maxApplicants: number
  deadline: number
  category: string
  categoryName?: string
  platforms: string[]
  description: string
  createdAt: string
  budget: string
  imageUrl?: string
  image_url?: string
  required_followers?: number
  applicant_count?: number
}

interface SectionSettings {
  count?: number;
  categorySlug?: string;
  categoryName?: string;
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

interface CategorySectionProps {
  section: Section;
  localizedContent: LocalizedContent;
  t: (key: string, fallback?: string) => string;
}

function CategorySection({ section, localizedContent, t }: CategorySectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  
  // 섹션 설정에서 카테고리 정보 가져오기
  const count = useMemo(() => section.settings?.count || 8, [section.settings?.count])
  const categorySlug = useMemo(() => section.settings?.categorySlug || 'hospital', [section.settings?.categorySlug])
  const categoryName = useMemo(() => section.settings?.categoryName || '병원', [section.settings?.categoryName])

  // 제목과 부제목 (다국어 지원)
  const title = useMemo(() => localizedContent?.title || section.title || `${categoryName} 캠페인`, [localizedContent?.title, section.title, categoryName])
  const subtitle = useMemo(() => localizedContent?.subtitle || section.subtitle || `${categoryName} 관련 캠페인을 만나보세요`, [localizedContent?.subtitle, section.subtitle, categoryName])

  const loadCategoryCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      
      // 카테고리별 캠페인 조회
      const response = await fetch(`/api/campaigns/simple?category=${categorySlug}&limit=${count}&status=active`)
      const data = await response.json()
      
      if (data.campaigns) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error(`Failed to load ${categorySlug} campaigns:`, error)
    } finally {
      setLoading(false)
    }
  }, [categorySlug, count])

  useEffect(() => {
    loadCategoryCampaigns()
  }, [loadCategoryCampaigns])

  // 플랫폼 아이콘
  const getPlatformIcon = (platform: string) => {
    switch(platform.toLowerCase()) {
      case 'instagram': return '📷'
      case 'youtube': return '🎥'
      case 'tiktok': return '🎵'
      case 'blog': return '✍️'
      default: return '📱'
    }
  }

  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
        </div>
        <Link 
          href={`/category/${categorySlug}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {campaigns.map((campaign) => {
            const imageUrl = campaign.image_url || campaign.imageUrl || '/images/campaigns/default.jpg'
            const brandName = campaign.brand_name || campaign.brand || 'Unknown'
            const applicantCount = campaign.applicant_count || campaign.applicants || 0
            const requiredFollowers = campaign.required_followers || 0

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative group cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                {/* 카테고리 뱃지 */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium">
                    {campaign.categoryName || categoryName}
                  </div>
                </div>

                {/* 마감일 뱃지 */}
                {campaign.deadline <= 7 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      D-{campaign.deadline}
                    </div>
                  </div>
                )}

                {/* 캠페인 이미지 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/images/campaigns/default.jpg'
                    }}
                  />
                </div>

                {/* 캠페인 정보 */}
                <div className="p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">{brandName}</p>
                  <h3 className="font-medium text-sm md:text-base text-gray-900 line-clamp-2 mb-2">
                    {campaign.title}
                  </h3>
                  
                  {/* 플랫폼 & 통계 */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex gap-1">
                      {campaign.platforms?.slice(0, 2).map((platform: string) => (
                        <span key={platform}>
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {requiredFollowers > 0 && (
                        <span>{requiredFollowers.toLocaleString()}+</span>
                      )}
                      <span>{applicantCount}명 지원</span>
                    </div>
                  </div>

                  {/* 예산 */}
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm md:text-base font-bold text-gray-900">
                      ₩{parseInt(campaign.budget).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">{categoryName} 캠페인이 없습니다.</p>
          <Link 
            href="/campaigns"
            className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            전체 캠페인 보기
          </Link>
        </div>
      )}
    </div>
  )
}

export default memo(CategorySection)