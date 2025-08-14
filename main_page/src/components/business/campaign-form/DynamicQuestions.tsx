import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, MapPin } from 'lucide-react'

export interface DynamicQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'address'
  options?: string[]
  required: boolean
  enabled?: boolean // 질문 사용 여부
  useDefaultAddress?: boolean
  addressData?: {
    postcode: string
    address: string
    detailAddress: string
  }
}

interface DynamicQuestionsProps {
  questions: DynamicQuestion[]
  setQuestions: (questions: DynamicQuestion[]) => void
}

declare global {
  interface Window {
    daum: any
  }
}

export default function DynamicQuestions({ questions, setQuestions }: DynamicQuestionsProps) {
  const [userAddress, setUserAddress] = useState<string>('')

  useEffect(() => {
    // 카카오 우편번호 스크립트 로드
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)

    // 사용자 기본 주소 가져오기 (실제로는 API 호출)
    // TODO: 실제 사용자 주소 API 호출로 대체
    setUserAddress('서울특별시 강남구 테헤란로 123')

    return () => {
      document.body.removeChild(script)
    }
  }, [])
  const addQuestion = () => {
    const newQuestion: DynamicQuestion = {
      id: Date.now().toString(),
      question: '',
      type: 'text',
      required: false
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<DynamicQuestion>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ))
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      const currentOptions = question.options || []
      updateQuestion(questionId, { options: [...currentOptions, ''] })
    }
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const searchAddress = (questionId: string) => {
    if (!window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        updateQuestion(questionId, {
          addressData: {
            postcode: data.zonecode,
            address: data.roadAddress || data.jibunAddress,
            detailAddress: ''
          }
        })
      }
    }).open()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">추가 질문 (선택)</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
        >
          <Plus className="w-4 h-4 mr-1" />
          질문 추가
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div>
                  <Label>질문 {index + 1}</Label>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    placeholder="질문을 입력하세요"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>질문 유형</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: DynamicQuestion['type']) => {
                        updateQuestion(question.id, { 
                          type: value,
                          options: value === 'select' ? [''] : undefined
                        })
                      }}
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

                  <div>
                    <Label>필수 여부</Label>
                    <Select
                      value={question.required ? 'true' : 'false'}
                      onValueChange={(value) => updateQuestion(question.id, { required: value === 'true' })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">선택</SelectItem>
                        <SelectItem value="true">필수</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {question.type === 'select' && (
                  <div>
                    <Label>선택 옵션</Label>
                    <div className="space-y-2 mt-1">
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            placeholder={`옵션 ${optionIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(question.id, optionIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        옵션 추가
                      </Button>
                    </div>
                  </div>
                )}

                {question.type === 'address' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`default-address-${question.id}`}
                        checked={question.useDefaultAddress !== false}
                        onCheckedChange={(checked) => {
                          updateQuestion(question.id, { 
                            useDefaultAddress: checked as boolean,
                            addressData: checked ? undefined : question.addressData
                          })
                        }}
                      />
                      <Label htmlFor={`default-address-${question.id}`} className="text-sm font-normal">
                        회원 정보의 주소 사용
                      </Label>
                    </div>

                    {question.useDefaultAddress !== false ? (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">기본 배송지:</p>
                        <p className="text-sm font-medium">{userAddress}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={question.addressData?.postcode || ''}
                            placeholder="우편번호"
                            readOnly
                            className="w-32"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => searchAddress(question.id)}
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            주소 검색
                          </Button>
                        </div>
                        <Input
                          value={question.addressData?.address || ''}
                          placeholder="기본 주소"
                          readOnly
                        />
                        <Input
                          value={question.addressData?.detailAddress || ''}
                          onChange={(e) => updateQuestion(question.id, {
                            addressData: {
                              ...question.addressData,
                              postcode: question.addressData?.postcode || '',
                              address: question.addressData?.address || '',
                              detailAddress: e.target.value
                            }
                          })}
                          placeholder="상세 주소를 입력하세요"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                className="ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}