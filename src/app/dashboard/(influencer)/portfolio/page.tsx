'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Grid, List, Eye, Heart, MessageSquare, 
  Instagram, Youtube, Twitter, ExternalLink, Edit, 
  Trash2, MoreVertical, Image as ImageIcon, Video,
  TrendingUp, Award, BarChart3, Star
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'blog' | 'twitter';
  type: 'image' | 'video' | 'article';
  url: string;
  thumbnailUrl: string;
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
    brand: string;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares?: number;
    engagementRate?: number;
  };
  tags: string[];
  featured: boolean;
}

interface PortfolioStats {
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  avgEngagementRate: number;
  topPlatform: string;
  completedCampaigns: number;
}

export default function PortfolioPage() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'engagement'>('recent');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock 데이터
  const mockPortfolioItems: PortfolioItem[] = [
    {
      id: '1',
      title: '여름 스킨케어 루틴 공유',
      description: '글로우 코스메틱 선크림과 수분크림을 활용한 여름 스킨케어 루틴을 소개합니다.',
      platform: 'instagram',
      type: 'image',
      url: 'https://instagram.com/p/portfolio1',
      thumbnailUrl: '/images/portfolio/skincare-routine.jpg',
      createdAt: '2024-06-25',
      campaign: {
        id: '1',
        title: '여름 신제품 뷰티 리뷰 캠페인',
        brand: '글로우 코스메틱'
      },
      metrics: {
        views: 15420,
        likes: 2834,
        comments: 189,
        shares: 456,
        engagementRate: 18.4
      },
      tags: ['뷰티', '스킨케어', '여름'],
      featured: true
    },
    {
      id: '2',
      title: '홈트레이닝 운동복 리뷰',
      description: '액티브 스포츠의 신제품 레깅스와 스포츠 브라 착용 리뷰입니다.',
      platform: 'youtube',
      type: 'video',
      url: 'https://youtube.com/watch?v=portfolio2',
      thumbnailUrl: '/images/portfolio/workout-review.jpg',
      createdAt: '2024-06-20',
      campaign: {
        id: '2',
        title: '프리미엄 피트니스 웨어 착용 리뷰',
        brand: '액티브 스포츠'
      },
      metrics: {
        views: 32100,
        likes: 1920,
        comments: 234,
        engagementRate: 6.7
      },
      tags: ['운동', '피트니스', '패션'],
      featured: true
    },
    {
      id: '3',
      title: '제주도 맛집 탐방기',
      description: '제주도 로컬 맛집 5곳을 소개하는 블로그 포스팅입니다.',
      platform: 'blog',
      type: 'article',
      url: 'https://blog.naver.com/portfolio3',
      thumbnailUrl: '/images/portfolio/jeju-food.jpg',
      createdAt: '2024-06-15',
      metrics: {
        views: 8750,
        likes: 523,
        comments: 67,
        engagementRate: 6.7
      },
      tags: ['여행', '맛집', '제주도'],
      featured: false
    },
    {
      id: '4',
      title: '데일리 메이크업 튜토리얼',
      description: '5분 만에 완성하는 자연스러운 데일리 메이크업 튜토리얼',
      platform: 'tiktok',
      type: 'video',
      url: 'https://tiktok.com/@user/video/portfolio4',
      thumbnailUrl: '/images/portfolio/makeup-tutorial.jpg',
      createdAt: '2024-06-10',
      metrics: {
        views: 125000,
        likes: 18900,
        comments: 1523,
        shares: 3421,
        engagementRate: 19.1
      },
      tags: ['뷰티', '메이크업', '튜토리얼'],
      featured: true
    }
  ];

  const mockStats: PortfolioStats = {
    totalContent: 47,
    totalViews: 523420,
    totalLikes: 42384,
    avgEngagementRate: 12.3,
    topPlatform: 'Instagram',
    completedCampaigns: 23
  };

  const platforms = [
    { value: 'all', label: '전체', icon: null },
    { value: 'instagram', label: '인스타그램', icon: Instagram },
    { value: 'youtube', label: '유튜브', icon: Youtube },
    { value: 'tiktok', label: '틱톡', icon: null },
    { value: 'blog', label: '블로그', icon: null },
    { value: 'twitter', label: '트위터', icon: Twitter }
  ];

  useEffect(() => {
    setTimeout(() => {
      setPortfolioItems(mockPortfolioItems);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredAndSortedItems = portfolioItems
    .filter(item => selectedPlatform === 'all' || item.platform === selectedPlatform)
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.metrics.views - a.metrics.views;
        case 'engagement':
          return (b.metrics.engagementRate || 0) - (a.metrics.engagementRate || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">포트폴리오</h1>
          <p className="text-gray-600">나의 콘텐츠를 관리하고 성과를 분석하세요</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          콘텐츠 추가
        </button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">전체</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContent}</p>
            <p className="text-xs text-gray-600 mt-1">콘텐츠</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">누적</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</p>
            <p className="text-xs text-gray-600 mt-1">조회수</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">누적</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</p>
            <p className="text-xs text-gray-600 mt-1">좋아요</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">평균</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgEngagementRate}%</p>
            <p className="text-xs text-gray-600 mt-1">참여율</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">최고</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.topPlatform}</p>
            <p className="text-xs text-gray-600 mt-1">플랫폼</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">완료</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedCampaigns}</p>
            <p className="text-xs text-gray-600 mt-1">캠페인</p>
          </div>
        </div>
      )}

      {/* 필터 및 뷰 옵션 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 플랫폼 필터 */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {platforms.map(platform => (
              <button
                key={platform.value}
                onClick={() => setSelectedPlatform(platform.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                  selectedPlatform === platform.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {platform.icon && <platform.icon className="h-4 w-4" />}
                {platform.label}
              </button>
            ))}
          </div>

          {/* 정렬 및 뷰 옵션 */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'engagement')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="recent">최신순</option>
              <option value="popular">인기순</option>
              <option value="engagement">참여율순</option>
            </select>

            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Grid className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <List className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 포트폴리오 그리드/리스트 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* 썸네일 */}
              <div className="relative aspect-square bg-gray-200">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/portfolio-placeholder.jpg';
                  }}
                />
                {item.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                    Featured
                  </div>
                )}
                <div className="absolute top-2 right-2 p-1 bg-white rounded-full">
                  {getPlatformIcon(item.platform)}
                </div>
                <div className="absolute bottom-2 left-2">
                  {item.type === 'video' ? (
                    <Video className="h-5 w-5 text-white drop-shadow" />
                  ) : item.type === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-white drop-shadow" />
                  ) : null}
                </div>
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                
                {/* 캠페인 정보 */}
                {item.campaign && (
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">{item.campaign.brand}</span>
                  </div>
                )}

                {/* 메트릭 */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatNumber(item.metrics.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {formatNumber(item.metrics.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {formatNumber(item.metrics.comments)}
                  </span>
                  {item.metrics.engagementRate && (
                    <span className="font-medium text-green-600">
                      {item.metrics.engagementRate}%
                    </span>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="p-1 text-gray-600 hover:text-gray-800 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* 썸네일 */}
                <div className="relative w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/portfolio-placeholder.jpg';
                    }}
                  />
                  {item.featured && (
                    <div className="absolute top-1 left-1 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                      Featured
                    </div>
                  )}
                </div>

                {/* 내용 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      {item.campaign && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">{item.campaign.brand}</span> · {item.campaign.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(item.platform)}
                      <button className="p-1 text-gray-600 hover:text-gray-800">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 메트릭 및 액션 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatNumber(item.metrics.views)} 조회
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatNumber(item.metrics.likes)} 좋아요
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {formatNumber(item.metrics.comments)} 댓글
                      </span>
                      {item.metrics.engagementRate && (
                        <span className="font-medium text-green-600">
                          참여율 {item.metrics.engagementRate}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        보기
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg">
          <div className="text-gray-400 mb-4">
            <ImageIcon className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 비어있습니다</h3>
          <p className="text-gray-600 mb-4">
            첫 번째 콘텐츠를 추가하여 포트폴리오를 시작하세요
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            콘텐츠 추가
          </button>
        </div>
      )}
    </div>
  );
}