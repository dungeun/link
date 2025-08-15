'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { AuthService } from '@/lib/auth'
import { useLanguage } from '@/hooks/useLanguage'

interface Campaign {
  id: string;
  title: string;
  brand_name: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  platforms: string[];
  required_followers: number;
  location: string;
  view_count: number;
  applicant_count: number;
  image_url: string;
  tags: string[];
  status: string;
  created_at: string;
  start_date: string;
  end_date: string;
  requirements: string;
  application_deadline: string;
}

export default function CampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('latest')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [viewType] = useState('image') // 이미지형으로 고정 (상태 변경 불가)
  const [favorites, setFavorites] = useState<string[]>([]) // 즐겨찾기 ID 저장
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 언어팩 사용
  const { t } = useLanguage()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // 5 rows * 4 columns = 20 items per page
    total: 0,
    totalPages: 0
  })
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({})

  const categories = [
    { id: 'all', name: t('campaigns.category.all', '전체'), count: pagination.total },
    { id: '패션', name: t('campaigns.category.fashion', '패션'), count: categoryStats['패션'] || 0 },
    { id: '뷰티', name: t('campaigns.category.beauty', '뷰티'), count: categoryStats['뷰티'] || 0 },
    { id: '음식', name: t('campaigns.category.food', '음식'), count: categoryStats['음식'] || 0 },
    { id: '여행', name: t('campaigns.category.travel', '여행'), count: categoryStats['여행'] || 0 },
    { id: '기술', name: t('campaigns.category.tech', '기술'), count: categoryStats['기술'] || 0 },
    { id: '라이프스타일', name: t('campaigns.category.lifestyle', '라이프스타일'), count: categoryStats['라이프스타일'] || 0 },
    { id: '스포츠', name: t('campaigns.category.sports', '스포츠'), count: categoryStats['스포츠'] || 0 },
    { id: '게임', name: t('campaigns.category.game', '게임'), count: categoryStats['게임'] || 0 },
    { id: '교육', name: t('campaigns.category.education', '교육'), count: categoryStats['교육'] || 0 },
    { id: '헬스', name: t('campaigns.category.health', '헬스'), count: categoryStats['헬스'] || 0 }
  ]

  // 캠페인 데이터 가져오기
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      
      const response = await fetch(`/api/campaigns?${params}`)
      
      if (!response.ok) {
        throw new Error(t('error.campaigns_fetch_failed', '캠페인 데이터를 가져오는데 실패했습니다.'))
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setCampaigns(data.campaigns || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      })
      setCategoryStats(data.categoryStats || {})
    } catch (err) {
      console.error('캠페인 데이터 조회 오류:', err)
      setError(err instanceof Error ? err.message : t('error.unknown_error_occurred', '알 수 없는 오류가 발생했습니다.'))
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  // 사용자가 좋아요한 캠페인 목록 가져오기
  const fetchLikedCampaigns = async () => {
    const user = AuthService.getCurrentUser()
    if (!user) return

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/mypage/liked-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const likedCampaignIds = data.campaigns.map((c: { id: string }) => c.id)
        setFavorites(likedCampaignIds)
      }
    } catch (error) {
      console.error('Error fetching liked campaigns:', error)
    }
  }

  // 페이지 로드 시 및 필터 변경 시 데이터 가져오기
  useEffect(() => {
    fetchCampaigns()
    fetchLikedCampaigns()
  }, [pagination.page, selectedCategory, selectedPlatform])

  // 즐겨찾기 토글 함수
  const toggleFavorite = async (campaignId: string) => {
    const user = AuthService.getCurrentUser()
    if (!user) {
      alert(t('auth.login_required_message', '로그인이 필요합니다.'))
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch(`/api/campaigns/${campaignId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.liked) {
          setFavorites(prev => [...prev, campaignId])
        } else {
          setFavorites(prev => prev.filter(id => id !== campaignId))
        }
      } else {
        const error = await response.json()
        console.error('Like error:', error)
        alert(t('error.like_processing_failed', '좋아요 처리 중 오류가 발생했습니다.'))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    }
  }

  // 플랫폼 아이콘 함수
  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'instagram': return '📷'
      case 'youtube': return '🎥'
      case 'tiktok': return '🎵'
      case 'blog': return '✍️'
      default: return '📱'
    }
  }

  // 필터 변경 핸들러
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 정렬 (클라이언트 사이드에서 수행)
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    switch(selectedSort) {
      case 'latest': 
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'deadline': 
        return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
      case 'popular': 
        return b.applicant_count - a.applicant_count;
      default: 
        return 0;
    }
  });

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('campaigns.hero.title', '진행 중인 캠페인')}
            </h1>
            <p className="text-xl text-white/80">
              {t('campaigns.hero.subtitle', '당신에게 맞는 브랜드 캠페인을 찾아보세요')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="space-y-4">
            {/* 첫번째 줄: 카테고리 필터 */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>

            {/* 두번째 줄: 추가 필터 및 정렬 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 플랫폼 필터 */}
              <select
                value={selectedPlatform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">{t('campaigns.filter.all_platforms', '모든 플랫폼')}</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="blog">Blog</option>
              </select>


              <div className="flex items-center gap-3 ml-auto">
                {/* 정렬 */}
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="latest">{t('campaigns.sort.latest', '최신순')}</option>
                  <option value="deadline">{t('campaigns.sort.deadline', '마감임박순')}</option>
                  <option value="popular">{t('campaigns.sort.popular', '인기순')}</option>
                </select>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium">{t('error.data_loading_failed_title', '데이터 로딩 실패')}</h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={fetchCampaigns}
                    className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    {t('action.retry', '다시 시도')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  {t('campaigns.status.total_campaigns_count', '총 {count}개의 캠페인이 있습니다.').replace('{count}', `${pagination.total}`)}
                </p>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('campaigns.status.no_campaigns_available', '캠페인이 없습니다')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('campaigns.status.no_matching_campaigns', '조건에 맞는 캠페인을 찾을 수 없습니다.')}</p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setSelectedPlatform('all')
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                    >
                      {t('campaigns.action.reset_filters', '필터 초기화')}
                    </button>
                  </div>
                </div>
              ) : (
                <>


          {/* 쇼핑몰 스타일 이미지 뷰 */}
          {/* 모바일 최적화된 캠페인 그리드 - 4열 그리드로 변경 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedCampaigns.map((campaign, index) => {
              // 가상 이미지 URL 배열
              const virtualImages = [
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80', // 화장품
                'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80', // 뷰티
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', // 스킨케어
                'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80', // 메이크업
                'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80', // 코스메틱
                'https://images.unsplash.com/photo-1567721913486-6585f069b332?w=800&q=80', // 향수
                'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80', // 스포츠 신발
                'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80', // 의류
                'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', // 패션
                'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80', // 옷
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80', // 스마트워치
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', // 시계
                'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // 음식
                'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80', // 푸드
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // 요리
                'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // 맛집
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', // 여행
                'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80', // 여행지
                'https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?w=800&q=80', // 테크
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80', // 전자제품
                'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80', // 노트북
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', // 맥북
                'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80', // 아이폰
                'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', // 가방
                'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', // 선글라스
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', // 운동화
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', // 핸드폰
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80', // 카메라
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', // 헤드폰
                'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80'  // 커피
              ];
              
              // 캠페인 ID를 기반으로 일관된 이미지 인덱스 생성
              const imageIndex = campaign.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % virtualImages.length;
              
              // 이미지 URL 처리
              let imageUrl = campaign.image_url;
              // 실제 업로드된 이미지가 없거나 기본 이미지인 경우에만 가상 이미지 사용
              if (!imageUrl || imageUrl === '/images/campaigns/default.jpg' || imageUrl === '') {
                imageUrl = virtualImages[imageIndex];
              }
              const daysLeft = Math.ceil((new Date(campaign.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={campaign.id} className="group relative animate-in fade-in slide-in-from-bottom-4 duration-600 w-full" style={{ animationDelay: `${index * 50}ms` }}>
                  <Link href={`/campaigns/${campaign.id}`} className="block">
                    {/* 모바일 최적화된 이미지 컨테이너 */}
                    <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square mb-3 overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                      {/* 모바일 최적화된 즐겨찾기 버튼 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(campaign.id);
                        }}
                        className="absolute top-3 right-3 z-10 w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md active:scale-95"
                        aria-label="즐겨찾기"
                      >
                        <svg 
                          className={`w-5 h-5 transition-all duration-200 ${favorites.includes(campaign.id) ? 'text-red-500 fill-current scale-110' : 'text-gray-600'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      
                      {/* 모바일 최적화된 마감일 배지 */}
                      {daysLeft <= 7 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-full shadow-lg">
                          <span className="hidden sm:inline">마감임박 </span>
                          D-{daysLeft}
                        </div>
                      )}
                      
                      {/* 이미지 */}
                      <img 
                        src={imageUrl} 
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // 이미지 로드 실패시 대체 이미지로 변경
                          e.currentTarget.src = virtualImages[index % virtualImages.length];
                        }}
                      />
                    </div>
                    
                    {/* 모바일 최적화된 정보 섹션 */}
                    <div className="space-y-2 px-1">
                      {/* 브랜드명 */}
                      <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{campaign.brand_name}</p>
                      
                      {/* 제목 - 모바일에서 더 크게 */}
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 group-hover:text-cyan-600 transition-colors leading-tight">
                        {campaign.title}
                      </h3>
                      
                      {/* 카테고리 & 플랫폼 */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">{campaign.category}</span>
                        <div className="flex gap-1">
                          {campaign.platforms?.slice(0, 2).map((platform: string) => (
                            <span key={platform} className="text-base">
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 가격 정보 (예산) - 모바일에서 더 크게 */}
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          ₩{(campaign.budget || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('campaigns.card.applicant_count', '{count}명 지원').replace('{count}', campaign.applicant_count.toString())}
                        </p>
                      </div>
                      
                      {/* 추가 정보 */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{t('campaigns.card.followers_required', '팔로워 {count}+').replace('{count}', (campaign.required_followers || 0).toLocaleString())}</span>
                        <span>•</span>
                        <span>{t('campaigns.card.days_left', 'D-{days}').replace('{days}', daysLeft.toString())}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="text-center mt-12">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('pagination.previous', '이전')}
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('pagination.next', '다음')}
                </button>
              </div>
            </div>
          )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('campaigns.cta.not_found_title', '원하는 캠페인을 찾지 못하셨나요?')}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t('campaigns.cta.profile_register_desc', '프로필을 등록하면 맞춤 캠페인 추천을 받을 수 있습니다.')}
          </p>
          <Link 
            href="/register?type=influencer" 
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            {t('campaigns.cta.register_as_influencer', '인플루언서로 등록하기')}
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}