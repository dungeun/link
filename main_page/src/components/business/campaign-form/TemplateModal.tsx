import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'

interface TemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName: string
  setTemplateName: (name: string) => void
  templateDescription: string
  setTemplateDescription: (description: string) => void
  onSave: () => void
}

export default function TemplateModal({
  open,
  onOpenChange,
  templateName,
  setTemplateName,
  templateDescription,
  setTemplateDescription,
  onSave
}: TemplateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>템플릿 저장</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="templateName">템플릿 이름</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: 뷰티 제품 리뷰 캠페인"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="templateDescription">설명 (선택)</Label>
            <Textarea
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="템플릿에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button onClick={onSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}