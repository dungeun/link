'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Heart, 
  Share2, 
  Instagram, 
  Youtube
} from 'lucide-react'

// 플랫폼 아이콘 컴포넌트들
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.101-1.139 3.418-1.304 2.513-.314 4.746-1.973 5.876-4.058l-1.456-1.455c-.706 1.263-2.188 2.548-4.062 2.805-1.222.167-2.415.642-3.17 1.229zM16 2.5c-1.621 0-3.128.665-4.2 1.737L9.063 6.975c-1.075 1.072-1.737 2.579-1.737 4.2 0 3.268 2.732 6 6 6s6-2.732 6-6-2.732-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.846 0 3.543-.497 5.02-1.327l-1.411-1.411C14.5 19.775 13.295 20 12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.295-.225 2.5-.738 3.609l1.411 1.411C21.503 15.543 22 13.846 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

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
  status: string
  headerImageUrl: string | null
  thumbnailImageUrl: string | null
  imageUrl: string | null
}

interface CampaignHeaderProps {
  campaign: Campaign
  isLiked: boolean
  onShare: () => void
  onLike: () => void
}

export default function CampaignHeader({
  campaign,
  isLiked,
  onShare,
  onLike
}: CampaignHeaderProps) {
  const router = useRouter()

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5" />
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5" />
      case 'TIKTOK':
        return <TikTokIcon />
      case 'BLOG':
        return <BlogIcon />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">모집 중</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <>
      {/* 헤더 이미지 */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
        {(() => {
          // 이미지 URL 우선순위: headerImageUrl > thumbnailImageUrl > imageUrl
          const imageUrl = campaign.headerImageUrl || campaign.thumbnailImageUrl || campaign.imageUrl;
          
          if (imageUrl && imageUrl.trim() && imageUrl !== 'null' && imageUrl !== 'undefined') {
            return (
              <Image
                src={imageUrl}
                alt={campaign.title}
                fill
                className="object-cover"
                priority={true}
                quality={85}
                sizes="100vw"
                onError={(e) => {
                  console.error('Failed to load header image:', imageUrl);
                  // 이미지 로드 실패 시에도 기본 gradient 배경이 보이도록 함
                  (e.target as HTMLImageElement).style.opacity = '0';
                }}
              />
            );
          }
          return null; // 이미지가 없을 때는 배경 gradient만 사용
        })()}
        
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* 뒤로가기 버튼 */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            ← 뒤로가기
          </Button>
        </div>
        
        {/* 공유 & 좋아요 버튼 */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 backdrop-blur-sm"
            onClick={onShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 backdrop-blur-sm ${isLiked ? 'text-red-400' : ''}`}
            onClick={onLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div className="bg-white shadow-lg border border-gray-100 mx-6 -mt-20 relative z-10 rounded-2xl">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{campaign.title}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                {getStatusBadge(campaign.status)}
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-3">
                  {(campaign.platforms || []).map((platform: any, index: number) => {
                    // 플랫폼이 객체인 경우 처리
                    const platformName = typeof platform === 'string' 
                      ? platform 
                      : platform?.name || platform?.type || platform?.platform || 'UNKNOWN';
                    
                    return (
                      <span key={index} className="flex items-center gap-1 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                        {getPlatformIcon(platformName)}
                        <span className="text-sm font-medium capitalize">
                          {platformName.toLowerCase()}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 비즈니스 정보 */}
          <Link href={`/business/${campaign.business?.id || ''}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {campaign.business?.logo ? (
                <Image
                  src={campaign.business?.logo || ''}
                  alt={campaign.business?.name || ''}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Users className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate">{campaign.business?.name || ''}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {campaign.categories?.[0]?.category?.name || campaign.business?.category || ''}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}