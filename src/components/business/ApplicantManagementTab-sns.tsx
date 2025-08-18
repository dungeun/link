// SNS 정보 탭 컴포넌트 (개선된 버전)
import { Instagram, Youtube, Facebook, Twitter, Globe, User } from 'lucide-react'

// 헬퍼 함수들
export const calculateTotalFollowers = (applicant: any) => {
  const profile = applicant.influencer?.profile
  if (!profile) return applicant.followers || 0
  
  return (
    (profile.instagramFollowers || 0) +
    (profile.youtubeSubscribers || 0) +
    (profile.facebookFollowers || 0) +
    (profile.twitterFollowers || 0) +
    (profile.tiktokFollowers || 0)
  )
}

export const calculateAverageEngagement = (applicant: any) => {
  const profile = applicant.influencer?.profile
  if (!profile) return applicant.engagementRate || 0
  
  const engagements = [
    profile.instagramEngagementRate,
    profile.youtubeEngagementRate,
    profile.facebookEngagementRate,
    profile.twitterEngagementRate,
    profile.tiktokEngagementRate
  ].filter(rate => rate !== undefined && rate > 0)
  
  if (engagements.length === 0) return applicant.engagementRate || 0
  
  const avg = engagements.reduce((sum, rate) => sum + rate, 0) / engagements.length
  return Math.round(avg * 10) / 10
}

export const countActivePlatforms = (applicant: any) => {
  const profile = applicant.influencer?.profile
  if (!profile) return applicant.influencerHandle ? 1 : 0
  
  let count = 0
  if (profile.instagram) count++
  if (profile.youtube) count++
  if (profile.facebook) count++
  if (profile.twitter) count++
  if (profile.tiktok) count++
  if (profile.blog) count++
  
  return count
}

export const hasAnySNS = (applicant: any) => {
  const profile = applicant.influencer?.profile
  return !!(
    profile?.instagram ||
    profile?.youtube ||
    profile?.facebook ||
    profile?.twitter ||
    profile?.tiktok ||
    profile?.blog ||
    applicant.influencerHandle
  )
}

// SNS 플랫폼 카드 컴포넌트
export const SNSCard = ({ 
  platform, 
  handle, 
  followers, 
  engagementRate, 
  icon: Icon, 
  color, 
  url 
}: {
  platform: string
  handle: string
  followers: number
  engagementRate?: number
  icon: any
  color: string
  url: string
}) => (
  <div className={`bg-gradient-to-r ${color} p-1 rounded-lg`}>
    <div className="bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6" style={{ color: color.split(' ')[1].replace('to-', '') }} />
          <div>
            <h4 className="font-semibold text-gray-900">{platform}</h4>
            <p className="text-xs text-gray-600 truncate max-w-[150px]">@{handle}</p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2 py-1 text-white rounded text-xs hover:opacity-90 transition-opacity"
          style={{ backgroundColor: color.split(' ')[1].replace('to-', '') }}
        >
          보기
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {followers.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">
            {platform === 'YouTube' ? '구독자' : platform === 'Blog' ? '월 방문자' : '팔로워'}
          </p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {engagementRate !== undefined ? `${engagementRate}%` : '-'}
          </p>
          <p className="text-xs text-gray-600">참여율</p>
        </div>
      </div>
    </div>
  </div>
)