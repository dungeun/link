'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface ProfileData {
  id: string
  name: string
  email: string
  type: string
  profile?: {
    bio?: string
    profileImage?: string
    phone?: string
    realName?: string
    birthDate?: string
    birthYear?: number
    gender?: string
    nationality?: string
    address?: string
    addressData?: Record<string, unknown>
    instagram?: string
    instagramFollowers?: number
    youtube?: string
    youtubeSubscribers?: number
    tiktok?: string
    tiktokFollowers?: number
    naverBlog?: string
    followerCount?: number
    categories?: string
    averageEngagementRate?: number
    bankName?: string
    bankAccountNumber?: string
    bankAccountHolder?: string
  }
  businessProfile?: {
    companyName: string
    businessNumber: string
    businessCategory: string
    businessAddress: string
    representativeName: string
  }
}

interface UserDataContextType {
  profileData: ProfileData | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<ProfileData>) => void
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 프로필 데이터 가져오기
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfileData(null)
      return
    }

    // 이미 데이터가 있고, 5분 이내에 fetch했다면 스킵
    const lastFetch = localStorage.getItem('lastProfileFetch')
    if (profileData && lastFetch) {
      try {
        const timeDiff = Date.now() - parseInt(lastFetch)
        if (timeDiff < 5 * 60 * 1000) { // 5분
          return
        }
      } catch (e) {
        // 파싱 오류 시 계속 진행
        console.warn('Failed to parse lastProfileFetch:', e)
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = user.type === 'INFLUENCER' 
        ? '/api/influencer/profile' 
        : user.type === 'BUSINESS'
        ? '/api/business/profile'
        : null

      if (!endpoint) {
        setProfileData({ id: user.id, name: user.name, email: user.email, type: user.type })
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10초 타임아웃
      })

      if (response.status === 401) {
        // 토큰 만료 시 에러 처리
        localStorage.removeItem('accessToken')
        throw new Error('Authentication expired')
      }

      if (response.ok) {
        const data = await response.json()
        
        // 데이터 유효성 검증
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid profile data received')
        }

        setProfileData(data)
        localStorage.setItem('lastProfileFetch', Date.now().toString())
        
        // 로컬 스토리지에도 캐시 (세션 간 공유용)
        try {
          localStorage.setItem('cachedProfile', JSON.stringify(data))
        } catch (e) {
          console.warn('Failed to cache profile data:', e)
        }
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile'
      setError(errorMessage)
      
      // 에러 시 로컬 스토리지 캐시 사용
      const cached = localStorage.getItem('cachedProfile')
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          // 캐시된 데이터 유효성 검증
          if (cachedData && typeof cachedData === 'object' && cachedData.id === user.id) {
            setProfileData(cachedData)
            console.info('Using cached profile data due to fetch error')
          }
        } catch (e) {
          console.warn('Failed to parse cached profile data:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, profileData])

  // 프로필 데이터 업데이트 (로컬 상태만, API 호출 없음)
  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    setProfileData(prev => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      localStorage.setItem('cachedProfile', JSON.stringify(updated))
      return updated
    })
  }, [])

  // 강제 새로고침
  const refreshProfile = useCallback(async () => {
    localStorage.removeItem('lastProfileFetch')
    await fetchProfile()
  }, [fetchProfile])

  // 유저 변경 시 프로필 로드
  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfileData(null)
      localStorage.removeItem('cachedProfile')
      localStorage.removeItem('lastProfileFetch')
    }
  }, [user, fetchProfile])

  return (
    <UserDataContext.Provider value={{
      profileData,
      isLoading,
      error,
      refreshProfile,
      updateProfile
    }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const context = useContext(UserDataContext)
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}

// 편의 함수들
export function useInfluencerProfile() {
  const { profileData } = useUserData()
  return profileData?.type === 'INFLUENCER' ? profileData : null
}

export function useBusinessProfile() {
  const { profileData } = useUserData()
  return profileData?.type === 'BUSINESS' ? profileData : null
}