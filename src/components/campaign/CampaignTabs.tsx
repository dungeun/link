'use client'

import { Package, FileText } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { normalizeImageArray } from '@/lib/utils/image-optimizer'

interface CampaignContent {
  requirements?: string
  provisionDetails?: string
  mission?: string
  keywords?: string[]
  additionalNotes?: string
  hashtags?: string[]
}

interface Campaign {
  id: string
  title: string
  description: string
  media?: {
    images?: any
  }
  content?: CampaignContent
}

interface CampaignTabsProps {
  campaign: Campaign
}

export default function CampaignTabs({ campaign }: CampaignTabsProps) {
  return (
    <Tabs defaultValue="product" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="product" className="flex items-center gap-2 text-lg font-medium py-3">
          <Package className="w-5 h-5" />
          제품 소개
        </TabsTrigger>
        <TabsTrigger value="campaign" className="flex items-center gap-2 text-lg font-medium py-3">
          <FileText className="w-5 h-5" />
          캠페인 내용
        </TabsTrigger>
      </TabsList>

      {/* 제품 소개 탭 */}
      <TabsContent value="product" className="mt-6">
        {campaign?.media?.images ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">제품 소개</h2>
            <div className="space-y-6">
              {(() => {
                // media.images가 배열인지 확인
                let images: string[] = [];
                
                if (Array.isArray(campaign.media.images)) {
                  // 이미 배열인 경우 그대로 사용
                  images = campaign.media.images.map((img: any) => {
                    // MediaFile 객체에서 URL 추출
                    if (typeof img === 'object' && img.url) return img.url;
                    if (typeof img === 'string') return img;
                    return '';
                  }).filter((url: string) => url.trim() !== '');
                } else if (campaign.media.images) {
                  // 배열이 아닌 경우 normalizeImageArray 사용
                  images = normalizeImageArray(campaign.media.images);
                }
                
                console.log('[ProductImages] Processed images:', images);
                
                if (images.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>제품 이미지가 없습니다.</p>
                    </div>
                  );
                }
                
                return images.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={`제품 이미지 ${index + 1}`}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      style={{ maxHeight: 'none' }}
                      onError={(e) => {
                        console.error(`Failed to load product image ${index + 1}:`, imageUrl);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // 이미지 로드 실패 시 플레이스홀더 표시
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-message')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'error-message flex items-center justify-center h-48 text-gray-400';
                          errorDiv.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  </div>
                ));
              })()}
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
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {campaign.description && campaign.description.trim() 
              ? campaign.description 
              : '캠페인 설명이 제공되지 않았습니다.'
            }
          </p>
        </div>

        {/* 요구사항 */}
        {campaign.content?.requirements && campaign.content.requirements.trim() && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">요구사항</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.content.requirements}</p>
          </div>
        )}

        {/* 제공 내역 */}
        {campaign.content?.provisionDetails && campaign.content.provisionDetails.trim() && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">제공 내역</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.content.provisionDetails}</p>
          </div>
        )}

        {/* 캠페인 미션 */}
        {campaign.content?.mission && campaign.content.mission.trim() && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">캠페인 미션</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.content.mission}</p>
          </div>
        )}

        {/* 키워드 */}
        {campaign.content?.keywords && Array.isArray(campaign.content.keywords) && campaign.content.keywords.length > 0 && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">키워드</h2>
            <div className="flex flex-wrap gap-2">
              {campaign.content.keywords.map((keyword: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 추가 안내사항 */}
        {campaign.content?.additionalNotes && campaign.content.additionalNotes.trim() && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">추가 안내사항</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.content.additionalNotes}</p>
          </div>
        )}

        {/* 해시태그 */}
        {campaign.content?.hashtags && Array.isArray(campaign.content.hashtags) && campaign.content.hashtags.length > 0 && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">해시태그</h2>
            <div className="flex flex-wrap gap-2">
              {campaign.content.hashtags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}