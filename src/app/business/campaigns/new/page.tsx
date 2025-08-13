'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useTemplates } from '@/hooks/useSharedData'
import { invalidateCache } from '@/hooks/useCachedData'
import { Save, Trash2, Youtube, Users } from 'lucide-react'

// Component imports
import StepBasicInfo from '@/components/business/campaign-form/StepBasicInfo'
import StepDetails from '@/components/business/campaign-form/StepDetails'
import StepMedia from '@/components/business/campaign-form/StepMedia'
import StepPayment from '@/components/business/campaign-form/StepPayment'
import TemplateModal from '@/components/business/campaign-form/TemplateModal'
import QuestionPreview from '@/components/business/campaign-form/QuestionPreview'
import QuestionEditorModal from '@/components/business/campaign-form/QuestionEditorModal'
import { DynamicQuestion } from '@/components/business/campaign-form/DynamicQuestions'

// 플랫폼 아이콘 컴포넌트들
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
)

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.94 14.036c-.233.624-.43 1.2-.606 1.783.96-.697 2.101-1.139 3.418-1.304 2.513-.314 4.746-1.973 5.876-4.058l-1.456-1.455c-.706 1.263-2.188 2.548-4.062 2.805-1.222.167-2.415.642-3.17 1.229zM16 2.5c-1.621 0-3.128.665-4.2 1.737L9.063 6.975c-1.075 1.072-1.737 2.579-1.737 4.2 0 3.268 2.732 6 6 6s6-2.732 6-6-2.732-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.846 0 3.543-.497 5.02-1.327l-1.411-1.411C14.5 19.775 13.295 20 12 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.295-.225 2.5-.738 3.609l1.411 1.411C21.503 15.543 22 13.846 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

const platformIcons = {
  INSTAGRAM: <InstagramIcon />,
  YOUTUBE: <Youtube className="w-6 h-6" />,
  TIKTOK: <TikTokIcon />,
  FACEBOOK: <Users className="w-6 h-6" />,
  X: <XIcon />,
  NAVERBLOG: <BlogIcon />
}

interface CampaignTemplate {
  id: string
  name: string
  description?: string
  data: any
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: '',
    budget: '',
    targetFollowers: '',
    startDate: '',
    endDate: '',
    announcementDate: '',
    requirements: '',
    hashtags: '',
    headerImageUrl: '',  // 상세페이지 헤더 배경 이미지
    thumbnailImageUrl: '',  // 썸네일 이미지
    youtubeUrl: '',
    maxApplicants: '',
    // 새로운 필드들
    applicationStartDate: '',
    applicationEndDate: '',
    contentStartDate: '',
    contentEndDate: '',
    resultAnnouncementDate: '',
    provisionDetails: '',
    campaignMission: '',
    keywords: '',
    additionalNotes: ''
  })
  
  // Product images (상품소개 이미지 3장)
  const [productImages, setProductImages] = useState<string[]>([])
  
  // Dynamic questions
  const defaultQuestions: DynamicQuestion[] = [
    {
      id: 'camera',
      type: 'select',
      question: '어떤 카메라를 사용하시나요?',
      options: ['휴대폰 카메라', '미러리스', 'DSLR', '기타'],
      required: true,
      enabled: true
    },
    {
      id: 'face_exposure',
      type: 'select',
      question: '포스팅 작성 시, 얼굴 노출이 가능한가요?',
      options: ['노출', '비노출'],
      required: true,
      enabled: true
    },
    {
      id: 'job',
      type: 'text',
      question: '어떤 직업을 갖고 계시나요?',
      required: true,
      enabled: true
    },
    {
      id: 'address',
      type: 'address' as const,
      question: '상품을 배송 받을 주소를 입력해 주세요.',
      required: true,
      useDefaultAddress: true,
      enabled: true
    }
  ]
  
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>(defaultQuestions)
  
  // Template states - 캐싱된 데이터 사용
  const { data: templatesData, isLoading: loadingTemplates, refetch: refetchTemplates } = useTemplates('campaign')
  const templates = templatesData || []
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  // Question editor state
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  
  // Payment info
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CARD')
  const platformFee = formData.budget ? Number(formData.budget) * 0.1 : 0
  
  const saveTemplate = async () => {
    if (!templateName) {
      toast({
        title: '템플릿 이름을 입력해주세요.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const response = await fetch('/api/business/campaign-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          data: formData
        })
      })
      
      if (response.ok) {
        toast({
          title: '템플릿이 저장되었습니다.',
        })
        setShowTemplateModal(false)
        setTemplateName('')
        setTemplateDescription('')
        // 캐시 무효화하여 템플릿 목록 갱신
        invalidateCache(`campaign_templates`)
        refetchTemplates()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      toast({
        title: '템플릿 저장에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }
  
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template && template.data) {
      setFormData({ ...formData, ...template.data })
      setSelectedTemplate(templateId)
      toast({
        title: '템플릿을 불러왔습니다.',
      })
    }
  }
  
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return
    
    try {
      const response = await fetch(`/api/business/campaign-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (response.ok) {
        toast({
          title: '템플릿이 삭제되었습니다.',
        })
        // 캐시 무효화하여 템플릿 목록 갱신
        invalidateCache(`campaign_templates`)
        refetchTemplates()
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast({
        title: '템플릿 삭제에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }
  
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.title || !formData.description || !formData.platform) {
          setError('모든 필수 정보를 입력해주세요.')
          return false
        }
        break
      case 2:
        if (!formData.budget || !formData.targetFollowers || !formData.startDate || !formData.endDate || !formData.announcementDate) {
          setError('모든 필수 정보를 입력해주세요.')
          return false
        }
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
          setError('종료일은 시작일 이후여야 합니다.')
          return false
        }
        if (new Date(formData.announcementDate) > new Date(formData.startDate)) {
          setError('발표일은 캠페인 시작일 이전이어야 합니다.')
          return false
        }
        break
      case 3:
        if (!formData.headerImageUrl || !formData.thumbnailImageUrl) {
          setError('헤더 배경 이미지와 썸네일 이미지를 모두 업로드해주세요.')
          return false
        }
        const emptyProductImages = productImages.filter(img => !img).length
        if (emptyProductImages === 3) {
          setError('최소 1개 이상의 상품 이미지를 업로드해주세요.')
          return false
        }
        break
    }
    setError('')
    return true
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setLoading(true)
    setError('')
    
    try {
      // Create campaign
      const campaignData = {
        ...formData,
        budget: Number(formData.budget),
        targetFollowers: Number(formData.targetFollowers),
        maxApplicants: Number(formData.maxApplicants) || 100,
        productImages: productImages.filter(img => img !== ''),  // 빈 문자열 제거
        questions: dynamicQuestions.filter(q => q.enabled !== false),
        // 새로운 필드들 (빈 문자열인 경우 null로 변환)
        applicationStartDate: formData.applicationStartDate || null,
        applicationEndDate: formData.applicationEndDate || null,
        contentStartDate: formData.contentStartDate || null,
        contentEndDate: formData.contentEndDate || null,
        resultAnnouncementDate: formData.resultAnnouncementDate || null,
        provisionDetails: formData.provisionDetails || null,
        campaignMission: formData.campaignMission || null,
        keywords: formData.keywords || null,
        additionalNotes: formData.additionalNotes || null
      }
      
      const response = await fetch('/api/business/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify(campaignData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        // 구체적인 에러 메시지 표시
        if (error.missingFields) {
          throw new Error(error.message || error.error || '캠페인 생성 실패')
        }
        throw new Error(error.error || '캠페인 생성 실패')
      }
      
      const data = await response.json()
      const createdCampaignId = data.data.id
      
      // 계좌이체인 경우 바로 결제 완료 처리
      if (selectedPaymentMethod === 'TRANSFER') {
        // 계좌이체는 바로 결제 완료 처리
        const paymentData = {
          orderId: `campaign_${createdCampaignId}_${Date.now()}`,
          amount: Number(formData.budget) + platformFee,
          orderName: `캠페인: ${formData.title}`,
          customerName: '비즈니스',
          campaignId: createdCampaignId,
          method: 'TRANSFER',
          status: 'COMPLETED'
        }
        
        const paymentResponse = await fetch('/api/payments/direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          },
          body: JSON.stringify(paymentData)
        })
        
        if (!paymentResponse.ok) {
          throw new Error('계좌이체 결제 처리 실패')
        }
        
        // 캠페인 상태 업데이트
        const updateResponse = await fetch(`/api/business/campaigns/${createdCampaignId}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          }
        })
        
        if (!updateResponse.ok) {
          throw new Error('캠페인 활성화 실패')
        }
        
        toast({
          title: '캠페인이 성공적으로 생성되었습니다!',
          description: '계좌이체로 결제가 완료되었습니다.',
        })
        
        // 캠페인 상세 페이지로 이동
        router.push(`/business/campaigns/${createdCampaignId}`)
      } else {
        // 신용카드나 휴대폰 결제는 토스페이먼츠 사용
        const paymentData = {
          orderId: `campaign_${createdCampaignId}_${Date.now()}`,
          amount: Number(formData.budget) + platformFee,
          orderName: `캠페인: ${formData.title}`,
          customerName: '비즈니스',
          successUrl: `${window.location.origin}/business/campaigns/${createdCampaignId}/payment/success`,
          failUrl: `${window.location.origin}/business/campaigns/${createdCampaignId}/payment/fail`,
          method: selectedPaymentMethod
        }
        
        const paymentResponse = await fetch('/api/payments/prepare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          },
          body: JSON.stringify(paymentData)
        })
        
        if (!paymentResponse.ok) {
          throw new Error('결제 준비 실패')
        }
        
        const paymentResult = await paymentResponse.json()
        
        // Redirect to payment page
        if (paymentResult.paymentUrl) {
          window.location.href = paymentResult.paymentUrl
        } else {
          // For Toss Payments widget integration
          const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
          if (!clientKey) throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
          
          const { loadTossPayments } = await import('@tosspayments/payment-sdk')
          const tossPayments = await loadTossPayments(clientKey)
          
          await tossPayments.requestPayment(selectedPaymentMethod === 'CARD' ? '카드' : '휴대폰', {
            amount: paymentData.amount,
            orderId: paymentData.orderId,
            orderName: paymentData.orderName,
            customerName: paymentData.customerName,
            successUrl: paymentData.successUrl,
            failUrl: paymentData.failUrl
          })
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(errorMessage)
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const steps = [
    { number: 1, title: '기본 정보' },
    { number: 2, title: '상세 정보' },
    { number: 3, title: '이미지 업로드' },
    { number: 4, title: '결제' }
  ]
  
  const progress = (currentStep / steps.length) * 100
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">새 캠페인 만들기</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">캠페인 정보를 입력하여 인플루언서를 모집하세요.</p>
            </div>
            
            {/* Template buttons - 모바일 최적화 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateModal(true)}
                className="text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                템플릿 저장
              </Button>
              <Select value={selectedTemplate || ''} onValueChange={(value) => value && loadTemplate(value)}>
                <SelectTrigger className="w-full sm:w-48 text-sm">
                  <SelectValue placeholder={loadingTemplates ? "로딩 중..." : "템플릿 불러오기"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      저장된 템플릿이 없습니다.
                    </div>
                  ) : (
                    templates.map(template => (
                      <div key={template.id} className="relative group">
                        <SelectItem value={template.id}>
                          <div className="pr-8">
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500">{template.description}</div>
                            )}
                          </div>
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Progress bar - 모바일 최적화 */}
        <div className="mb-6 sm:mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3 sm:mt-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center flex-1 ${
                  currentStep >= step.number ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  currentStep >= step.number ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                }`}>
                  {step.number}
                </div>
                <span className="text-xs sm:text-sm mt-1 sm:mt-2 text-center leading-tight">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Form content - 모바일 최적화 */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {currentStep === 1 && (
            <StepBasicInfo
              formData={formData}
              setFormData={setFormData}
              platformIcons={platformIcons}
            />
          )}
          
          {currentStep === 2 && (
            <>
              <StepDetails
                formData={formData}
                setFormData={setFormData}
              />
              <QuestionPreview
                questions={dynamicQuestions}
                onEditClick={() => setShowQuestionEditor(true)}
                onQuestionToggle={(questionId, enabled) => {
                  setDynamicQuestions(
                    dynamicQuestions.map(q => 
                      q.id === questionId ? { ...q, enabled } : q
                    )
                  )
                }}
              />
            </>
          )}
          
          {currentStep === 3 && (
            <StepMedia
              formData={formData}
              setFormData={setFormData}
              productImages={productImages}
              setProductImages={setProductImages}
            />
          )}
          
          {currentStep === 4 && (
            <>
              <StepPayment
                budget={Number(formData.budget)}
                platformFee={platformFee}
              />
              
              <div className="mt-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-3">결제 방법 선택</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CARD')}
                    className={`p-4 sm:p-3 rounded-lg border-2 transition-all touch-manipulation ${
                      selectedPaymentMethod === 'CARD'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2 sm:mb-2">
                        <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="font-medium text-sm sm:text-sm">신용카드</div>
                      <p className="text-xs text-gray-600 mt-1 sm:mt-1">
                        모든 카드 결제 가능
                      </p>
                      {selectedPaymentMethod === 'CARD' && (
                        <div className="mt-2 flex justify-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('TRANSFER')}
                    className={`p-4 sm:p-3 rounded-lg border-2 transition-all touch-manipulation ${
                      selectedPaymentMethod === 'TRANSFER'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2 sm:mb-2">
                        <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div className="font-medium text-sm sm:text-sm">계좌이체</div>
                      <p className="text-xs text-gray-600 mt-1 sm:mt-1">
                        즉시 결제 처리
                      </p>
                      {selectedPaymentMethod === 'TRANSFER' && (
                        <div className="mt-2 flex justify-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('MOBILE')}
                    className={`p-4 sm:p-3 rounded-lg border-2 transition-all touch-manipulation ${
                      selectedPaymentMethod === 'MOBILE'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2 sm:mb-2">
                        <svg className="w-7 h-7 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="font-medium text-sm sm:text-sm">휴대폰 결제</div>
                      <p className="text-xs text-gray-600 mt-1 sm:mt-1">
                        휴대폰 요금 합산
                      </p>
                      {selectedPaymentMethod === 'MOBILE' && (
                        <div className="mt-2 flex justify-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* 부가세 안내 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">부가세 안내:</span> 표시된 금액은 부가세 포함 금액입니다.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {/* Navigation buttons - 모바일 최적화 */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => router.back() : handlePrev}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium"
            >
              {currentStep === 1 ? '취소' : '이전'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 text-base font-medium"
              >
                다음
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 text-base font-medium"
              >
                {loading ? '처리 중...' : 
                 selectedPaymentMethod === 'TRANSFER' ? '캠페인 생성하기' : '결제하고 캠페인 생성'}
              </Button>
            )}
          </div>
        </div>
      </main>
      
      {/* Template save modal */}
      <TemplateModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        templateName={templateName}
        setTemplateName={setTemplateName}
        templateDescription={templateDescription}
        setTemplateDescription={setTemplateDescription}
        onSave={saveTemplate}
      />
      
      {/* Question Editor Modal */}
      <QuestionEditorModal
        open={showQuestionEditor}
        onOpenChange={setShowQuestionEditor}
        questions={dynamicQuestions}
        onSave={setDynamicQuestions}
      />
    </div>
  )
}