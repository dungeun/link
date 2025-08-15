'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Save, AlertCircle, Plus, X, 
  Calendar, DollarSign, Users, MapPin, Camera, 
  Instagram, Youtube, Twitter, CheckCircle, Info
} from 'lucide-react';

interface CampaignFormData {
  // 기본 정보
  title: string;
  description: string;
  category: string;
  objectives: string[];
  
  // 타겟 설정
  platforms: string[];
  targetGender: 'all' | 'male' | 'female';
  targetAgeMin: number;
  targetAgeMax: number;
  targetRegions: string[];
  minFollowers: number;
  
  // 캠페인 상세
  requirements: string[];
  hashtags: string[];
  mentionAccounts: string[];
  doList: string[];
  dontList: string[];
  
  // 예산 및 일정
  budget: number;
  paymentType: 'fixed' | 'performance';
  applicationDeadline: string;
  contentDeadline: string;
  campaignStartDate: string;
  campaignEndDate: string;
  
  // 미디어
  images: File[];
  referenceUrls: string[];
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    category: '',
    objectives: [],
    platforms: [],
    targetGender: 'all',
    targetAgeMin: 18,
    targetAgeMax: 65,
    targetRegions: [],
    minFollowers: 1000,
    requirements: [''],
    hashtags: [],
    mentionAccounts: [],
    doList: [''],
    dontList: [''],
    budget: 0,
    paymentType: 'fixed',
    applicationDeadline: '',
    contentDeadline: '',
    campaignStartDate: '',
    campaignEndDate: '',
    images: [],
    referenceUrls: ['']
  });

  const steps = [
    { number: 1, title: '기본 정보', icon: Info },
    { number: 2, title: '타겟 설정', icon: Users },
    { number: 3, title: '캠페인 상세', icon: Camera },
    { number: 4, title: '예산 및 일정', icon: Calendar }
  ];

  const categories = [
    { value: 'beauty', label: '뷰티' },
    { value: 'fashion', label: '패션' },
    { value: 'food', label: '음식' },
    { value: 'travel', label: '여행' },
    { value: 'tech', label: '테크' },
    { value: 'lifestyle', label: '라이프스타일' },
    { value: 'sports', label: '스포츠' },
    { value: 'entertainment', label: '엔터테인먼트' }
  ];

  const objectives = [
    { value: 'brand_awareness', label: '브랜드 인지도 향상' },
    { value: 'product_launch', label: '신제품 출시' },
    { value: 'sales_increase', label: '매출 증대' },
    { value: 'content_creation', label: '콘텐츠 제작' },
    { value: 'event_promotion', label: '이벤트 홍보' },
    { value: 'user_engagement', label: '사용자 참여 증대' }
  ];

  const platforms = [
    { value: 'instagram', label: '인스타그램', icon: Instagram },
    { value: 'youtube', label: '유튜브', icon: Youtube },
    { value: 'tiktok', label: '틱톡', icon: null },
    { value: 'blog', label: '블로그', icon: null },
    { value: 'twitter', label: '트위터', icon: Twitter }
  ];

  const regions = [
    '서울', '경기', '인천', '대전', '대구', '부산', 
    '광주', '울산', '세종', '강원', '충북', '충남', 
    '전북', '전남', '경북', '경남', '제주'
  ];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title) newErrors.title = '캠페인 제목을 입력해주세요';
        if (!formData.description) newErrors.description = '캠페인 설명을 입력해주세요';
        if (!formData.category) newErrors.category = '카테고리를 선택해주세요';
        if (formData.objectives.length === 0) newErrors.objectives = '최소 1개 이상의 목표를 선택해주세요';
        break;
      case 2:
        if (formData.platforms.length === 0) newErrors.platforms = '최소 1개 이상의 플랫폼을 선택해주세요';
        if (formData.targetRegions.length === 0) newErrors.targetRegions = '최소 1개 이상의 지역을 선택해주세요';
        break;
      case 3:
        if (formData.requirements.filter(r => r.trim()).length === 0) {
          newErrors.requirements = '최소 1개 이상의 요구사항을 입력해주세요';
        }
        break;
      case 4:
        if (!formData.budget || formData.budget <= 0) newErrors.budget = '예산을 입력해주세요';
        if (!formData.applicationDeadline) newErrors.applicationDeadline = '지원 마감일을 선택해주세요';
        if (!formData.contentDeadline) newErrors.contentDeadline = '콘텐츠 제출 마감일을 선택해주세요';
        if (!formData.campaignStartDate) newErrors.campaignStartDate = '캠페인 시작일을 선택해주세요';
        if (!formData.campaignEndDate) newErrors.campaignEndDate = '캠페인 종료일을 선택해주세요';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 시 캠페인 목록으로 이동
      router.push('/dashboard/campaigns?created=true');
    } catch (error) {
      console.error('캠페인 생성 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field: keyof CampaignFormData, value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }));
  };

  const removeArrayItem = (field: keyof CampaignFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof CampaignFormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* 캠페인 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                캠페인 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: 여름 신제품 뷰티 리뷰 캠페인"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* 캠페인 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                캠페인 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="캠페인에 대한 상세한 설명을 입력해주세요"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* 캠페인 목표 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                캠페인 목표 <span className="text-red-500">*</span> (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {objectives.map(obj => (
                  <label key={obj.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.objectives.includes(obj.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, objectives: [...prev.objectives, obj.value] }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            objectives: prev.objectives.filter(o => o !== obj.value) 
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{obj.label}</span>
                  </label>
                ))}
              </div>
              {errors.objectives && (
                <p className="mt-1 text-sm text-red-600">{errors.objectives}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* 플랫폼 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                플랫폼 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {platforms.map(platform => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => {
                      if (formData.platforms.includes(platform.value)) {
                        setFormData(prev => ({
                          ...prev,
                          platforms: prev.platforms.filter(p => p !== platform.value)
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          platforms: [...prev.platforms, platform.value]
                        }));
                      }
                    }}
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                      formData.platforms.includes(platform.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {platform.icon && <platform.icon className="h-4 w-4" />}
                    {platform.label}
                  </button>
                ))}
              </div>
              {errors.platforms && (
                <p className="mt-1 text-sm text-red-600">{errors.platforms}</p>
              )}
            </div>

            {/* 타겟 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">타겟 성별</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="all"
                    checked={formData.targetGender === 'all'}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetGender: 'all' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">전체</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.targetGender === 'male'}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetGender: 'male' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">남성</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.targetGender === 'female'}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetGender: 'female' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">여성</span>
                </label>
              </div>
            </div>

            {/* 타겟 연령 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">타겟 연령대</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={formData.targetAgeMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAgeMin: parseInt(e.target.value) }))}
                  min="13"
                  max="65"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="number"
                  value={formData.targetAgeMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAgeMax: parseInt(e.target.value) }))}
                  min="13"
                  max="65"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">세</span>
              </div>
            </div>

            {/* 타겟 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타겟 지역 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {regions.map(region => (
                  <label key={region} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetRegions.includes(region)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, targetRegions: [...prev.targetRegions, region] }));
                        } else {
                          setFormData(prev => ({ 
                            ...prev, 
                            targetRegions: prev.targetRegions.filter(r => r !== region) 
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
              {errors.targetRegions && (
                <p className="mt-1 text-sm text-red-600">{errors.targetRegions}</p>
              )}
            </div>

            {/* 최소 팔로워 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최소 팔로워 수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.minFollowers}
                  onChange={(e) => setFormData(prev => ({ ...prev, minFollowers: parseInt(e.target.value) }))}
                  min="0"
                  step="1000"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">명 이상</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">0으로 설정하면 팔로워 수 제한이 없습니다</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* 요구사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                요구사항 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 인스타그램 피드 3개 이상 포스팅"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('requirements', index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                요구사항 추가
              </button>
              {errors.requirements && (
                <p className="mt-1 text-sm text-red-600">{errors.requirements}</p>
              )}
            </div>

            {/* 필수 해시태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">필수 해시태그</label>
              <input
                type="text"
                placeholder="해시태그를 입력하고 Enter를 누르세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const tag = e.currentTarget.value.trim().replace(/^#/, '');
                    if (!formData.hashtags.includes(tag)) {
                      setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeArrayItem('hashtags', index)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 필수 멘션 계정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">필수 멘션 계정</label>
              <input
                type="text"
                placeholder="@계정명을 입력하고 Enter를 누르세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const account = e.currentTarget.value.trim().replace(/^@/, '');
                    if (!formData.mentionAccounts.includes(account)) {
                      setFormData(prev => ({ ...prev, mentionAccounts: [...prev.mentionAccounts, account] }));
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.mentionAccounts.map((account, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    @{account}
                    <button
                      type="button"
                      onClick={() => removeArrayItem('mentionAccounts', index)}
                      className="hover:text-gray-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* DO 리스트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DO 리스트 (권장사항)
              </label>
              <div className="space-y-2">
                {formData.doList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateArrayItem('doList', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 자연스러운 일상 속 착용샷"
                    />
                    {formData.doList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('doList', index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('doList')}
                className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                항목 추가
              </button>
            </div>

            {/* DON&apos;T 리스트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DON&apos;T 리스트 (금지사항)
              </label>
              <div className="space-y-2">
                {formData.dontList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateArrayItem('dontList', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 경쟁사 제품 노출"
                    />
                    {formData.dontList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('dontList', index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('dontList')}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                항목 추가
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* 예산 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                캠페인 예산 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                    min="0"
                    step="10000"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.budget ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="500000"
                  />
                </div>
                <span className="text-sm text-gray-600">원</span>
              </div>
              {errors.budget && (
                <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
              )}
            </div>

            {/* 지급 방식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">지급 방식</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="fixed"
                    checked={formData.paymentType === 'fixed'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentType: 'fixed' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">고정 금액</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="performance"
                    checked={formData.paymentType === 'performance'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentType: 'performance' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">성과 기반</span>
                </label>
              </div>
            </div>

            {/* 일정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지원 마감일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.applicationDeadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationDeadline}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  콘텐츠 제출 마감일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.contentDeadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentDeadline: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.contentDeadline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contentDeadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.contentDeadline}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.campaignStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignStartDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.campaignStartDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.campaignStartDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.campaignStartDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.campaignEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignEndDate: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.campaignEndDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.campaignEndDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.campaignEndDate}</p>
                )}
              </div>
            </div>

            {/* 참고 URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">참고 URL</label>
              <div className="space-y-2">
                {formData.referenceUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateArrayItem('referenceUrls', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                    {formData.referenceUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('referenceUrls', index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addArrayItem('referenceUrls')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                URL 추가
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">캠페인 만들기</h1>
            </div>
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-800"
              onClick={() => router.push('/dashboard/campaigns')}
            >
              취소
            </button>
          </div>
        </div>
      </div>

      {/* 진행 상태 표시 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`ml-3 font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 폼 내용 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {renderStepContent()}
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 font-medium rounded-lg flex items-center gap-2 ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              이전
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                다음
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {saving ? '저장 중...' : '캠페인 생성'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}