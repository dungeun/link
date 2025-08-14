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
    birthYear?: number
    gender?: string
    address?: string
    instagram?: string
    instagramFollowers?: number
    youtube?: string
    youtubeSubscribers?: number
    tiktok?: string
    tiktokFollowers?: number
    categories?: string
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
      const timeDiff = Date.now() - parseInt(lastFetch)
      if (timeDiff < 5 * 60 * 1000) { // 5분
        return
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
        return
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        localStorage.setItem('lastProfileFetch', Date.now().toString())
        
        // 로컬 스토리지에도 캐시 (세션 간 공유용)
        localStorage.setItem('cachedProfile', JSON.stringify(data))
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      
      // 에러 시 로컬 스토리지 캐시 사용
      const cached = localStorage.getItem('cachedProfile')
      if (cached) {
        try {
          setProfileData(JSON.parse(cached))
        } catch {}
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

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