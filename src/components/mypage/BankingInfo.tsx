'use client'

import { useState } from 'react'
import { CreditCard, Globe, Truck, Upload, Check } from 'lucide-react'

interface BankingInfoProps {
  userId: string
  initialData?: any
  onSave: (data: any) => void
}

export default function BankingInfo({ userId, initialData, onSave }: BankingInfoProps) {
  const [activeTab, setActiveTab] = useState<'domestic' | 'international' | 'shipping'>('domestic')
  const [data, setData] = useState({
    domestic: {
      bankName: initialData?.domestic?.bankName || '',
      accountNumber: initialData?.domestic?.accountNumber || '',
      accountHolder: initialData?.domestic?.accountHolder || ''
    },
    international: {
      englishName: initialData?.international?.englishName || '',
      englishAddress: {
        street: initialData?.international?.englishAddress?.street || '',
        city: initialData?.international?.englishAddress?.city || '',
        state: initialData?.international?.englishAddress?.state || '',
        postalCode: initialData?.international?.englishAddress?.postalCode || '',
        country: initialData?.international?.englishAddress?.country || ''
      },
      accountNumber: initialData?.international?.accountNumber || '',
      internationalCode: initialData?.international?.internationalCode || '',
      bankEnglishName: initialData?.international?.bankEnglishName || '',
      swiftCode: initialData?.international?.swiftCode || '',
      branchCode: initialData?.international?.branchCode || ''
    },
    shipping: {
      recipientName: initialData?.shipping?.recipientName || '',
      phoneNumber: initialData?.shipping?.phoneNumber || '',
      address: initialData?.shipping?.address || '',
      detailAddress: initialData?.shipping?.detailAddress || '',
      postalCode: initialData?.shipping?.postalCode || '',
      deliveryNote: initialData?.shipping?.deliveryNote || '',
      imageUrl: initialData?.shipping?.imageUrl || null
    }
  })

  const [shippingImage, setShippingImage] = useState<File | null>(null)

  const handleDomesticChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      domestic: {
        ...prev.domestic,
        [field]: value
      }
    }))
  }

  const handleInternationalChange = (field: string, value: string, isAddress = false) => {
    if (isAddress) {
      setData(prev => ({
        ...prev,
        international: {
          ...prev.international,
          englishAddress: {
            ...prev.international.englishAddress,
            [field]: value
          }
        }
      }))
    } else {
      setData(prev => ({
        ...prev,
        international: {
          ...prev.international,
          [field]: value
        }
      }))
    }
  }

  const handleShippingChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value
      }
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setShippingImage(file)
      // TODO: 이미지 업로드 API 호출
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('domestic')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'domestic'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            국내 계좌
          </button>
          <button
            onClick={() => setActiveTab('international')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'international'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            국제 송금
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'shipping'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Truck className="w-4 h-4 inline mr-2" />
            배송 주소
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* 국내 계좌 정보 */}
        {activeTab === 'domestic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행명 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.domestic.bankName}
                onChange={(e) => handleDomesticChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">선택하세요</option>
                <option value="국민은행">국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="우리은행">우리은행</option>
                <option value="하나은행">하나은행</option>
                <option value="농협은행">농협은행</option>
                <option value="기업은행">기업은행</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.domestic.accountNumber}
                onChange={(e) => handleDomesticChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="'-' 없이 입력"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예금주명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.domestic.accountHolder}
                onChange={(e) => handleDomesticChange('accountHolder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        )}

        {/* 국제 송금 정보 */}
        {activeTab === 'international' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  영문 이름 (English Name)
                </label>
                <input
                  type="text"
                  value={data.international.englishName}
                  onChange={(e) => handleInternationalChange('englishName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Hong Gil Dong"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계좌번호 (Account Number)
                </label>
                <input
                  type="text"
                  value={data.international.accountNumber}
                  onChange={(e) => handleInternationalChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영문 주소 (English Address)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={data.international.englishAddress.street}
                  onChange={(e) => handleInternationalChange('street', e.target.value, true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={data.international.englishAddress.city}
                    onChange={(e) => handleInternationalChange('city', e.target.value, true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={data.international.englishAddress.postalCode}
                    onChange={(e) => handleInternationalChange('postalCode', e.target.value, true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Postal Code"
                  />
                </div>
                <input
                  type="text"
                  value={data.international.englishAddress.country}
                  onChange={(e) => handleInternationalChange('country', e.target.value, true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  은행 영문명 (Bank Name)
                </label>
                <input
                  type="text"
                  value={data.international.bankEnglishName}
                  onChange={(e) => handleInternationalChange('bankEnglishName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="KB Kookmin Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT 코드
                </label>
                <input
                  type="text"
                  value={data.international.swiftCode}
                  onChange={(e) => handleInternationalChange('swiftCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="CZNBKRSEXXX"
                />
              </div>
            </div>
          </div>
        )}

        {/* 배송 주소 */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수령인명
                </label>
                <input
                  type="text"
                  value={data.shipping.recipientName}
                  onChange={(e) => handleShippingChange('recipientName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={data.shipping.phoneNumber}
                  onChange={(e) => handleShippingChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.shipping.postalCode}
                    onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={data.shipping.address}
                  onChange={(e) => handleShippingChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="기본 주소"
                />
                <input
                  type="text"
                  value={data.shipping.detailAddress}
                  onChange={(e) => handleShippingChange('detailAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="상세 주소"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배송 메모
              </label>
              <textarea
                value={data.shipping.deliveryNote}
                onChange={(e) => handleShippingChange('deliveryNote', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="부재시 경비실에 맡겨주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소 이미지 첨부
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    이미지 선택
                  </div>
                </label>
                {shippingImage && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    {shippingImage.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            저장하기
          </button>
        </div>
      </form>
    </div>
  )
}