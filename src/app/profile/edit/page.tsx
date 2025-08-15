'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Camera, Mail, Phone, MapPin, Globe, Calendar,
  Instagram, Youtube, Twitter, Facebook, Linkedin,
  Shield, Bell, CreditCard, Key, Save, ArrowLeft,
  CheckCircle, AlertCircle, Upload, X, Link as LinkIcon, Plus
} from 'lucide-react';

interface ProfileData {
  // 기본 정보
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | '';
  bio: string;
  avatar: string;
  
  // 인플루언서 정보
  categories: string[];
  location: string;
  languages: string[];
  
  // 소셜 미디어
  socialMedia: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    blog?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // 계정 설정
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'payment' | 'security'>('profile');
  const [saving, setSaving] = useState(false);
  const [avatar, setProfileImage] = useState<File | null>(null);
  const [avatarPreview, setProfileImagePreview] = useState<string>('');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '김인플루언서',
    email: 'influencer@example.com',
    phone: '010-1234-5678',
    birthDate: '1995-05-15',
    gender: 'female',
    bio: '뷰티와 라이프스타일을 사랑하는 인플루언서입니다. 진정성 있는 리뷰로 여러분과 소통하고 싶어요!',
    avatar: '/images/profile-default.jpg',
    categories: ['beauty', 'lifestyle', 'fashion'],
    location: '서울특별시',
    languages: ['한국어', '영어'],
    socialMedia: {
      instagram: 'beauty_influencer',
      youtube: 'BeautyChannel',
      blog: 'blog.naver.com/beauty',
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
      marketing: false
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
      showPhone: false
    }
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: '국민은행',
      accountNumber: '****-****-****-1234',
      accountHolder: '김인플루언서',
      isDefault: true
    }
  ]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const languages = [
    '한국어', '영어', '중국어', '일본어', '스페인어', '프랑스어'
  ];

  const banks = [
    '국민은행', '신한은행', '우리은행', '하나은행', 'SC제일은행',
    '농협은행', '기업은행', '카카오뱅크', '토스뱅크'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 메시지 표시
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // 비밀번호 유효성 검사
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: '',
      accountNumber: '',
      accountHolder: profileData.name,
      isDefault: bankAccounts.length === 0
    };
    setBankAccounts([...bankAccounts, newAccount]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter(account => account.id !== id));
  };

  const updateBankAccount = (id: string, field: keyof BankAccount, value: string | boolean) => {
    setBankAccounts(bankAccounts.map(account => 
      account.id === id ? { ...account, [field]: value } : account
    ));
  };

  const setDefaultAccount = (id: string) => {
    setBankAccounts(bankAccounts.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
  };

  useEffect(() => {
    setProfileImagePreview(profileData.avatar);
  }, []);

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
              <h1 className="text-xl font-semibold text-gray-900">프로필 설정</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 inline-block mr-2" />
                  프로필 정보
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'account'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Shield className="h-4 w-4 inline-block mr-2" />
                  계정 설정
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'payment'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline-block mr-2" />
                  정산 정보
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Key className="h-4 w-4 inline-block mr-2" />
                  보안
                </button>
              </nav>
            </div>
          </div>

          {/* 프로필 정보 탭 */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* 프로필 이미지 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">프로필 사진</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = '/images/profile-placeholder.jpg';
                      }}
                    />
                    <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>JPG, PNG 형식 지원</p>
                    <p>최대 5MB</p>
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as 'male' | 'female' | 'other' | '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">선택하지 않음</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">활동 지역</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 소개 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">소개</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="자신을 소개해주세요"
                />
                <p className="mt-1 text-sm text-gray-500">{profileData.bio.length}/500</p>
              </div>

              {/* 카테고리 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">활동 카테고리</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map(category => (
                    <label key={category.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.categories.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileData({
                              ...profileData,
                              categories: [...profileData.categories, category.value]
                            });
                          } else {
                            setProfileData({
                              ...profileData,
                              categories: profileData.categories.filter(c => c !== category.value)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 사용 언어 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">사용 가능 언어</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map(language => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        if (profileData.languages.includes(language)) {
                          setProfileData({
                            ...profileData,
                            languages: profileData.languages.filter(l => l !== language)
                          });
                        } else {
                          setProfileData({
                            ...profileData,
                            languages: [...profileData.languages, language]
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        profileData.languages.includes(language)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* 소셜 미디어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">소셜 미디어 계정</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-gray-600" />
                    <input
                      type="text"
                      value={profileData.socialMedia.instagram || ''}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialMedia: { ...profileData.socialMedia, instagram: e.target.value }
                      })}
                      placeholder="인스타그램 아이디"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Youtube className="h-5 w-5 text-gray-600" />
                    <input
                      type="text"
                      value={profileData.socialMedia.youtube || ''}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialMedia: { ...profileData.socialMedia, youtube: e.target.value }
                      })}
                      placeholder="유튜브 채널명"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <input
                      type="text"
                      value={profileData.socialMedia.blog || ''}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        socialMedia: { ...profileData.socialMedia, blog: e.target.value }
                      })}
                      placeholder="블로그 주소"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 계정 설정 탭 */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* 알림 설정 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  알림 설정
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">이메일 알림</p>
                      <p className="text-sm text-gray-600">캠페인 초대, 승인 등 중요한 알림을 이메일로 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.email}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: { ...profileData.notifications, email: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">SMS 알림</p>
                      <p className="text-sm text-gray-600">긴급한 알림을 문자 메시지로 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.sms}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: { ...profileData.notifications, sms: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">푸시 알림</p>
                      <p className="text-sm text-gray-600">앱 푸시 알림을 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.push}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: { ...profileData.notifications, push: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">마케팅 정보 수신</p>
                      <p className="text-sm text-gray-600">이벤트, 프로모션 등 마케팅 정보를 받습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.marketing}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: { ...profileData.notifications, marketing: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* 개인정보 공개 설정 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  개인정보 공개 설정
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">프로필 공개</p>
                      <p className="text-sm text-gray-600">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.privacy.profilePublic}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        privacy: { ...profileData.privacy, profilePublic: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">이메일 공개</p>
                      <p className="text-sm text-gray-600">프로필에 이메일 주소를 표시합니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.privacy.showEmail}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        privacy: { ...profileData.privacy, showEmail: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">전화번호 공개</p>
                      <p className="text-sm text-gray-600">프로필에 전화번호를 표시합니다</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.privacy.showPhone}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        privacy: { ...profileData.privacy, showPhone: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 정산 정보 탭 */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">정산 계좌 관리</h3>
                <p className="text-sm text-gray-600">캠페인 수익금을 받을 계좌를 등록하세요</p>
              </div>

              <div className="space-y-4 mb-6">
                {bankAccounts.map((account, index) => (
                  <div key={account.id} className={`border rounded-lg p-4 ${account.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">계좌 {index + 1}</h4>
                        {account.isDefault && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">기본</span>
                        )}
                      </div>
                      {bankAccounts.length > 1 && (
                        <button
                          onClick={() => removeBankAccount(account.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                        <select
                          value={account.bankName}
                          onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">은행 선택</option>
                          {banks.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                        <input
                          type="text"
                          value={account.accountNumber}
                          onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                          placeholder="계좌번호 입력"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                        <input
                          type="text"
                          value={account.accountHolder}
                          onChange={(e) => updateBankAccount(account.id, 'accountHolder', e.target.value)}
                          placeholder="예금주명"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {!account.isDefault && (
                      <button
                        onClick={() => setDefaultAccount(account.id)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        기본 계좌로 설정
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addBankAccount}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                계좌 추가
              </button>

              <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">정산 안내</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>정산은 캠페인 완료 후 영업일 기준 7일 이내에 진행됩니다</li>
                      <li>사업소득세 3.3%가 원천징수됩니다</li>
                      <li>계좌 정보 변경 시 본인 인증이 필요할 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 보안 탭 */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  비밀번호 변경
                </h3>
                
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {passwordError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">최소 8자 이상, 영문/숫자/특수문자 조합</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={!currentPassword || !newPassword || !confirmPassword || saving}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  비밀번호 변경
                </button>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">로그인 활동</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">현재 세션</p>
                      <p className="text-sm text-gray-600">Chrome · Seoul, Korea · 2분 전</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">활성</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Safari · iPhone</p>
                      <p className="text-sm text-gray-600">Seoul, Korea · 2일 전</p>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-700">로그아웃</button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 삭제</h3>
                <p className="text-sm text-gray-600 mb-4">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  계정 삭제
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}