import React from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit2 } from 'lucide-react'
import type { DynamicQuestion } from './DynamicQuestions'

interface QuestionPreviewProps {
  questions: DynamicQuestion[]
  onEditClick: () => void
  onQuestionToggle: (questionId: string, enabled: boolean) => void
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ questions, onEditClick, onQuestionToggle }) => {
  const isDefaultQuestion = (id: string): boolean => {
    return ['camera', 'face_exposure', 'job', 'address'].includes(id)
  }

  const defaultQuestions = questions.filter(q => isDefaultQuestion(q.id))
  const customQuestions = questions.filter(q => !isDefaultQuestion(q.id))
  const activeQuestions = questions.filter(q => q.enabled !== false)

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">추가 질문</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEditClick}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          질문 에디터
        </Button>
      </div>

      <div className="space-y-3">
        {/* 기본 질문 섹션 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">기본 질문 (사용할 질문을 선택하세요)</h4>
          {defaultQuestions.map((question) => (
            <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={question.enabled !== false}
                  onCheckedChange={(checked) => {
                    onQuestionToggle(question.id, checked as boolean)
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={question.id}
                    className={`text-sm font-medium cursor-pointer ${
                      question.enabled === false ? 'text-gray-400' : ''
                    }`}
                  >
                    {question.question}
                    {question.required && question.enabled !== false && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {question.type === 'text' && '짧은 텍스트 답변'}
                    {question.type === 'textarea' && '긴 텍스트 답변'}
                    {question.type === 'number' && '숫자 답변'}
                    {question.type === 'select' && `선택형 (${question.options?.join(', ')})`}
                    {question.type === 'address' && '주소 입력'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 질문 섹션 */}
        {customQuestions.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">추가 질문</h4>
            {customQuestions.map((question) => (
              <div key={question.id} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {question.question}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {question.type === 'text' && '짧은 텍스트 답변'}
                      {question.type === 'textarea' && '긴 텍스트 답변'}
                      {question.type === 'number' && '숫자 답변'}
                      {question.type === 'select' && `선택형 (${question.options?.join(', ')})`}
                      {question.type === 'address' && '주소 입력'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeQuestions.length === 0 && (
          <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
            활성화된 질문이 없습니다. 질문 에디터에서 질문을 활성화해주세요.
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 질문 에디터를 사용하여 질문을 추가, 수정, 삭제할 수 있습니다.
        </p>
      </div>
    </div>
  )
}

export default QuestionPreview