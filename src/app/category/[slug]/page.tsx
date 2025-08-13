'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Search, Filter, Grid, List, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
}

interface CategoryPage {
  id: string
  title: string
  content: any
  layout: string
  heroSection?: any
  featuredSection?: any
  filterOptions?: any
  customSections?: any
  seoSettings?: any
  isPublished: boolean
  category: Category
}

interface Campaign {
  id: string
  title: string
  description: string
  budget: number
  imageUrl?: string
  platform: string
  status: string
  business: {
    name: string
  }
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const { t } = useLanguage()
  
  const [categoryPage, setCategoryPage] = useState<CategoryPage | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (slug) {
      fetchCategoryPage()
      fetchCategoryCampaigns()
    }
  }, [slug])

  const fetchCategoryPage = async () => {
    try {
      const response = await fetch(`/api/categories/${slug}/page`)
      const data = await response.json()
      
      if (data.success) {
        setCategoryPage(data.categoryPage)
        setViewMode(data.categoryPage.layout as 'grid' | 'list' || 'grid')
      } else {
        setError('카테고리 페이지를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('Error fetching category page:', error)
      setError('페이지를 로드하는 중 오류가 발생했습니다.')
    }
  }

  const fetchCategoryCampaigns = async () => {
    try {
      const response = await fetch(`/api/categories/${slug}/campaigns?search=${searchTerm}&sort=${sortBy}`)
      const data = await response.json()
      
      if (data.success) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (categoryPage) {
      fetchCategoryCampaigns()
    }
  }, [searchTerm, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !categoryPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">{error || '요청하신 카테고리 페이지가 존재하지 않습니다.'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const { category, heroSection, filterOptions } = categoryPage

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {heroSection?.enabled && (
        <div 
          className="relative bg-gradient-to-r from-blue-600 to-purple-700 py-20"
          style={category.color ? { 
            background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)` 
          } : {}}
        >
          <div className="container mx-auto px-4 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              {category.icon && (
                <span className="text-4xl">{category.icon}</span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold">
                {heroSection.title || category.name}
              </h1>
            </div>
            
            {heroSection.subtitle && (
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
                {heroSection.subtitle}
              </p>
            )}
            
            {heroSection.ctaText && (
              <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                {heroSection.ctaText}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 필터 및 검색 */}
        {filterOptions && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 flex gap-4 items-center w-full lg:w-auto">
                {filterOptions.showSearch && (
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="캠페인 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                
                {filterOptions.showSort && (
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="latest">최신 순</option>
                    <option value="budget_high">예산 높은 순</option>
                    <option value="budget_low">예산 낮은 순</option>
                    <option value="popular">인기 순</option>
                  </select>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 캠페인 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {category.name} 캠페인
            </h2>
            <span className="text-gray-600">
              총 {campaigns.length}개 캠페인
            </span>
          </div>

          {campaigns.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {campaigns.map((campaign) => (
                <CampaignCard 
                  key={campaign.id} 
                  campaign={campaign} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {category.icon ? (
                  <span className="text-6xl">{category.icon}</span>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                등록된 캠페인이 없습니다
              </h3>
              <p className="text-gray-500">
                {searchTerm ? '검색 조건을 변경해보세요.' : '새로운 캠페인을 기다려주세요.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CampaignCard({ campaign, viewMode }: { campaign: Campaign; viewMode: 'grid' | 'list' }) {
  const { t } = useLanguage()
  
  if (viewMode === 'list') {
    return (
      <Link href={`/campaigns/${campaign.id}`}>
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {campaign.imageUrl ? (
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  width={120}
                  height={80}
                  className="w-30 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-30 h-20 bg-gray-200 rounded-lg" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{campaign.title}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{campaign.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{campaign.business.name}</span>
                <span className="font-semibold text-blue-600">
                  {campaign.budget.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video relative">
          {campaign.imageUrl ? (
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{campaign.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{campaign.business.name}</span>
            <span className="font-semibold text-blue-600">
              {campaign.budget.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}