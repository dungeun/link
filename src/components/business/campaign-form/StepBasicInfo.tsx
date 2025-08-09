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
  }
  setFormData: (data: any) => void
  platformIcons: {
    INSTAGRAM: React.ReactNode
    YOUTUBE: React.ReactNode
    TIKTOK: React.ReactNode
    BLOG: React.ReactNode
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
              variant={formData.platform === 'TWITTER' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2",
                formData.platform === 'TWITTER' && "bg-sky-500 hover:bg-sky-600"
              )}
              onClick={() => setFormData({...formData, platform: 'TWITTER'})}
            >
              <span className="w-4 h-4 flex items-center justify-center">{platformIcons.TWITTER}</span>
              <span className="text-xs">트위터</span>
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
      </div>
    </>
  )
}