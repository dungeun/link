'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

interface BankingData {
  accountType: 'domestic' | 'international';
  domestic: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  international: {
    englishName: string;
    englishAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    accountNumber: string;
    internationalCode: string;
    bankEnglishName: string;
    swiftCode: string;
    branchCode: string;
  };
}

interface BankingInfoProps {
  userId: string
  initialData?: Partial<BankingData>
  onSave: (data: BankingData) => void
}

export default function BankingInfo({ userId, initialData, onSave }: BankingInfoProps) {
  const [accountType, setAccountType] = useState<'domestic' | 'international'>(initialData?.accountType || 'domestic')
  const [data, setData] = useState({
    accountType: initialData?.accountType || 'domestic',
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
    }
  })

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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...data,
      accountType
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          출금 계좌 관리
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* 계좌 정보 */}
        <div className="space-y-6">
            {/* 계좌 유형 선택 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                계좌 유형 선택
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="domestic"
                    checked={accountType === 'domestic'}
                    onChange={() => {
                      setAccountType('domestic')
                      setData(prev => ({ ...prev, accountType: 'domestic' }))
                    }}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">국내 계좌</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="international"
                    checked={accountType === 'international'}
                    onChange={() => {
                      setAccountType('international')
                      setData(prev => ({ ...prev, accountType: 'international' }))
                    }}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">해외 계좌</span>
                </label>
              </div>
            </div>

            {/* 국내 계좌 정보 */}
            {accountType === 'domestic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.domestic.bankName}
                    onChange={(e) => handleDomesticChange('bankName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="예: KB국민은행, 신한은행, 카카오뱅크 등"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">은행명을 직접 입력해주세요</p>
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
                    placeholder="'-' 없이 입력 (예: 00012345678)"
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
                    placeholder="계좌에 등록된 이름"
                    required
                  />
                </div>
              </div>
            )}

            {/* 해외 계좌 정보 */}
            {accountType === 'international' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      영문 이름 (English Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.international.englishName}
                      onChange={(e) => handleInternationalChange('englishName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Hong Gil Dong"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      계좌번호 (Account Number) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.international.accountNumber}
                      onChange={(e) => handleInternationalChange('accountNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="계좌번호 또는 IBAN"
                      required
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
                  은행 영문명 (Bank Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.international.bankEnglishName}
                  onChange={(e) => handleInternationalChange('bankEnglishName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: Bank of America, HSBC, Citibank"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">은행의 정확한 영문명을 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT/BIC 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.international.swiftCode}
                  onChange={(e) => handleInternationalChange('swiftCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: CZNBKRSEXXX"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">8자리 또는 11자리 SWIFT/BIC 코드</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                라우팅 번호 (Routing Number) - 선택
              </label>
              <input
                type="text"
                value={data.international.branchCode}
                onChange={(e) => handleInternationalChange('branchCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="미국 은행의 경우 ABA/Routing Number"
              />
              <p className="mt-1 text-xs text-gray-500">미국 은행의 경우 9자리 라우팅 번호, 다른 국가는 해당 코드 입력</p>
            </div>
              </div>
            )}
        </div>


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