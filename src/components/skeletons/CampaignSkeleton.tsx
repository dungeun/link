import React from "react";
import { cn } from "@/lib/utils";

// 기본 스켈레톤 컴포넌트
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// 캠페인 카드 스켈레톤
export function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 이미지 영역 */}
      <Skeleton className="h-48 w-full" />

      {/* 컨텐츠 영역 */}
      <div className="p-4 space-y-3">
        {/* 제목 */}
        <Skeleton className="h-6 w-3/4" />

        {/* 비즈니스 정보 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* 플랫폼 뱃지 */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* 정보 라인들 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* 하단 정보 */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// 캠페인 상세 페이지 스켈레톤
export function CampaignDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 이미지 */}
      <div className="relative h-96 bg-gray-900">
        <Skeleton className="absolute inset-0" />

        {/* 뒤로가기 버튼 */}
        <div className="absolute top-6 left-6 z-10">
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>

        {/* 공유 & 좋아요 버튼 */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 캠페인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* 제목 영역 */}
              <div className="mb-6">
                <Skeleton className="h-8 w-3/4 mb-3" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-1" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-5 rounded" />
                  </div>
                </div>
              </div>

              {/* 비즈니스 정보 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* 탭 메뉴 */}
              <div className="flex gap-4 mb-6">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>

              {/* 컨텐츠 영역 */}
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            {/* 캠페인 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <Skeleton className="h-6 w-32 mb-4" />

              <div className="space-y-4">
                {/* 정보 항목들 */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>

              {/* 지원 버튼 */}
              <div className="mt-6 space-y-3">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 캠페인 리스트 스켈레톤
export function CampaignListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <CampaignCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 테이블 로우 스켈레톤
export function CampaignTableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-20 rounded-md" />
      </td>
    </tr>
  );
}

// 통계 카드 스켈레톤
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// 프로필 섹션 스켈레톤
export function ProfileSectionSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
