"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import AddressInput, { AddressData } from "@/components/ui/AddressInput";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import {
  getCountryFlag,
  normalizeCountryName,
} from "@/lib/utils/country-flags";

interface PersonalInfoForm {
  name: string;
  email: string;
  bio: string;
  phone: string;
  realName: string;
  birthDate: string;
  nationality: string;
  address: string;
  gender: string;
  categories: string[];
}

interface PersonalInfoSettingsProps {
  profileForm: PersonalInfoForm;
  setProfileForm: (form: PersonalInfoForm) => void;
  addressData: AddressData | null;
  setAddressData: (data: AddressData | null) => void;
  profileImage: string | null;
  profileImageFile: File | null;
  onProfileImageChange: (imageUrl: string | null, imageFile?: File) => void;
  onSave: () => void;
  saving: boolean;
  userName: string;
}

export default function PersonalInfoSettings({
  profileForm,
  setProfileForm,
  addressData,
  setAddressData,
  profileImage,
  profileImageFile,
  onProfileImageChange,
  onSave,
  saving,
  userName,
}: PersonalInfoSettingsProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* 프로필 이미지 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          {t("mypage.profile.profile_image", "프로필 이미지")}
        </h4>
        <div className="flex justify-center">
          <ProfileImageUpload
            currentImage={profileImage}
            userName={userName}
            nationality={profileForm.nationality}
            onImageChange={onProfileImageChange}
          />
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          {t("mypage.profile.basic_info", "기본 정보")}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.name", "이름")}
            </label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.email", "이메일")}
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.realName", "실명")}
            </label>
            <input
              type="text"
              value={profileForm.realName}
              onChange={(e) =>
                setProfileForm({ ...profileForm, realName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.phone", "전화번호")}
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.birthDate", "생년월일")}
            </label>
            <input
              type="date"
              value={profileForm.birthDate}
              onChange={(e) =>
                setProfileForm({ ...profileForm, birthDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.gender", "성별")}
            </label>
            <select
              value={profileForm.gender}
              onChange={(e) =>
                setProfileForm({ ...profileForm, gender: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">선택하세요</option>
              <option value="male">{t("mypage.profile.male", "남성")}</option>
              <option value="female">
                {t("mypage.profile.female", "여성")}
              </option>
              <option value="other">{t("mypage.profile.other", "기타")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("mypage.profile.nationality", "국적")}
            </label>
            <select
              value={profileForm.nationality}
              onChange={(e) =>
                setProfileForm({ ...profileForm, nationality: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">국적을 선택하세요</option>
              <option value="대한민국">🇰🇷 대한민국</option>
              <option value="미국">🇺🇸 미국</option>
              <option value="일본">🇯🇵 일본</option>
              <option value="중국">🇨🇳 중국</option>
              <option value="캐나다">🇨🇦 캐나다</option>
              <option value="호주">🇦🇺 호주</option>
              <option value="영국">🇬🇧 영국</option>
              <option value="독일">🇩🇪 독일</option>
              <option value="프랑스">🇫🇷 프랑스</option>
              <option value="기타">🌍 기타</option>
            </select>
          </div>
        </div>
      </div>

      {/* 자기소개 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          {t("mypage.profile.bio", "자기소개")}
        </h4>
        <textarea
          value={profileForm.bio}
          onChange={(e) =>
            setProfileForm({ ...profileForm, bio: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="자기소개를 입력해주세요..."
        />
      </div>

      {/* 주소 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          {t("mypage.profile.address", "주소")}
        </h4>
        <AddressInput
          nationality={profileForm.nationality}
          value={addressData}
          onChange={setAddressData}
        />
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 font-medium transition-colors"
        >
          {saving
            ? t("mypage.profile.saving", "저장 중...")
            : t("mypage.profile.save", "저장")}
        </button>
      </div>
    </div>
  );
}
