import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, GripVertical, Edit2 } from 'lucide-react'
import { DynamicQuestion } from './DynamicQuestions'

interface QuestionEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: DynamicQuestion[]
  onSave: (questions: DynamicQuestion[]) => void
}

export default function QuestionEditorModal({
  open,
  onOpenChange,
  questions,
  onSave
}: QuestionEditorModalProps) {
  const [editingQuestions, setEditingQuestions] = useState<DynamicQuestion[]>(questions)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)

  const selectedQuestion = editingQuestions.find(q => q.id === selectedQuestionId)

  const handleOpen = (open: boolean) => {
    if (open) {
      setEditingQuestions([...questions])
      setSelectedQuestionId(questions[0]?.id || null)
    }
    onOpenChange(open)
  }

  const addQuestion = () => {
    const newQuestion: DynamicQuestion = {
      id: Date.now().toString(),
      question: '새 질문',
      type: 'text',
      required: false
    }
    setEditingQuestions([...editingQuestions, newQuestion])
    setSelectedQuestionId(newQuestion.id)
  }

  const deleteQuestion = (id: string) => {
    const newQuestions = editingQuestions.filter(q => q.id !== id)
    setEditingQuestions(newQuestions)
    if (selectedQuestionId === id) {
      setSelectedQuestionId(newQuestions[0]?.id || null)
    }
  }

  const updateQuestion = (id: string, updates: Partial<DynamicQuestion>) => {
    setEditingQuestions(editingQuestions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...editingQuestions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex >= 0 && newIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
      setEditingQuestions(newQuestions)
    }
  }

  const addOption = () => {
    if (selectedQuestion && selectedQuestion.type === 'select') {
      const options = selectedQuestion.options || []
      updateQuestion(selectedQuestion.id, { options: [...options, ''] })
    }
  }

  const updateOption = (optionIndex: number, value: string) => {
    if (selectedQuestion && selectedQuestion.options) {
      const newOptions = [...selectedQuestion.options]
      newOptions[optionIndex] = value
      updateQuestion(selectedQuestion.id, { options: newOptions })
    }
  }

  const removeOption = (optionIndex: number) => {
    if (selectedQuestion && selectedQuestion.options) {
      const newOptions = selectedQuestion.options.filter((_, i) => i !== optionIndex)
      updateQuestion(selectedQuestion.id, { options: newOptions })
    }
  }

  const handleSave = () => {
    onSave(editingQuestions)
    onOpenChange(false)
  }

  // 기본 질문인지 확인
  const isDefaultQuestion = (id: string) => {
    return ['camera', 'face_exposure', 'job', 'address'].includes(id)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>질문 에디터</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 h-[60vh]">
          {/* 왼쪽: 질문 목록 */}
          <div className="col-span-1 border-r pr-4 overflow-y-auto">
            <div className="space-y-4">
              {/* 기본 질문 섹션 */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">기본 질문</h4>
                <div className="space-y-2">
                  {editingQuestions.filter(q => isDefaultQuestion(q.id)).map((question) => (
                    <div
                      key={question.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedQuestionId === question.id 
                          ? 'bg-indigo-50 border-indigo-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedQuestionId(question.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={question.enabled !== false}
                          onCheckedChange={(checked) => {
                            updateQuestion(question.id, { enabled: checked as boolean })
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className={`font-medium text-sm truncate ${question.enabled === false ? 'text-gray-400' : ''}`}>
                            {question.question}
                          </p>
                          <p className="text-xs text-gray-500">
                            {question.type === 'text' && '짧은 텍스트'}
                            {question.type === 'textarea' && '긴 텍스트'}
                            {question.type === 'number' && '숫자'}
                            {question.type === 'select' && '선택형'}
                            {question.type === 'address' && '주소'}
                            {question.required && ' • 필수'}
                            {question.enabled === false && ' • 비활성'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 추가 질문 섹션 */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">추가 질문</h4>
                <div className="space-y-2">
                  {editingQuestions.filter(q => !isDefaultQuestion(q.id)).map((question) => (
                    <div
                      key={question.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedQuestionId === question.id 
                          ? 'bg-indigo-50 border-indigo-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedQuestionId(question.id)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 mt-1 cursor-move" />
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {question.question}
                          </p>
                          <p className="text-xs text-gray-500">
                            {question.type === 'text' && '짧은 텍스트'}
                            {question.type === 'textarea' && '긴 텍스트'}
                            {question.type === 'number' && '숫자'}
                            {question.type === 'select' && '선택형'}
                            {question.type === 'address' && '주소'}
                            {question.required && ' • 필수'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteQuestion(question.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addQuestion}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    새 질문 추가
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 질문 편집 */}
          <div className="col-span-2 pl-4 overflow-y-auto">
            {selectedQuestion ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">질문</Label>
                  <Input
                    id="question"
                    value={selectedQuestion.question}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { question: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">질문 유형</Label>
                    <Select
                      value={selectedQuestion.type}
                      onValueChange={(value: DynamicQuestion['type']) => {
                        updateQuestion(selectedQuestion.id, { 
                          type: value,
                          options: value === 'select' ? ['옵션 1', '옵션 2'] : undefined,
                          useDefaultAddress: value === 'address' ? true : undefined
                        })
                      }}
                      disabled={isDefaultQuestion(selectedQuestion.id)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">짧은 텍스트</SelectItem>
                        <SelectItem value="textarea">긴 텍스트</SelectItem>
                        <SelectItem value="number">숫자</SelectItem>
                        <SelectItem value="select">선택형</SelectItem>
                        <SelectItem value="address">주소</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="required">필수 질문</Label>
                    <Switch
                      id="required"
                      checked={selectedQuestion.required}
                      onCheckedChange={(checked) => updateQuestion(selectedQuestion.id, { required: checked })}
                    />
                  </div>
                </div>

                {/* 선택형 옵션 */}
                {selectedQuestion.type === 'select' && (
                  <div>
                    <Label>선택 옵션</Label>
                    <div className="space-y-2 mt-2">
                      {selectedQuestion.options?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`옵션 ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        옵션 추가
                      </Button>
                    </div>
                  </div>
                )}

                {/* 미리보기 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">미리보기</h4>
                  <div>
                    <Label>
                      {selectedQuestion.question}
                      {selectedQuestion.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {selectedQuestion.type === 'text' && (
                      <Input placeholder="답변을 입력하세요" className="mt-1" disabled />
                    )}
                    {selectedQuestion.type === 'textarea' && (
                      <Textarea placeholder="답변을 입력하세요" className="mt-1" disabled />
                    )}
                    {selectedQuestion.type === 'number' && (
                      <Input type="number" placeholder="숫자를 입력하세요" className="mt-1" disabled />
                    )}
                    {selectedQuestion.type === 'select' && (
                      <Select disabled>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                      </Select>
                    )}
                    {selectedQuestion.type === 'address' && (
                      <div className="mt-1 p-3 bg-white border rounded">
                        <p className="text-sm text-gray-500">주소 입력 필드</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                질문을 선택하거나 추가해주세요
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}