import { useCachedData } from './useCachedData'
import { useAuth } from './useAuth'

// 캠페인 데이터 캐싱
export function useCampaignData(campaignId: string) {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaign')
      const data = await response.json()
      // 표준화된 API 응답 처리
      if (data.success && data.data) {
        // userInteractions 데이터를 campaign 객체에 병합
        const campaign = data.data.campaign || {}
        const userInteractions = data.data.userInteractions || {}
        
        return {
          ...campaign,
          hasApplied: userInteractions.hasApplied || false,
          applicationStatus: userInteractions.applicationStatus,
          isLiked: userInteractions.isLiked || false,
          isSaved: userInteractions.isSaved || false
        }
      }
      // 이전 API 구조 지원 (하위 호환성)
      return data.campaign || data
    },
    {
      key: `campaign_${campaignId}_${user?.id || 'anonymous'}`, // 사용자별 캐시 키
      ttl: 10 * 60 * 1000, // 10분
      staleWhileRevalidate: true
    }
  )
}

// 비즈니스 정보 캐싱
export function useBusinessData(businessId: string) {
  return useCachedData(
    async () => {
      const response = await fetch(`/api/business/${businessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch business')
      return response.json()
    },
    {
      key: `business_${businessId}`,
      ttl: 30 * 60 * 1000, // 30분
      staleWhileRevalidate: true
    }
  )
}

// 인플루언서 통계 캐싱
export function useInfluencerStats() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/influencer/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    {
      key: `influencer_stats_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 템플릿 데이터 캐싱
export function useTemplates(type: 'campaign' | 'application') {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const endpoint = type === 'campaign' 
        ? '/api/business/templates'
        : '/api/application-templates'
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch templates')
      const result = await response.json()
      // API 응답 구조에 따라 처리
      if (result.success && result.data) {
        return result.data.templates || []
      }
      return result.templates || []
    },
    {
      key: `${type}_templates_${user?.id}`,
      ttl: 15 * 60 * 1000, // 15분
      staleWhileRevalidate: true
    }
  )
}

// 좋아요한 캠페인 목록 캐싱
export function useLikedCampaigns(page = 1, limit = 20) {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch(
        `/api/mypage/liked-campaigns?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch liked campaigns')
      return response.json()
    },
    {
      key: `liked_campaigns_${user?.id}_${page}_${limit}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 저장된(관심) 캠페인 목록 캐싱
export function useSavedCampaigns(page = 1, limit = 20) {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch(
        `/api/mypage/saved-campaigns?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch saved campaigns')
      return response.json()
    },
    {
      key: `saved_campaigns_${user?.id}_${page}_${limit}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 캠페인 목록 캐싱 (필터 포함)
export function useCampaignList(filters: Record<string, unknown> = {}) {
  const filterKey = JSON.stringify(filters)
  
  return useCachedData(
    async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value))
      })
      
      const response = await fetch(`/api/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
    {
      key: `campaigns_${filterKey}`,
      ttl: 3 * 60 * 1000, // 3분 (자주 변경되는 데이터)
      staleWhileRevalidate: true
    }
  )
}

// 인플루언서 지원 목록 캐싱
export function useInfluencerApplications() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/influencer/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch applications')
      const data = await response.json()
      return data.applications || []
    },
    {
      key: `influencer_applications_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 인플루언서 출금 정보 캐싱
export function useInfluencerWithdrawals() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/influencer/withdrawals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch withdrawals')
      return response.json()
    },
    {
      key: `influencer_withdrawals_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 비즈니스 캠페인 목록 캐싱
export function useBusinessCampaigns() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/business/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch business campaigns')
      const data = await response.json()
      return data.campaigns || []
    },
    {
      key: `business_campaigns_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 비즈니스 지원서 목록 캐싱
export function useBusinessApplications() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/business/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch business applications')
      const data = await response.json()
      return data.applications || []
    },
    {
      key: `business_applications_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 비즈니스 통계 캐싱
export function useBusinessStats() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/business/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch business stats')
      const data = await response.json()
      return data.stats
    },
    {
      key: `business_stats_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}