'use client'

import { memo, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Heart,
  Share2,
  Instagram,
  Youtube,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface CampaignDetailProps {
  campaign: any
  relatedCampaigns?: any[]
  onApply?: () => void
  onLike?: () => void
  onShare?: () => void
  isLiked?: boolean
  hasApplied?: boolean
}

/**
 * 최적화된 캠페인 상세 컴포넌트
 * 메모이제이션과 레이지 로딩 적용
 */
const OptimizedCampaignDetail = memo(({
  campaign,
  relatedCampaigns = [],
  onApply,
  onLike,
  onShare,
  isLiked = false,
  hasApplied = false
}: CampaignDetailProps) => {
  
  // 날짜 계산 메모이제이션
  const dateInfo = useMemo(() => {
    const now = new Date()
    const end = new Date(campaign.endDate)
    const start = new Date(campaign.startDate)
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100))
    
    return { daysLeft, totalDays, progress }
  }, [campaign.endDate, campaign.startDate])
  
  // 플랫폼 아이콘 렌더링
  const getPlatformIcon = useCallback((platform: string) => {
    switch(platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-5 h-5" />
      case 'youtube':
        return <Youtube className="w-5 h-5" />
      case 'tiktok':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
          </svg>
        )
      default:
        return null
    }
  }, [])
  
  // 신청률 계산
  const applicationRate = useMemo(() => {
    if (!campaign.maxApplicants) return 0
    return Math.min(100, (campaign.applicationCount / campaign.maxApplicants) * 100)
  }, [campaign.applicationCount, campaign.maxApplicants])
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 이미지 */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gray-100 mb-8">
        {campaign.headerImageUrl ? (
          <Image
            src={campaign.headerImageUrl}
            alt={campaign.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
        )}
        
        {/* 오버레이 정보 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              {campaign.business?.logo && (
                <Image
                  src={campaign.business.logo}
                  alt={campaign.business.name}
                  width={48}
                  height={48}
                  className="rounded-full bg-white"
                />
              )}
              <div>
                <p className="text-sm opacity-90">{campaign.business?.name}</p>
                <h1 className="text-2xl md:text-3xl font-bold">{campaign.title}</h1>
              </div>
            </div>
            
            {/* 플랫폼 배지 */}
            <div className="flex gap-2">
              {campaign.platforms?.map((platform: string) => (
                <Badge key={platform} variant="secondary" className="bg-white/20 text-white">
                  {getPlatformIcon(platform)}
                  <span className="ml-1">{platform}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* 액션 버튼 (우상단) */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={onLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white"
            onClick={onShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 좌측: 상세 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 캠페인 설명 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">캠페인 소개</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{campaign.description}</p>
          </div>
          
          {/* 상세 이미지 */}
          {campaign.detailImages?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">상세 정보</h2>
              <div className="space-y-4">
                {campaign.detailImages.map((image: string, index: number) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={image}
                      alt={`상세 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 요구사항 */}
          {campaign.requirements && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                참여 조건
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{campaign.requirements}</p>
            </div>
          )}
          
          {/* 해시태그 */}
          {campaign.hashtags?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">필수 해시태그</h2>
              <div className="flex flex-wrap gap-2">
                {campaign.hashtags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 우측: 신청 정보 */}
        <div className="space-y-6">
          {/* 신청 카드 */}
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
            <div className="space-y-4">
              {/* 예산 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">리뷰 보상</span>
                <span className="text-2xl font-bold">₩{campaign.budget?.toLocaleString()}</span>
              </div>
              
              {/* 진행 상황 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">신청 현황</span>
                  <span className="font-medium">
                    {campaign.applicationCount || 0} / {campaign.maxApplicants}명
                  </span>
                </div>
                <Progress value={applicationRate} className="h-2" />
              </div>
              
              {/* 마감일 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">마감까지</span>
                <span className={`font-bold ${dateInfo.daysLeft <= 3 ? 'text-red-500' : ''}`}>
                  D-{dateInfo.daysLeft}
                </span>
              </div>
              
              {/* 팔로워 요구사항 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">최소 팔로워</span>
                <span className="font-medium">{campaign.targetFollowers?.toLocaleString()}명</span>
              </div>
              
              {/* 신청 버튼 */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={onApply}
                disabled={hasApplied || dateInfo.daysLeft < 0}
              >
                {hasApplied ? '신청 완료' : '캠페인 신청하기'}
              </Button>
              
              {/* 추가 정보 */}
              <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>캠페인 기간: {new Date(campaign.startDate).toLocaleDateString()} ~ {new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>카테고리: {campaign.business?.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 연관 캠페인 */}
      {relatedCampaigns.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">비슷한 캠페인</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedCampaigns.slice(0, 4).map((related) => (
              <Link key={related.id} href={`/campaigns/${related.id}`}>
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-square bg-gray-100">
                    {related.thumbnailImageUrl && (
                      <Image
                        src={related.thumbnailImageUrl}
                        alt={related.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">{related.business?.name}</p>
                    <h3 className="font-medium text-sm line-clamp-2">{related.title}</h3>
                    <p className="text-sm font-bold mt-1">₩{related.budget?.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

OptimizedCampaignDetail.displayName = 'OptimizedCampaignDetail'

export default OptimizedCampaignDetail