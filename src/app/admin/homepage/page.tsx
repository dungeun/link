/**
 * 어드민 홈페이지 섹션 관리 페이지
 * - JSON 직접 수정 방식
 * - 섹션별 수동 번역 저장
 * - 드래그 앤 드롭 순서 변경
 */

import { Metadata } from 'next'
import { HomepageManager } from '@/components/admin/HomepageManager'

export const metadata: Metadata = {
  title: '홈페이지 관리 | 리뷰픽 어드민',
  description: '홈페이지 섹션 및 콘텐츠 관리'
}

export default function AdminHomepagePage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">홈페이지 관리</h1>
        <p className="text-gray-600 mt-2">
          각 섹션을 편집하고 번역을 생성한 후 저장하세요. 드래그로 섹션 순서를 변경할 수 있습니다.
        </p>
      </div>
      
      <HomepageManager />
    </div>
  )
}