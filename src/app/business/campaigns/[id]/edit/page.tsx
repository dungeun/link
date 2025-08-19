'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Calendar, Image } from 'lucide-react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { cn } from '@/lib/utils'

import { PLATFORM_OPTIONS } from '@/constants/platforms'

// 플랫폼 옵션은 통합 상수에서 가져옴
const PLATFORMS = PLATFORM_OPTIONS

// 캠페인 상태 옵션
const CAMPAIGN_STATUS = [
  { value: 'DRAFT', label: '초안' },
  { value: 'ACTIVE', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소됨' }
]

export default function EditCampaignPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const campaignId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingCampaign, setLoadingCampaign] = useState(true)
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'INSTAGRAM',
    budget: 0,
    targetFollowers: 0,
    maxApplicants: 100,
    requirements: '',
    hashtags: [] as string[],
    startDate: '',
    endDate: '',
    applicationStartDate: '',
    applicationEndDate: '',
    contentStartDate: '',
    contentEndDate: '',
    resultAnnouncementDate: '',
    announcementDate: '',
    provisionDetails: '',
    campaignMission: '',
    keywords: '',
    additionalNotes: '',
    youtubeUrl: '',
    status: 'ACTIVE'
  })

  // 이미지 상태
  const [headerImage, setHeaderImage] = useState<string>('')
  const [thumbnailImage, setThumbnailImage] = useState<string>('')
  const [productImages, setProductImages] = useState<string[]>([])
  const [detailImages, setDetailImages] = useState<string[]>([])

  // 기존 캠페인 데이터 로드
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          toast({
            title: '인증 필요',
            description: '로그인이 필요합니다.',
            variant: 'destructive'
          })
          router.push('/login')
          return
        }

        const response = await fetch(`/api/campaigns/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.status === 401) {
          // 토큰이 만료되었거나 유효하지 않음
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          toast({
            title: '세션 만료',
            description: '다시 로그인해주세요.',
            variant: 'destructive'
          })
          router.push('/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '캠페인을 불러올 수 없습니다.')
        }

        const data = await response.json()
        const campaign = data.campaign

        // 폼 데이터 설정
        setFormData({
          title: campaign.title || '',
          description: campaign.description || '',
          platform: campaign.platforms?.[0] || campaign.platform || 'INSTAGRAM',
          budget: campaign.budget || 0,
          targetFollowers: campaign.targetFollowers || 0,
          maxApplicants: campaign.maxApplicants || 100,
          requirements: campaign.requirements || '',
          hashtags: campaign.hashtags || [],
          startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
          endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
          applicationStartDate: campaign.applicationStartDate ? new Date(campaign.applicationStartDate).toISOString().split('T')[0] : '',
          applicationEndDate: campaign.applicationEndDate ? new Date(campaign.applicationEndDate).toISOString().split('T')[0] : '',
          contentStartDate: campaign.contentStartDate ? new Date(campaign.contentStartDate).toISOString().split('T')[0] : '',
          contentEndDate: campaign.contentEndDate ? new Date(campaign.contentEndDate).toISOString().split('T')[0] : '',
          resultAnnouncementDate: campaign.resultAnnouncementDate ? new Date(campaign.resultAnnouncementDate).toISOString().split('T')[0] : '',
          announcementDate: campaign.announcementDate ? new Date(campaign.announcementDate).toISOString().split('T')[0] : '',
          provisionDetails: campaign.provisionDetails || '',
          campaignMission: campaign.campaignMission || '',
          keywords: campaign.keywords || '',
          additionalNotes: campaign.additionalNotes || '',
          youtubeUrl: campaign.youtubeUrl || '',
          status: campaign.status || 'ACTIVE'
        })

        // 이미지 설정
        setHeaderImage(campaign.headerImageUrl || '')
        setThumbnailImage(campaign.thumbnailImageUrl || '')
        setProductImages(campaign.productImages || [])
        setDetailImages(campaign.detailImages || [])

      } catch (error) {
        console.error('Failed to load campaign:', error)
        toast({
          title: '오류',
          description: error instanceof Error ? error.message : '캠페인을 불러올 수 없습니다.',
          variant: 'destructive'
        })
        // 로그인 관련 오류가 아닌 경우에만 캠페인 목록으로 이동
        if (error instanceof Error && !error.message.includes('로그인') && !error.message.includes('세션')) {
          router.push('/business/campaigns')
        }
      } finally {
        setLoadingCampaign(false)
      }
    }

    loadCampaign()
  }, [campaignId, router, toast])

  // 캠페인 수정 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({
          ...formData,
          youtubeUrl: formData.youtubeUrl,
          headerImageUrl: headerImage,
          thumbnailImageUrl: thumbnailImage,
          productImages,
          detailImages,
          imageUrl: thumbnailImage || headerImage // 메인 이미지
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '캠페인 수정에 실패했습니다.')
      }

      toast({
        title: '캠페인이 성공적으로 수정되었습니다.'
      })

      router.push(`/business/campaigns/${campaignId}`)
    } catch (error) {
      console.error('Failed to update campaign:', error)
      toast({
        title: error instanceof Error ? error.message : '캠페인 수정에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 해시태그 추가
  const addHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault()
      const newTag = e.currentTarget.value.replace('#', '').trim()
      if (newTag && !formData.hashtags.includes(newTag)) {
        setFormData({
          ...formData,
          hashtags: [...formData.hashtags, newTag]
        })
      }
      e.currentTarget.value = ''
    }
  }

  // 해시태그 제거
  const removeHashtag = (tag: string) => {
    setFormData({
      ...formData,
      hashtags: formData.hashtags.filter(t => t !== tag)
    })
  }

  if (loadingCampaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>캠페인 정보를 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 영역 개선 */}
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">캠페인 수정</h1>
                <p className="text-gray-600 mt-2">캠페인 정보를 수정하고 업데이트합니다.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">캠페인 ID</p>
                <p className="font-mono text-xs text-gray-600">{campaignId}</p>
              </div>
            </div>
          </div>

        {/* 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">캠페인 제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">캠페인 설명 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">플랫폼 *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({...formData, platform: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(platform => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">캠페인 상태</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_STATUS.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget">예산</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="targetFollowers">타겟 팔로워 수</Label>
                  <Input
                    id="targetFollowers"
                    type="number"
                    value={formData.targetFollowers}
                    onChange={(e) => setFormData({...formData, targetFollowers: Number(e.target.value)})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxApplicants">최대 지원자 수</Label>
                  <Input
                    id="maxApplicants"
                    type="number"
                    value={formData.maxApplicants}
                    onChange={(e) => setFormData({...formData, maxApplicants: Number(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">일정 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">캠페인 시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate">캠페인 종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="applicationStartDate">지원 시작일</Label>
                <Input
                  id="applicationStartDate"
                  type="date"
                  value={formData.applicationStartDate}
                  onChange={(e) => setFormData({...formData, applicationStartDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="applicationEndDate">지원 마감일</Label>
                <Input
                  id="applicationEndDate"
                  type="date"
                  value={formData.applicationEndDate}
                  onChange={(e) => setFormData({...formData, applicationEndDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contentStartDate">콘텐츠 제작 시작일</Label>
                <Input
                  id="contentStartDate"
                  type="date"
                  value={formData.contentStartDate}
                  onChange={(e) => setFormData({...formData, contentStartDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contentEndDate">콘텐츠 제작 종료일</Label>
                <Input
                  id="contentEndDate"
                  type="date"
                  value={formData.contentEndDate}
                  onChange={(e) => setFormData({...formData, contentEndDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="resultAnnouncementDate">결과 발표일</Label>
                <Input
                  id="resultAnnouncementDate"
                  type="date"
                  value={formData.resultAnnouncementDate}
                  onChange={(e) => setFormData({...formData, resultAnnouncementDate: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="announcementDate">공지일</Label>
                <Input
                  id="announcementDate"
                  type="date"
                  value={formData.announcementDate}
                  onChange={(e) => setFormData({...formData, announcementDate: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">상세 정보</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="requirements">요구사항</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="campaignMission">캠페인 미션</Label>
                <Textarea
                  id="campaignMission"
                  value={formData.campaignMission}
                  onChange={(e) => setFormData({...formData, campaignMission: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="provisionDetails">제공 내역</Label>
                <Textarea
                  id="provisionDetails"
                  value={formData.provisionDetails}
                  onChange={(e) => setFormData({...formData, provisionDetails: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="keywords">키워드</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="콤마로 구분하여 입력"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>해시태그</Label>
                <Input
                  placeholder="해시태그 입력 후 Enter"
                  onKeyDown={addHashtag}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.hashtags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  YouTube 링크가 있다면 입력해주세요 (선택사항)
                </p>
              </div>

              <div>
                <Label htmlFor="additionalNotes">추가 안내사항</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">이미지</h2>
            
            <div className="space-y-6">
              <div>
                <Label>헤더 이미지</Label>
                <ImageUpload
                  value={headerImage}
                  onChange={(value) => setHeaderImage(Array.isArray(value) ? value[0] || '' : value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>썸네일 이미지</Label>
                <ImageUpload
                  value={thumbnailImage}
                  onChange={(value) => setThumbnailImage(Array.isArray(value) ? value[0] || '' : value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>제품 이미지</Label>
                <div className="space-y-4 mt-2">
                  {/* 썸네일 그리드 뷰 */}
                  <div className="grid grid-cols-4 gap-4">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`Product ${idx + 1}`} 
                          className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90" 
                          onClick={() => window.open(img, '_blank')}
                        />
                        <button
                          type="button"
                          onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500/90 backdrop-blur text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <ImageUpload
                      value=""
                      onChange={(value) => {
                        const url = Array.isArray(value) ? value[0] || '' : value;
                        if (url) setProductImages([...productImages, url]);
                      }}
                      className="h-24"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>상세 이미지</Label>
                <div className="space-y-4 mt-2">
                  {/* 이미지 미리보기 영역 - 스크롤 가능한 컨테이너 */}
                  {detailImages.length > 0 && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="max-h-96 overflow-y-auto space-y-4">
                        {detailImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={img} 
                              alt={`Detail ${idx + 1}`} 
                              className="w-full rounded border bg-white cursor-pointer transition-opacity hover:opacity-90"
                              onClick={() => window.open(img, '_blank')}
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(img, '_blank')}
                                className="bg-white/90 backdrop-blur text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-white"
                                title="원본 보기"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailImages(detailImages.filter((_, i) => i !== idx))}
                                className="bg-red-500/90 backdrop-blur text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-500"
                                title="삭제"
                              >
                                ×
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              이미지 {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        클릭하여 원본 크기로 보기 • 스크롤하여 더 많은 이미지 보기
                      </p>
                    </div>
                  )}
                  
                  {/* 이미지 추가 버튼 */}
                  <div>
                    <ImageUpload
                      value=""
                      onChange={(value) => {
                        const url = Array.isArray(value) ? value[0] || '' : value;
                        if (url) setDetailImages([...detailImages, url]);
                      }}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      상세 이미지를 추가하려면 클릭하세요 (긴 이미지도 지원됩니다)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 제출 버튼 영역 - 개선된 레이아웃 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 border-l-4 border-indigo-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                <span className="font-medium">변경사항을 저장하시겠습니까?</span>
                <p className="text-xs text-gray-500 mt-1">수정된 내용은 즉시 적용됩니다.</p>
              </div>
              <div className="flex space-x-4 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="flex-1 sm:flex-none min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      수정 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      캠페인 수정
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}