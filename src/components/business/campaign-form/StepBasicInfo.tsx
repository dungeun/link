import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface StepBasicInfoProps {
  formData: {
    title: string
    description: string
    platform: string
    budgetType?: string
    budget?: number
  }
  setFormData: (data: {
    title: string
    description: string
    platform: string
    budgetType?: string
    budget?: number
    [key: string]: unknown
  }) => void
  platformIcons: {
    INSTAGRAM: React.ReactNode
    YOUTUBE: React.ReactNode
    TIKTOK: React.ReactNode
    FACEBOOK: React.ReactNode
    X: React.ReactNode
    NAVERBLOG: React.ReactNode
  }
}

export default function StepBasicInfo({ formData, setFormData, platformIcons }: StepBasicInfoProps) {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">캠페인 기본 정보</h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="title">캠페인 제목</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="예: 신제품 출시 SNS 리뷰 캠페인"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">캠페인 설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="캠페인의 목적과 내용을 상세히 설명해주세요."
            className="mt-1 h-32"
            required
          />
        </div>

        <div>
          <Label>플랫폼 선택</Label>
          <div className="flex justify-center gap-3 mt-2">
            <Button
              type="button"
              variant={formData.platform === 'INSTAGRAM' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'INSTAGRAM' && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              )}
              onClick={() => setFormData({...formData, platform: 'INSTAGRAM'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.INSTAGRAM}</span>
              <span className="text-xs">인스타그램</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'YOUTUBE' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'YOUTUBE' && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setFormData({...formData, platform: 'YOUTUBE'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.YOUTUBE}</span>
              <span className="text-xs">유튜브</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'TIKTOK' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'TIKTOK' && "bg-black hover:bg-gray-900"
              )}
              onClick={() => setFormData({...formData, platform: 'TIKTOK'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.TIKTOK}</span>
              <span className="text-xs">틱톡</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'FACEBOOK' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'FACEBOOK' && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => setFormData({...formData, platform: 'FACEBOOK'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.FACEBOOK}</span>
              <span className="text-xs">페이스북</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'X' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'X' && "bg-black hover:bg-gray-900"
              )}
              onClick={() => setFormData({...formData, platform: 'X'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.X}</span>
              <span className="text-xs">X</span>
            </Button>
            <Button
              type="button"
              variant={formData.platform === 'NAVERBLOG' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'NAVERBLOG' && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setFormData({...formData, platform: 'NAVERBLOG'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.NAVERBLOG}</span>
              <span className="text-xs">네이버</span>
            </Button>
          </div>
        </div>

        <div>
          <Label>캠페인 유형</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              type="button"
              variant={formData.budgetType === 'FREE' ? 'default' : 'outline'}
              className="h-auto py-4"
              onClick={() => setFormData({...formData, budgetType: 'FREE', budget: 0})}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">무료 캠페인</div>
                <div className="text-xs text-gray-600">제품/서비스만 제공</div>
              </div>
            </Button>
            <Button
              type="button"
              variant={formData.budgetType === 'PAID' ? 'default' : 'outline'}
              className="h-auto py-4"
              onClick={() => setFormData({...formData, budgetType: 'PAID'})}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">유료 캠페인</div>
                <div className="text-xs text-gray-600">제품+현금 보상</div>
              </div>
            </Button>
          </div>
        </div>

        {formData.budgetType === 'PAID' && (
          <div>
            <Label htmlFor="budget">캠페인 예산 (인플루언서 보상금)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => setFormData({...formData, budget: Number(e.target.value) || 0})}
              placeholder="예: 100000"
              className="mt-1"
              min="0"
              step="10000"
            />
            <p className="text-xs text-gray-500 mt-1">
              인플루언서에게 지급할 총 예산을 입력하세요. (VAT 포함)
            </p>
          </div>
        )}
      </div>
    </>
  )
}