'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Heart, Eye, Calendar, DollarSign, MapPin, Users } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  platform: string[];
  requiredFollowers: number;
  location: string;
  viewCount: number;
  applicantCount: number;
  imageUrl: string;
  tags: string[];
  status: 'active' | 'closed' | 'upcoming';
}

export default function ExploreCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState('all');
  const [savedCampaigns, setSavedCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock 데이터
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      title: '여름 신제품 뷰티 리뷰 캠페인',
      brand: '글로우 코스메틱',
      brandLogo: '/images/brands/glow-cosmetics.png',
      description: '2024 여름 신제품 선크림과 수분크림을 체험하고 솔직한 리뷰를 작성해주세요.',
      budget: 500000,
      deadline: '2024-07-31',
      category: 'beauty',
      platform: ['instagram', 'youtube'],
      requiredFollowers: 10000,
      location: '서울',
      viewCount: 1250,
      applicantCount: 45,
      imageUrl: '/images/campaigns/summer-beauty.jpg',
      tags: ['뷰티', '스킨케어', '여름'],
      status: 'active'
    },
    {
      id: '2',
      title: '프리미엄 피트니스 웨어 착용 리뷰',
      brand: '액티브 스포츠',
      brandLogo: '/images/brands/active-sports.png',
      description: '운동 중 착용샷과 함께 제품의 기능성과 디자인에 대한 리뷰를 남겨주세요.',
      budget: 300000,
      deadline: '2024-08-15',
      category: 'fashion',
      platform: ['instagram', 'tiktok'],
      requiredFollowers: 5000,
      location: '전국',
      viewCount: 890,
      applicantCount: 32,
      imageUrl: '/images/campaigns/fitness-wear.jpg',
      tags: ['패션', '운동', '피트니스'],
      status: 'active'
    },
    {
      id: '3',
      title: '신메뉴 맛집 탐방 리뷰',
      brand: '맛있는 레스토랑',
      brandLogo: '/images/brands/delicious-restaurant.png',
      description: '새로 출시한 여름 시즌 메뉴를 방문하여 시식하고 리뷰해주세요.',
      budget: 200000,
      deadline: '2024-07-20',
      category: 'food',
      platform: ['instagram', 'blog'],
      requiredFollowers: 3000,
      location: '서울, 경기',
      viewCount: 2100,
      applicantCount: 78,
      imageUrl: '/images/campaigns/restaurant-review.jpg',
      tags: ['맛집', '음식', '리뷰'],
      status: 'active'
    }
  ];

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'beauty', label: '뷰티' },
    { value: 'fashion', label: '패션' },
    { value: 'food', label: '음식' },
    { value: 'travel', label: '여행' },
    { value: 'tech', label: '테크' },
    { value: 'lifestyle', label: '라이프스타일' }
  ];

  const platforms = [
    { value: 'all', label: '전체 플랫폼' },
    { value: 'instagram', label: '인스타그램' },
    { value: 'youtube', label: '유튜브' },
    { value: 'tiktok', label: '틱톡' },
    { value: 'blog', label: '블로그' }
  ];

  const budgetRanges = [
    { value: 'all', label: '전체 예산' },
    { value: '0-100000', label: '10만원 이하' },
    { value: '100000-300000', label: '10-30만원' },
    { value: '300000-500000', label: '30-50만원' },
    { value: '500000+', label: '50만원 이상' }
  ];

  useEffect(() => {
    // 실제 API 호출로 캠페인 데이터 가져오기
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
        const params = new URLSearchParams({
          status: 'ACTIVE',
          page: '1',
          limit: '20'
        })
        
        const response = await fetch(`/api/campaigns?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const formattedCampaigns: Campaign[] = data.campaigns.map((campaign: Record<string, unknown>) => ({
            id: campaign.id,
            title: campaign.title,
            brand: campaign.brand_name,
            brandLogo: `/images/brands/${campaign.brand_name.toLowerCase().replace(/\s+/g, '-')}.png`,
            description: campaign.description,
            budget: campaign.budget,
            deadline: campaign.application_deadline,
            category: campaign.category.toLowerCase(),
            platform: campaign.platforms || [],
            requiredFollowers: campaign.required_followers || 0,
            location: campaign.location || '전국',
            viewCount: campaign.view_count || 0,
            applicantCount: campaign.applicant_count || 0,
            imageUrl: campaign.thumbnail_image_url || campaign.header_image_url || '/images/campaigns/default.jpg',
            tags: campaign.tags || [],
            status: 'active' as const
          }))
          setCampaigns(formattedCampaigns)
          setFilteredCampaigns(formattedCampaigns)
        } else {
          console.error('Failed to fetch campaigns')
          // 실패 시 목 데이터 사용
          setCampaigns(mockCampaigns)
          setFilteredCampaigns(mockCampaigns)
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error)
        // 에러 시 목 데이터 사용
        setCampaigns(mockCampaigns)
        setFilteredCampaigns(mockCampaigns)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [searchTerm, selectedCategory, selectedPlatform, selectedBudgetRange, campaigns]);

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(campaign => campaign.category === selectedCategory);
    }

    // 플랫폼 필터
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(campaign => campaign.platform.includes(selectedPlatform));
    }

    // 예산 필터
    if (selectedBudgetRange !== 'all') {
      if (selectedBudgetRange === '500000+') {
        filtered = filtered.filter(campaign => (campaign.budget ?? 0) >= 500000);
      } else {
        const [min, max] = selectedBudgetRange.split('-').map(Number);
        filtered = filtered.filter(campaign => {
          const total = campaign.budget ?? 0;
          return total >= min && total <= max;
        });
      }
    }

    setFilteredCampaigns(filtered);
  };

  const toggleSaveCampaign = (campaignId: string) => {
    setSavedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(budget);
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '마감됨';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays === 1) return '내일 마감';
    return `${diffDays}일 남음`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">캠페인 탐색</h1>
        <p className="text-gray-600">나에게 맞는 캠페인을 찾아 지원해보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 바 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="캠페인, 브랜드, 태그로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 필터 옵션 */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {platforms.map(platform => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>

            <select
              value={selectedBudgetRange}
              onChange={(e) => setSelectedBudgetRange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {budgetRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 검색 결과 수 */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredCampaigns.length}개의 캠페인을 찾았습니다
        </div>
      </div>

      {/* 캠페인 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map(campaign => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* 캠페인 이미지 */}
            <div className="relative h-48 bg-gray-200">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/campaign-placeholder.jpg';
                }}
              />
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => toggleSaveCampaign(campaign.id)}
                  className={`p-2 rounded-full ${
                    savedCampaigns.includes(campaign.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600'
                  } hover:scale-110 transition-transform`}
                >
                  <Heart className={`h-5 w-5 ${savedCampaigns.includes(campaign.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status === 'active' ? '진행중' :
                   campaign.status === 'upcoming' ? '예정' : '마감'}
                </span>
              </div>
            </div>

            {/* 캠페인 정보 */}
            <div className="p-6">
              {/* 브랜드 정보 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {campaign.brand.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{campaign.brand}</span>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {campaign.title}
              </h3>

              {/* 설명 */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {campaign.description}
              </p>

              {/* 태그 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {campaign.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 상세 정보 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    예산
                  </span>
                  <span className="font-medium text-gray-900">{formatBudget(campaign.budget)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    마감일
                  </span>
                  <span className="font-medium text-gray-900">{formatDeadline(campaign.deadline)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    지역
                  </span>
                  <span className="font-medium text-gray-900">{campaign.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    팔로워
                  </span>
                  <span className="font-medium text-gray-900">
                    {campaign.requiredFollowers.toLocaleString()}명 이상
                  </span>
                </div>
              </div>

              {/* 통계 및 액션 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {campaign.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {campaign.applicantCount}명 지원
                  </span>
                </div>
                <a
                  href={`/campaigns/${campaign.id}`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  상세보기
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 결과가 없을 때 */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <Filter className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600">다른 검색어나 필터를 시도해보세요</p>
        </div>
      )}
    </div>
  );
}