'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import PageLayout from '@/components/layouts/PageLayout'
import CategoryFilters from '@/components/category/CategoryFilters'
import CategoryCampaignGrid from '@/components/category/CategoryCampaignGrid'
import { AuthService } from '@/lib/auth'
import { useLanguage } from '@/hooks/useLanguage'
import { Campaign, Category } from '@/types/campaign'

export default function CategoryCampaignsPage() {
  const params = useParams()
  const categorySlug = params.slug as string
  const { t } = useLanguage()
  
  // State management
  const [selectedSubCategory, setSelectedSubCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('latest')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [favorites, setFavorites] = useState<string[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null)
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [subCategoryStats, setSubCategoryStats] = useState<{[key: string]: number}>({})

  // 카테고리 정보 가져오기
  const fetchCategoryInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (data.success) {
        const allCategories = data.categories
        const currentCategory = allCategories.find((cat: Category) => cat.slug === categorySlug)
        
        if (currentCategory) {
          setCategoryInfo(currentCategory)
          const children = allCategories.filter((cat: Category) => cat.parentId === currentCategory.id)
          setSubCategories(children)
        }
      }
    } catch (error) {
      console.error('Error fetching category info:', error)
    }
  }, [categorySlug])

  // 캠페인 데이터 가져오기
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (selectedSubCategory !== 'all') {
        params.append('category', selectedSubCategory)
      }
      
      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }
      
      const response = await fetch(`/api/campaigns/simple?${params}`)
      
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
    } catch (err) {
      console.error('캠페인 데이터 조회 오류:', err)
      setError(err instanceof Error ? err.message : t('error.unknown_error_occurred', '알 수 없는 오류가 발생했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [pagination.page, selectedSubCategory, selectedPlatform, t])

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(async (campaignId: string) => {
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
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }, [t])

  // Effects
  useEffect(() => {
    fetchCategoryInfo()
  }, [fetchCategoryInfo])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // 카테고리 데이터 준비
  const categories = [
    { id: 'all', name: t('campaigns.category.all', '전체'), count: pagination.total },
    ...subCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: subCategoryStats[cat.id] || 0
    }))
  ]

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {categoryInfo?.name || t('campaigns.hero.title', '진행 중인 캠페인')}
            </h1>
            <p className="text-xl text-white/80">
              {categoryInfo?.description || t('campaigns.hero.subtitle', '당신에게 맞는 브랜드 캠페인을 찾아보세요')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <CategoryFilters
        categories={categories}
        selectedSubCategory={selectedSubCategory}
        selectedSort={selectedSort}
        selectedPlatform={selectedPlatform}
        onCategoryChange={setSelectedSubCategory}
        onSortChange={setSelectedSort}
        onPlatformChange={setSelectedPlatform}
        t={t}
      />

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
              <p>{error}</p>
              <button 
                onClick={fetchCampaigns}
                className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                {t('action.retry', '다시 시도')}
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  {t('campaigns.status.total_campaigns_count', '총 {count}개의 캠페인이 있습니다.').replace('{count}', pagination.total.toString())}
                </p>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t('campaigns.status.no_campaigns_available', '캠페인이 없습니다')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('campaigns.status.no_matching_campaigns', '조건에 맞는 캠페인을 찾을 수 없습니다.')}
                  </p>
                </div>
              ) : (
                <CategoryCampaignGrid
                  campaigns={campaigns}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  t={t}
                />
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  )
}