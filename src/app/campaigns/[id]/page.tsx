'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUserData } from '@/contexts/UserDataContext'
import { useCampaignData, useTemplates } from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import PageLayout from '@/components/layouts/PageLayout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Heart, 
  Share2, 
  Instagram, 
  Youtube,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit,
  Package,
  FileText
} from 'lucide-react'

// 플랫폼 아이콘 컴포넌트들
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.101-1.139 3.418-1.304 2.513-.314 4.746-1.973 5.876-4.058l-1.456-1.455c-.706 1.263-2.188 2.548-4.062 2.805-1.222.167-2.415.642-3.17 1.229zM16 2.5c-1.621 0-3.128.665-4.2 1.737L9.063 6.975c-1.075 1.072-1.737 2.579-1.737 4.2 0 3.268 2.732 6 6 6s6-2.732 6-6-2.732-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.846 0 3.543-.497 5.02-1.327l-1.411-1.411C14.5 19.775 13.295 20 12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.295-.225 2.5-.738 3.609l1.411 1.411C21.503 15.543 22 13.846 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

interface Campaign {
  id: string
  title: string
  description: string
  business: {
    id: string
    name: string
    logo: string | null
    category: string
  }
  platforms: string[]
  budget: number
  targetFollowers: number
  maxApplicants: number
  startDate: string
  endDate: string
  requirements: string | null
  hashtags: string[]
  imageUrl: string | null
  headerImageUrl: string | null
  thumbnailImageUrl: string | null
  detailImages: string[]
  productImages: string[] | null
  status: string
  createdAt: string
  // 새로운 필드들
  applicationStartDate?: string | null
  applicationEndDate?: string | null
  contentStartDate?: string | null
  contentEndDate?: string | null
  resultAnnouncementDate?: string | null
  provisionDetails?: string | null
  campaignMission?: string | null
  keywords?: string | null
  additionalNotes?: string | null
  announcementDate?: string | null
  _count: {
    applications: number
    likes: number
  }
  applications?: Array<{
    id: string
    status: string
    influencer: {
      id: string
      name: string
      profileImage: string | null
    }
  }>
  isLiked?: boolean
  hasApplied?: boolean
  applicationStatus?: string
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // 캐싱된 데이터 사용
  const { profileData } = useUserData()
  const { data: campaign, isLoading: loading, refetch: refetchCampaign } = useCampaignData(params.id as string)
  
  // 템플릿 로딩 상태
  const [shouldLoadTemplates, setShouldLoadTemplates] = useState(false)
  
  // 템플릿은 모달이 열릴 때만 로드하도록 지연
  const { data: templates = [], refetch: refetchTemplates } = useTemplates('application')
  
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [applying, setApplying] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({
    message: '',
    name: '',
    birthYear: '',
    gender: '',
    phone: '',
    address: ''
  })
  const [useProfileInfo, setUseProfileInfo] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // 캠페인 데이터 로드 시 저장 상태 설정
  useEffect(() => {
    if (campaign) {
      setIsLiked(campaign.isSaved || false)
      setLikeCount(campaign._count?.likes || 0)
      
      // Debug logs removed for production performance
    }
  }, [campaign, user])

  // 프로필 데이터로 폼 초기값 설정
  useEffect(() => {
    if (profileData && user?.type === 'INFLUENCER') {
      setApplyForm(prev => ({
        ...prev,
        name: profileData.name || profileData.realName || '',
        birthYear: profileData.birthYear || profileData.profile?.birthYear || '',
        gender: profileData.gender || profileData.profile?.gender || '',
        phone: profileData.phone || profileData.profile?.phone || '',
        address: profileData.address || profileData.profile?.address || ''
      }))
    }
  }, [profileData, user])

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !applyForm.message.trim()) return

    try {
      const response = await fetch('/api/application-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          content: applyForm.message,
          isPublic: false,
          category: 'general'
        })
      })

      if (response.ok) {
        toast({
          title: '템플릿 저장 완료',
          description: '템플릿이 성공적으로 저장되었습니다.'
        })
        setShowSaveTemplate(false)
        setTemplateName('')
        // 템플릿 캐시 무효화 및 새로고침
        invalidateCache(`application_templates_${user?.id}`)
        await refetchTemplates()
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: '오류',
        description: '템플릿 저장 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setApplyForm(prev => ({ ...prev, message: template.content }))
      setSelectedTemplate(templateId)
    }
  }

  const handleUseProfileInfo = (checked: boolean) => {
    setUseProfileInfo(checked)
    if (checked && profileData) {
      setApplyForm(prev => ({
        ...prev,
        name: profileData.name || '',
        birthYear: profileData.profile?.birthYear || '',
        gender: profileData.profile?.gender || '',
        phone: profileData.profile?.phone || '',
        address: profileData.profile?.address || ''
      }))
    } else if (!checked) {
      setApplyForm(prev => ({
        ...prev,
        name: '',
        birthYear: '',
        gender: '',
        phone: '',
        address: ''
      }))
    }
  }

  // fetchCampaign 함수 제거 - useCampaignData로 대체됨

  const handleLike = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '관심 캠페인에 추가하려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${params.id}/save`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (!response.ok) throw new Error('Failed to toggle save')

      const data = await response.json()
      setIsLiked(data.saved !== false)
      
      // 캐시 무효화하여 관심 목록 갱신
      invalidateCache(`saved_campaigns_${user?.id}`)
      
      toast({
        title: data.saved !== false ? '관심 캠페인 추가' : '관심 캠페인 제거',
        description: data.saved !== false ? '마이페이지에서 확인할 수 있습니다.' : ''
      })
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: '오류',
        description: '좋아요 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleApply = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '캠페인에 지원하려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      router.push('/login')
      return
    }

    if (user.type !== 'INFLUENCER') {
      toast({
        title: '권한 없음',
        description: '인플루언서만 캠페인에 지원할 수 있습니다.',
        variant: 'destructive'
      })
      return
    }

    // 프로필 완성 상태 최종 체크
    if (!profileData?.profileCompleted) {
      toast({
        title: '프로필 완성 필요',
        description: '프로필을 먼저 완성해주세요.',
        variant: 'destructive'
      })
      setShowApplyModal(false)
      if (confirm('프로필 정보를 먼저 완성해주세요. 프로필 수정 페이지로 이동하시겠습니까?')) {
        router.push('/mypage')
      }
      return
    }

    if (!applyForm.message.trim()) {
      toast({
        title: '오류',
        description: '지원 메시지를 작성해주세요.',
        variant: 'destructive'
      })
      return
    }

    setApplying(true)
    
    try {
      const response = await fetch(`/api/campaigns/${params.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: applyForm.message,
          name: applyForm.name,
          birthYear: applyForm.birthYear ? parseInt(applyForm.birthYear) : undefined,
          gender: applyForm.gender,
          phone: applyForm.phone,
          address: applyForm.address
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply')
      }

      const data = await response.json()
      
      // 캐시 무효화하여 지원 목록 갱신
      invalidateCache(`influencer_applications_${user?.id}`)
      
      toast({
        title: '지원 완료',
        description: '캠페인 지원이 완료되었습니다.'
      })
      
      setShowApplyModal(false)
      setApplyForm({
        message: '',
        name: profileData?.name || '',
        birthYear: profileData?.profile?.birthYear || '',
        gender: profileData?.profile?.gender || '',
        phone: profileData?.profile?.phone || '',
        address: profileData?.profile?.address || ''
      })
      setSelectedTemplate('')
      setUseProfileInfo(false)
      
      // 캠페인 캐시 무효화 및 새로고침 (사용자별 캐시)
      invalidateCache(`campaign_${params.id}_${user?.id}`)
      await refetchCampaign()
    } catch (error) {
      console.error('Error applying to campaign:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '지원 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setApplying(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(url)
      toast({
        title: '링크 복사됨',
        description: '캠페인 링크가 클립보드에 복사되었습니다.'
      })
    }
  }


  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5" />
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5" />
      case 'TIKTOK':
        return <TikTokIcon />
      case 'BLOG':
        return <BlogIcon />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">모집 중</Badge>
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">완료</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Always call hooks - use default values when campaign is not available
  const daysLeft = useMemo(() => {
    if (!campaign) return 0
    return calculateDaysLeft(campaign.endDate)
  }, [campaign?.endDate])
  
  const applicationProgress = useMemo(() => {
    if (!campaign) return 0
    return ((campaign._count?.applications || 0) / (campaign.maxApplicants || 1)) * 100
  }, [campaign?._count?.applications, campaign?.maxApplicants])

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!campaign) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">캠페인을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">요청하신 캠페인이 존재하지 않거나 삭제되었습니다.</p>
            <Button asChild>
              <Link href="/campaigns">캠페인 목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
      {/* 헤더 이미지 */}
      <div className="relative h-96 bg-gray-900">
        {campaign.headerImageUrl ? (
          <Image
            src={campaign.headerImageUrl}
            alt={campaign.title}
            fill
            className="object-cover opacity-80"
            priority={true}
            quality={85}
            sizes="100vw"
          />
        ) : campaign.thumbnailImageUrl ? (
          <Image
            src={campaign.thumbnailImageUrl}
            alt={campaign.title}
            fill
            className="object-cover opacity-80"
            priority={true}
            quality={85}
            sizes="100vw"
          />
        ) : campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.title}
            fill
            className="object-cover opacity-80"
            priority={true}
            quality={85}
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600" />
        )}
        
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* 뒤로가기 버튼 */}
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => router.back()}
          >
            ← 뒤로가기
          </Button>
        </div>
        
        {/* 공유 & 좋아요 버튼 */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 캠페인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(campaign.status)}
                    <span className="text-gray-500">|</span>
                    <div className="flex items-center gap-2">
                      {(campaign.platforms || []).map(platform => (
                        <span key={platform} className="flex items-center gap-1 text-gray-600">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 비즈니스 정보 */}
              <Link href={`/business/${campaign.business?.id || ''}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  {campaign.business?.logo ? (
                    <Image
                      src={campaign.business?.logo || ''}
                      alt={campaign.business?.name || ''}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{campaign.business?.name || ''}</h3>
                  <p className="text-sm text-gray-600">{campaign.business?.category || ''}</p>
                </div>
              </Link>

              {/* 탭 메뉴 */}
              <Tabs defaultValue="product" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="product" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    제품 소개
                  </TabsTrigger>
                  <TabsTrigger value="campaign" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    캠페인 내용
                  </TabsTrigger>
                </TabsList>

                {/* 제품 소개 탭 */}
                <TabsContent value="product" className="mt-6">
                  {campaign.productImages && Array.isArray(campaign.productImages) && campaign.productImages.length > 0 ? (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-900">제품 소개</h2>
                      <div className="space-y-6">
                        {(campaign.productImages || []).map((image, index) => (
                          <div key={index} className="relative w-full rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`제품 이미지 ${index + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>제품 이미지가 없습니다.</p>
                    </div>
                  )}
                </TabsContent>

                {/* 캠페인 내용 탭 */}
                <TabsContent value="campaign" className="mt-6 space-y-6">
                  {/* 캠페인 설명 */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">캠페인 소개</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
                  </div>

                  {/* 요구사항 */}
                  {campaign.requirements && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">요구사항</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
                    </div>
                  )}

                  {/* 제공 내역 */}
                  {campaign.provisionDetails && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">제공 내역</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.provisionDetails}</p>
                    </div>
                  )}

                  {/* 캠페인 미션 */}
                  {campaign.campaignMission && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">캠페인 미션</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.campaignMission}</p>
                    </div>
                  )}

                  {/* 키워드 */}
                  {campaign.keywords && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">키워드</h2>
                      <p className="text-gray-700">{campaign.keywords}</p>
                    </div>
                  )}

                  {/* 추가 안내사항 */}
                  {campaign.additionalNotes && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">추가 안내사항</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.additionalNotes}</p>
                    </div>
                  )}

                  {/* 해시태그 */}
                  {campaign.hashtags && Array.isArray(campaign.hashtags) && campaign.hashtags.length > 0 && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">해시태그</h2>
                      <div className="flex flex-wrap gap-2">
                        {(campaign.hashtags || []).map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 상세 이미지 */}
                  {campaign.detailImages && Array.isArray(campaign.detailImages) && campaign.detailImages.length > 0 && (
                    <div className="pt-6 border-t">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">상세 이미지</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(campaign.detailImages || []).map((image, index) => (
                          <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`상세 이미지 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            {/* 캠페인 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">캠페인 정보</h3>
              
              <div className="space-y-4">
                {/* 예산 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    총 예산
                  </span>
                  <span className="font-semibold">₩{(campaign.budget || 0).toLocaleString()}</span>
                </div>

                {/* 모집 인원 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      모집 현황
                    </span>
                    <span className="font-semibold">
                      {campaign._count?.applications || 0}/{campaign.maxApplicants || 0}명
                    </span>
                  </div>
                  <Progress value={applicationProgress} className="h-2" />
                </div>

                {/* 팔로워 요구사항 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    최소 팔로워
                  </span>
                  <span className="font-semibold">{(campaign.targetFollowers || 0).toLocaleString()}명</span>
                </div>

                {/* 캠페인 기간 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    캠페인 기간
                  </span>
                  <span className="font-semibold text-sm">
                    {new Date(campaign.startDate).toLocaleDateString()} ~ {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* 신청 기간 */}
                {(campaign.applicationStartDate || campaign.applicationEndDate) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      신청 기간
                    </span>
                    <span className="font-semibold text-sm">
                      {campaign.applicationStartDate ? new Date(campaign.applicationStartDate).toLocaleDateString() : '시작일 미정'} ~ 
                      {campaign.applicationEndDate ? new Date(campaign.applicationEndDate).toLocaleDateString() : '종료일 미정'}
                    </span>
                  </div>
                )}

                {/* 인플루언서 발표 */}
                {campaign.announcementDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      인플루언서 발표
                    </span>
                    <span className="font-semibold text-sm">
                      {new Date(campaign.announcementDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* 콘텐츠 등록 기간 */}
                {(campaign.contentStartDate || campaign.contentEndDate) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      콘텐츠 등록
                    </span>
                    <span className="font-semibold text-sm">
                      {campaign.contentStartDate ? new Date(campaign.contentStartDate).toLocaleDateString() : '시작일 미정'} ~ 
                      {campaign.contentEndDate ? new Date(campaign.contentEndDate).toLocaleDateString() : '종료일 미정'}
                    </span>
                  </div>
                )}

                {/* 결과 발표 */}
                {campaign.resultAnnouncementDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      결과 발표
                    </span>
                    <span className="font-semibold text-sm">
                      {new Date(campaign.resultAnnouncementDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* 남은 기간 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    마감까지
                  </span>
                  <span className={`font-semibold ${daysLeft <= 3 ? 'text-red-600' : ''}`}>
                    {daysLeft > 0 ? `${daysLeft}일 남음` : '마감됨'}
                  </span>
                </div>

                {/* 좋아요 수 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    관심
                  </span>
                  <span className="font-semibold">{likeCount}명</span>
                </div>
              </div>

              {/* 지원 버튼 */}
              <div className="mt-6 space-y-3">
                {user?.type === 'INFLUENCER' && (
                  <>
                    {/* Debug logs removed for production performance */}
                    
                    {campaign.hasApplied === true ? (
                      <div className="text-center">
                        <Badge className="bg-green-100 text-green-800">
                          {campaign.applicationStatus === 'PENDING' && '지원 완료 (검토 중)'}
                          {campaign.applicationStatus === 'APPROVED' && '승인됨'}
                          {campaign.applicationStatus === 'REJECTED' && '거절됨'}
                          {!campaign.applicationStatus && '상태 확인 중...'}
                        </Badge>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          // 프로필 완성 상태 체크 (DB의 profileCompleted 플래그 사용)
                          if (!profileData?.profileCompleted) {
                            // 프로필 정보가 불완전한 경우
                            if (confirm('프로필 정보를 먼저 완성해주세요. 프로필 수정 페이지로 이동하시겠습니까?')) {
                              router.push('/mypage')
                            }
                          } else {
                            // 프로필 정보가 완전한 경우
                            setShowApplyModal(true)
                          }
                        }}
                        disabled={campaign.status !== 'ACTIVE' || daysLeft === 0}
                      >
                        캠페인 지원하기
                      </Button>
                    )}
                  </>
                )}
                
                {user?.type === 'BUSINESS' && user?.id === campaign.business.id && (
                  <>
                    <Link
                      href={`/business/campaigns/${campaign.id}/edit`}
                      className="block w-full"
                    >
                      <Button className="w-full" size="lg">
                        <Edit className="w-4 h-4 mr-2" />
                        캠페인 수정
                      </Button>
                    </Link>
                    <Link
                      href={`/business/campaigns/${campaign.id}/applicants`}
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full" size="lg">
                        <Users className="w-4 h-4 mr-2" />
                        지원자 관리 ({campaign._count?.applications || 0}명)
                      </Button>
                    </Link>
                  </>
                )}
                
                {user?.type === 'INFLUENCER' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLike}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    {isLiked ? '관심 캠페인 제거' : '관심 캠페인 추가'}
                  </Button>
                )}
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">주의사항</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• 허위 정보 작성 시 불이익이 있을 수 있습니다.</li>
                    <li>• 캠페인 승인 후 취소 시 패널티가 부과됩니다.</li>
                    <li>• 콘텐츠 제작 가이드라인을 반드시 준수해주세요.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 지원 모달 */}
    <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>캠페인 지원하기</DialogTitle>
          <DialogDescription>
            지원자 정보와 지원 메시지를 작성해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">기본 정보</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useProfile"
                  checked={useProfileInfo}
                  onCheckedChange={handleUseProfileInfo}
                />
                <Label 
                  htmlFor="useProfile" 
                  className="text-sm font-normal cursor-pointer"
                >
                  프로필 정보 사용
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름*</Label>
                <Input
                  id="name"
                  placeholder="이름을 입력하세요"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthYear">출생연도*</Label>
                <Select
                  value={applyForm.birthYear}
                  onValueChange={(value) => setApplyForm(prev => ({ ...prev, birthYear: value }))}
                >
                  <SelectTrigger id="birthYear">
                    <SelectValue placeholder="선택해 주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">성별*</Label>
                <Select
                  value={applyForm.gender}
                  onValueChange={(value) => setApplyForm(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="선택해 주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남자</SelectItem>
                    <SelectItem value="female">여자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">연락처*</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  placeholder="주소를 입력하세요"
                  value={applyForm.address}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4" />

          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label>템플릿 선택</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="">직접 작성</option>
              <optgroup label="기본 템플릿">
                {(templates || []).filter(t => t.isPublic && (!t.user || t.user.name === 'LinkPick System')).map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </optgroup>
              {(templates || []).filter(t => !t.isPublic || (t.user && t.user.name !== 'LinkPick System')).length > 0 && (
                <optgroup label="내 템플릿">
                  {(templates || []).filter(t => !t.isPublic || (t.user && t.user.name !== 'LinkPick System')).map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 지원 메시지 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">지원 메시지*</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveTemplate(true)}
                disabled={!applyForm.message.trim()}
              >
                템플릿으로 저장
              </Button>
            </div>
            <Textarea
              id="message"
              placeholder="왜 이 캠페인에 적합한지, 어떤 콘텐츠를 만들 계획인지 등을 자유롭게 작성해주세요."
              className="h-64"
              value={applyForm.message}
              onChange={(e) => {
                setApplyForm(prev => ({ ...prev, message: e.target.value }))
                setSelectedTemplate('')
              }}
              required
            />
            <p className="text-sm text-gray-500">
              캠페인 예산: ₩{(campaign?.budget || 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowApplyModal(false)
              setApplyForm({
                message: '',
                name: profileData?.name || '',
                birthYear: profileData?.profile?.birthYear || '',
                gender: profileData?.profile?.gender || '',
                phone: profileData?.profile?.phone || '',
                address: profileData?.profile?.address || ''
              })
              setSelectedTemplate('')
              setUseProfileInfo(false)
            }}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={applying || !applyForm.message.trim() || !applyForm.name || !applyForm.birthYear || !applyForm.gender || !applyForm.phone}
          >
            {applying ? '지원 중...' : '지원하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 템플릿 저장 모달 */}
    <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>템플릿 저장</DialogTitle>
          <DialogDescription>
            현재 작성한 메시지를 템플릿으로 저장합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">템플릿 이름</Label>
            <Input
              id="templateName"
              placeholder="예: 뷰티 캠페인용 템플릿"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowSaveTemplate(false)
              setTemplateName('')
            }}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </PageLayout>
  )
}