'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUserData } from '@/contexts/UserDataContext'
import { useCampaignData } from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import PageLayout from '@/components/layouts/PageLayout'
import CampaignApplyModal from '@/components/campaign/CampaignApplyModal'
import CampaignSidebar from '@/components/campaign/CampaignSidebar'
import CampaignHeader from '@/components/campaign/CampaignHeader'
import CampaignTabs from '@/components/campaign/CampaignTabs'

interface CampaignQuestion {
  id: string
  question: string
  type: string
  required: boolean
  options?: any
  order?: number
}

interface Campaign {
  id: string
  title: string
  description: string
  business: {
    id: string
    name: string
    logo: string | null
    category: string
  }
  categories?: Array<{
    id: string
    categoryId: string
    isPrimary: boolean
    category: {
      id: string
      name: string
      slug: string
      level: number
    }
  }>
  platforms: string[]
  budget: number | { amount: number; type: string; currency: string }
  budgetType?: string
  targetFollowers: number
  maxApplicants: number
  startDate: string
  endDate: string
  requirements: string | null
  hashtags: string[]
  imageUrl: string | null
  headerImageUrl: string | null
  thumbnailImageUrl: string | null
  detailImages: string[]
  productImages: string[] | null
  status: string
  createdAt: string
  applicationStartDate?: string | null
  applicationEndDate?: string | null
  contentStartDate?: string | null
  contentEndDate?: string | null
  resultAnnouncementDate?: string | null
  provisionDetails?: string | null
  campaignMission?: string | null
  keywords?: string | null
  additionalNotes?: string | null
  announcementDate?: string | null
  _count: {
    applications: number
    likes: number
  }
  applications?: Array<{
    id: string
    status: string
    influencer: {
      id: string
      name: string
      profileImage: string | null
    }
  }>
  isLiked?: boolean
  hasApplied?: boolean
  applicationStatus?: string
  campaignQuestions?: CampaignQuestion[]
  target?: {
    followers?: {
      min?: number
      max?: number
    }
    maxApplicants?: number
  }
  schedule?: {
    application?: {
      startDate?: string
      endDate?: string
    }
    campaign?: {
      startDate?: string
      endDate?: string
    }
    content?: {
      startDate?: string
      endDate?: string
    }
    announcement?: {
      date?: string
      resultDate?: string
    }
  }
  media?: {
    images?: any
  }
  content?: {
    requirements?: string
    provisionDetails?: string
    mission?: string
    keywords?: string[]
    additionalNotes?: string
    hashtags?: string[]
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { profileData } = useUserData()
  
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const {
    data: campaign,
    isLoading,
    error,
    refetch: refetchCampaign
  } = useCampaignData(params.id as string)

  useEffect(() => {
    if (campaign) {
      setIsLiked(campaign.isLiked || false)
      setLikeCount(campaign._count?.likes || 0)
    }
  }, [campaign])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '관심 캠페인 추가를 위해 로그인이 필요합니다.',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      setIsLiked(data.saved !== false)
      setLikeCount(data.likeCount || 0)
      
      invalidateCache(`campaign_${params.id}_${user?.id}`)
      
      for (let page = 1; page <= 10; page++) {
        invalidateCache(`saved_campaigns_${user?.id}_${page}_20`)
      }
      
      toast({
        title: data.saved !== false ? '관심 캠페인 추가' : '관심 캠페인 제거',
        description: data.saved !== false ? '마이페이지에서 확인할 수 있습니다.' : ''
      })
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '좋아요 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleApplySuccess = () => {
    setShowApplyModal(false)
    invalidateCache(`campaign_${params.id}_${user?.id}`)
    refetchCampaign()
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast({
        title: '링크 복사됨',
        description: '캠페인 링크가 클립보드에 복사되었습니다.'
      })
    }
  }

  const calculateDaysLeft = (endDate: string) => {
    if (!endDate || endDate === 'null' || endDate === 'undefined') return 0;
    
    const end = new Date(endDate)
    if (isNaN(end.getTime())) return 0;
    
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const daysLeft = useMemo(() => {
    if (!campaign) return 0
    
    let applicationEndDate: string | null = null
    let campaignEndDate: string | null = null
    
    if (campaign.schedule?.application?.endDate) {
      applicationEndDate = campaign.schedule.application.endDate
    }
    if (campaign.schedule?.campaign?.endDate) {
      campaignEndDate = campaign.schedule.campaign.endDate
    }
    
    if (!applicationEndDate && campaign.applicationEndDate && 
        campaign.applicationEndDate !== 'null' && 
        campaign.applicationEndDate !== 'undefined' &&
        campaign.applicationEndDate.trim() !== '') {
      applicationEndDate = campaign.applicationEndDate
    }
    if (!campaignEndDate && campaign.endDate) {
      campaignEndDate = campaign.endDate
    }
    
    const relevantEndDate = applicationEndDate || campaignEndDate
    
    return relevantEndDate ? calculateDaysLeft(relevantEndDate) : 0
  }, [campaign?.schedule?.application?.endDate, campaign?.applicationEndDate, campaign?.endDate, campaign?.id])

  const applicationHasStarted = useMemo(() => {
    if (!campaign?.applicationStartDate) return true
    const startDate = new Date(campaign.applicationStartDate)
    const now = new Date()
    return now >= startDate
  }, [campaign?.applicationStartDate])

  const isApplicationPeriodActive = useMemo(() => {
    return applicationHasStarted && daysLeft > 0
  }, [applicationHasStarted, daysLeft])
  
  const applicationProgress = useMemo(() => {
    if (!campaign) return 0
    const maxApplicants = campaign.target?.maxApplicants || campaign.maxApplicants || 1
    return ((campaign._count?.applications || 0) / maxApplicants) * 100
  }, [campaign?._count?.applications, campaign?.target?.maxApplicants, campaign?.maxApplicants])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!campaign) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
            <Button asChild>
              <Link href="/campaigns">캠페인 목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        <CampaignHeader
          campaign={campaign}
          isLiked={isLiked}
          onShare={handleShare}
          onLike={handleLike}
        />

        {/* 메인 컨텐츠 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 캠페인 정보 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <CampaignTabs campaign={campaign} />
              </div>
            </div>

            {/* 오른쪽: 사이드바 */}
            <div className="space-y-6">
              <CampaignSidebar
                campaign={campaign}
                user={user}
                isLiked={isLiked}
                likeCount={likeCount}
                daysLeft={daysLeft}
                applicationProgress={applicationProgress}
                applicationHasStarted={applicationHasStarted}
                isApplicationPeriodActive={isApplicationPeriodActive}
                onApplyClick={() => setShowApplyModal(true)}
                onLikeClick={handleLike}
              />
            </div>
          </div>
        </div>
      </div>

      <CampaignApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        campaign={campaign}
        onSuccess={handleApplySuccess}
      />
    </PageLayout>
  )
}