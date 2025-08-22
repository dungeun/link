"use client";

import { Package, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeImageArray } from "@/lib/utils/image-optimizer";

interface CampaignContent {
  requirements?: string;
  provisionDetails?: string;
  mission?: string;
  keywords?: string[];
  additionalNotes?: string;
  hashtags?: string[];
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  media?: {
    images?: any;
  };
  content?: CampaignContent;
}

interface CampaignTabsProps {
  campaign: Campaign;
}

export default function CampaignTabs({ campaign }: CampaignTabsProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="product" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-xl">
          <TabsTrigger
            value="product"
            className="flex items-center gap-2 text-base font-medium py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Package className="w-4 h-4" />
            제품 소개
          </TabsTrigger>
          <TabsTrigger
            value="campaign"
            className="flex items-center gap-2 text-base font-medium py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="w-4 h-4" />
            캠페인 내용
          </TabsTrigger>
        </TabsList>

        {/* 제품 소개 탭 */}
        <TabsContent value="product" className="mt-0 pt-8">
          {campaign?.media?.images ? (
            <div className="space-y-8">
              {(() => {
                // media.images가 배열인지 확인
                let images: string[] = [];

                if (Array.isArray(campaign.media.images)) {
                  // 이미 배열인 경우 그대로 사용
                  images = campaign.media.images
                    .map((img: any) => {
                      // MediaFile 객체에서 URL 추출
                      if (typeof img === "object" && img.url) return img.url;
                      if (typeof img === "string") return img;
                      return "";
                    })
                    .filter((url: string) => url.trim() !== "");
                } else if (campaign.media.images) {
                  // 배열이 아닌 경우 normalizeImageArray 사용
                  images = normalizeImageArray(campaign.media.images);
                }

                console.log("[ProductImages] Processed images:", images);

                if (images.length === 0) {
                  return (
                    <div className="text-center py-16 bg-gray-50 rounded-xl">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        제품 이미지가 없습니다
                      </h3>
                      <p className="text-gray-500">
                        업체에서 제품 이미지를 준비 중입니다.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-6">
                    {images.map((imageUrl: string, index: number) => (
                      <div
                        key={index}
                        className="relative w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-200"
                      >
                        <img
                          src={imageUrl}
                          alt={`제품 이미지 ${index + 1}`}
                          className="w-full h-auto object-contain"
                          loading="lazy"
                          onError={(e) => {
                            console.error(
                              `Failed to load product image ${index + 1}:`,
                              imageUrl,
                            );
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            // 이미지 로드 실패 시 플레이스홀더 표시
                            const parent = target.parentElement;
                            if (
                              parent &&
                              !parent.querySelector(".error-message")
                            ) {
                              const errorDiv = document.createElement("div");
                              errorDiv.className =
                                "error-message flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50";
                              errorDiv.innerHTML = `
                                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm">이미지를 불러올 수 없습니다</p>
                              `;
                              parent.appendChild(errorDiv);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                제품 이미지가 없습니다
              </h3>
              <p className="text-gray-500">
                업체에서 제품 이미지를 준비 중입니다.
              </p>
            </div>
          )}
        </TabsContent>

        {/* 캠페인 내용 탭 */}
        <TabsContent value="campaign" className="mt-0 pt-8">
          <div className="space-y-8">
            {/* 캠페인 설명 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2 max-w-4xl">
                <FileText className="w-5 h-5" />
                캠페인 소개
              </h3>
              <div className="text-blue-800 leading-relaxed whitespace-pre-wrap max-w-4xl">
                {campaign.description && campaign.description.trim()
                  ? campaign.description
                  : "캠페인 설명이 제공되지 않았습니다."}
              </div>
            </div>

            {/* 요구사항 */}
            {campaign.content?.requirements &&
              campaign.content.requirements.trim() && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                    📋 요구사항
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-lg max-w-4xl">
                    {campaign.content.requirements}
                  </div>
                </div>
              )}

            {/* 제공 내역 */}
            {campaign.content?.provisionDetails &&
              campaign.content.provisionDetails.trim() && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                    🎁 제공 내역
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-green-50 p-6 rounded-lg border border-green-200 max-w-4xl">
                    {campaign.content.provisionDetails}
                  </div>
                </div>
              )}

            {/* 캠페인 미션 */}
            {campaign.content?.mission && campaign.content.mission.trim() && (
              <div className="border border-gray-200 rounded-xl p-6 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                  🎯 캠페인 미션
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-yellow-50 p-6 rounded-lg border border-yellow-200 max-w-4xl">
                  {campaign.content.mission}
                </div>
              </div>
            )}

            {/* 키워드 */}
            {campaign.content?.keywords &&
              Array.isArray(campaign.content.keywords) &&
              campaign.content.keywords.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                    🔑 키워드
                  </h3>
                  <div className="flex flex-wrap gap-3 max-w-4xl">
                    {campaign.content.keywords.map(
                      (keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                        >
                          {keyword}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* 해시태그 */}
            {campaign.content?.hashtags &&
              Array.isArray(campaign.content.hashtags) &&
              campaign.content.hashtags.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                    # 해시태그
                  </h3>
                  <div className="flex flex-wrap gap-3 max-w-4xl">
                    {campaign.content.hashtags.map(
                      (tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200"
                        >
                          #{tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* 추가 안내사항 */}
            {campaign.content?.additionalNotes &&
              campaign.content.additionalNotes.trim() && (
                <div className="border border-gray-200 rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 max-w-4xl">
                    📌 추가 안내사항
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-orange-50 p-6 rounded-lg border border-orange-200 max-w-4xl">
                    {campaign.content.additionalNotes}
                  </div>
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
