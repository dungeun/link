import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon } from 'lucide-react'

interface StepDetailsProps {
  formData: {
    startDate: string
    endDate: string
    announcementDate: string
    requirements: string
    hashtags: string
    applicationStartDate?: string
    applicationEndDate?: string
    contentStartDate?: string
    contentEndDate?: string
    resultAnnouncementDate?: string
    provisionDetails?: string
    campaignMission?: string
    keywords?: string
    additionalNotes?: string
  }
  setFormData: (data: any) => void
}

export default function StepDetails({ formData, setFormData }: StepDetailsProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 일정 및 상세 정보</h2>
      <div className="space-y-6">
        {/* 캠페인 기간 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">캠페인 기간</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">캠페인 시작일 *</Label>
              <div className="relative mt-1">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">캠페인 종료일 *</Label>
              <div className="relative mt-1">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 신청 및 발표 일정 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">신청 및 발표 일정</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="applicationStartDate">신청 시작일</Label>
              <div className="relative mt-1">
                <Input
                  id="applicationStartDate"
                  type="date"
                  value={formData.applicationStartDate || ''}
                  onChange={(e) => setFormData({...formData, applicationStartDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="applicationEndDate">신청 마감일</Label>
              <div className="relative mt-1">
                <Input
                  id="applicationEndDate"
                  type="date"
                  value={formData.applicationEndDate || ''}
                  onChange={(e) => setFormData({...formData, applicationEndDate: e.target.value})}
                  min={formData.applicationStartDate || new Date().toISOString().split('T')[0]}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="announcementDate">지원자 발표일 *</Label>
            <div className="relative mt-1">
              <Input
                id="announcementDate"
                type="date"
                value={formData.announcementDate}
                onChange={(e) => setFormData({...formData, announcementDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                max={formData.startDate || undefined}
                required
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-sm text-gray-500 mt-1">선정된 인플루언서를 발표할 날짜입니다. 캠페인 시작일 이전이어야 합니다.</p>
          </div>
        </div>

        {/* 콘텐츠 제작 일정 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">콘텐츠 제작 일정</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contentStartDate">콘텐츠 등록 시작일</Label>
              <div className="relative mt-1">
                <Input
                  id="contentStartDate"
                  type="date"
                  value={formData.contentStartDate || ''}
                  onChange={(e) => setFormData({...formData, contentStartDate: e.target.value})}
                  min={formData.announcementDate || new Date().toISOString().split('T')[0]}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="contentEndDate">콘텐츠 등록 마감일</Label>
              <div className="relative mt-1">
                <Input
                  id="contentEndDate"
                  type="date"
                  value={formData.contentEndDate || ''}
                  onChange={(e) => setFormData({...formData, contentEndDate: e.target.value})}
                  min={formData.contentStartDate || formData.announcementDate || new Date().toISOString().split('T')[0]}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="resultAnnouncementDate">최종 결과 발표일</Label>
            <div className="relative mt-1">
              <Input
                id="resultAnnouncementDate"
                type="date"
                value={formData.resultAnnouncementDate || ''}
                onChange={(e) => setFormData({...formData, resultAnnouncementDate: e.target.value})}
                min={formData.contentEndDate || formData.endDate || new Date().toISOString().split('T')[0]}
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-sm text-gray-500 mt-1">캠페인 최종 결과를 발표할 날짜입니다.</p>
          </div>
        </div>

        {/* 캠페인 요구사항 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">캠페인 요구사항</h3>
          <div>
            <Label htmlFor="requirements">참여 조건 및 요구사항</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              placeholder="인플루언서가 충족해야 할 조건이나 콘텐츠 제작 가이드라인을 작성해주세요."
              className="mt-1 h-32"
            />
          </div>

          <div>
            <Label htmlFor="hashtags">해시태그 (공백으로 구분)</Label>
            <Input
              id="hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData({...formData, hashtags: e.target.value})}
              placeholder="#뷰티 #스킨케어 #신제품"
              className="mt-1"
            />
          </div>
        </div>

        {/* 캠페인 상세 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">캠페인 상세 정보</h3>
          <div>
            <Label htmlFor="provisionDetails">제공 내역</Label>
            <Textarea
              id="provisionDetails"
              value={formData.provisionDetails || ''}
              onChange={(e) => setFormData({...formData, provisionDetails: e.target.value})}
              placeholder="제공되는 제품, 서비스, 혜택 등을 상세히 작성해주세요."
              className="mt-1 h-24"
            />
          </div>

          <div>
            <Label htmlFor="campaignMission">캠페인 미션</Label>
            <Textarea
              id="campaignMission"
              value={formData.campaignMission || ''}
              onChange={(e) => setFormData({...formData, campaignMission: e.target.value})}
              placeholder="인플루언서가 수행해야 할 구체적인 미션을 작성해주세요."
              className="mt-1 h-32"
            />
          </div>

          <div>
            <Label htmlFor="keywords">키워드</Label>
            <Input
              id="keywords"
              value={formData.keywords || ''}
              onChange={(e) => setFormData({...formData, keywords: e.target.value})}
              placeholder="캠페인 관련 키워드를 입력해주세요. (예: 뷰티, 스킨케어, 수분크림)"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="additionalNotes">추가 안내사항</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes || ''}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              placeholder="참여자에게 추가로 안내할 사항을 자유롭게 작성해주세요."
              className="mt-1 h-24"
            />
          </div>
        </div>
      </div>
    </>
  )
}