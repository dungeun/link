'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Influencer {
  id: string
  name: string
  profile?: {
    bio?: string
    avatar?: string
    categories?: string[]
    instagram?: string
    instagramFollowers?: number
    youtube?: string
    youtubeSubscribers?: number
    tiktok?: string
    tiktokFollowers?: number
  }
  _count?: {
    applications: number
  }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function InfluencersPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFollowers, setSelectedFollowers] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSort, setSelectedSort] = useState('relevance')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [loading, setLoading] = useState(true)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'beauty', name: '뷰티' },
    { id: 'fashion', name: '패션' },
    { id: 'food', name: '푸드' },
    { id: 'tech', name: '테크' },
    { id: 'travel', name: '여행' },
    { id: 'fitness', name: '피트니스' },
    { id: 'lifestyle', name: '라이프스타일' }
  ]

  const followerRanges = [
    { id: 'all', name: '전체' },
    { id: 'nano', name: '1K-10K' },
    { id: 'micro', name: '10K-50K' },
    { id: 'mid', name: '50K-100K' },
    { id: 'macro', name: '100K-500K' },
    { id: 'mega', name: '500K+' }
  ]

  // API에서 인플루언서 데이터 로드
  const loadInfluencers = async () => {
    try {
      setLoading(true)
      
      const searchParams = new URLSearchParams()
      
      if (searchQuery) searchParams.set('search', searchQuery)
      if (selectedCategory !== 'all') searchParams.set('categories', selectedCategory)
      if (selectedPlatform !== 'all') searchParams.set('platform', selectedPlatform)
      
      // 팔로워 수 범위 변환
      if (selectedFollowers !== 'all') {
        let minFollowers = 0
        switch(selectedFollowers) {
          case 'nano': minFollowers = 1000; break
          case 'micro': minFollowers = 10000; break
          case 'mid': minFollowers = 50000; break
          case 'macro': minFollowers = 100000; break
          case 'mega': minFollowers = 500000; break
        }
        searchParams.set('minFollowers', minFollowers.toString())
      }

      const response = await fetch(`/api/influencers?${searchParams}`)
      if (response.ok) {
        const data = await response.json()
        setInfluencers(data.influencers || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to load influencers:', error)
    } finally {
      setLoading(false)
    }
  }

  // useEffect로 데이터 로드 및 필터 변경 시 재로드
  useEffect(() => {
    loadInfluencers()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInfluencers()
    }, 500) // 디바운스

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, selectedFollowers, selectedPlatform])

  // 유틸리티 함수들
  const formatFollowers = (count?: number) => {
    if (!count) return '0'
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getMainFollowerCount = (profile?: Influencer['profile']) => {
    if (!profile) return 0
    return Math.max(
      profile.instagramFollowers || 0,
      profile.youtubeSubscribers || 0,
      profile.tiktokFollowers || 0
    )
  }

  const getPlatforms = (profile?: Influencer['profile']) => {
    if (!profile) return []
    const platforms = []
    if (profile.instagram) platforms.push('instagram')
    if (profile.youtube) platforms.push('youtube')
    if (profile.tiktok) platforms.push('tiktok')
    return platforms
  }

  const getMainCategory = (profile?: Influencer['profile']) => {
    if (!profile?.categories || profile.categories.length === 0) return 'lifestyle'
    return profile.categories[0]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              인플루언서 찾기
            </h1>
            <p className="text-xl text-white/80 mb-8">
              브랜드에 맞는 완벽한 인플루언서를 찾아보세요
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="이름, 카테고리, 특기로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pr-12 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-cyan-400"
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Follower Range Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {followerRanges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setSelectedFollowers(range.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedFollowers === range.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Influencers Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <p className="text-gray-600">
                {loading ? (
                  <span className="animate-pulse">검색 중...</span>
                ) : (
                  <>
                    <span className="font-bold text-cyan-600">{pagination?.total || 0}명</span>의 인플루언서를 찾았습니다.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                {/* 플랫폼 필터 */}
                <select 
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">모든 플랫폼</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="blog">Blog</option>
                </select>
                
                {/* 정렬 */}
                <select 
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="relevance">관련도순</option>
                  <option value="followers">팔로워순</option>
                  <option value="engagement">참여율순</option>
                  <option value="rating">평점순</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg animate-pulse">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full mr-4"></div>
                        <div>
                          <div className="w-24 h-5 bg-gray-300 rounded mb-2"></div>
                          <div className="w-20 h-4 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="w-full h-12 bg-gray-300 rounded mb-4"></div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-8 bg-gray-300 rounded mx-auto mb-1"></div>
                          <div className="w-8 h-3 bg-gray-300 rounded mx-auto"></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-16 h-6 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                    <div className="w-full h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))
            ) : influencers.length > 0 ? (
              influencers.map((influencer, index) => {
                const mainCategory = getMainCategory(influencer.profile)
                const platforms = getPlatforms(influencer.profile)
                const followerCount = getMainFollowerCount(influencer.profile)
                const formattedFollowers = formatFollowers(followerCount)
                const engagementRate = (5.2).toFixed(1) // Mock engagement rate for now
                const completedCampaigns = influencer._count?.applications || 0

                return (
                  <div key={influencer.id} className="influencer-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="p-6">
                      {/* Profile Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <img 
                            src={influencer.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}&background=6366f1&color=fff`}
                            alt={influencer.name}
                            className="w-16 h-16 rounded-full object-cover mr-4"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}&background=6366f1&color=fff`
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold">{influencer.name}</h3>
                              {influencer.profile?.avatar && (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm">{influencer.profile?.instagram || `@${influencer.name.toLowerCase().replace(/\s+/g, '_')}`}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                          {categories.find(c => c.id === mainCategory)?.name || '라이프스타일'}
                        </span>
                      </div>

                      {/* Bio */}
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {influencer.profile?.bio || '안녕하세요! 다양한 콘텐츠를 제작하는 크리에이터입니다.'}
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{formattedFollowers}</p>
                          <p className="text-xs text-gray-500">팔로워</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cyan-600">{engagementRate}%</p>
                          <p className="text-xs text-gray-500">참여율</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{completedCampaigns}</p>
                          <p className="text-xs text-gray-500">완료 캠페인</p>
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {influencer.profile?.categories?.slice(0, 3).map((category, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {categories.find(c => c.id === category)?.name || category}
                          </span>
                        )) || (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            콘텐츠 제작
                          </span>
                        )}
                      </div>

                      {/* Platforms */}
                      <div className="flex gap-2 mb-4">
                        {platforms.includes('instagram') && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Instagram</span>
                        )}
                        {platforms.includes('youtube') && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">YouTube</span>
                        )}
                        {platforms.includes('tiktok') && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">TikTok</span>
                        )}
                        {platforms.length === 0 && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Instagram</span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link 
                        href={`/influencers/${influencer.id}`}
                        className="block w-full text-center px-4 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                      >
                        프로필 보기
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              // 검색 결과 없음
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500">다른 검색어나 필터를 사용해보세요.</p>
              </div>
            )}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors">
              더 많은 인플루언서 보기
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            당신의 브랜드를 위한 인플루언서를 찾으셨나요?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            지금 바로 캠페인을 시작하고 성공적인 마케팅을 경험하세요.
          </p>
          <Link 
            href="/register?type=business" 
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            브랜드로 시작하기
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}