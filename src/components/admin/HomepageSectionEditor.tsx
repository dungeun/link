'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Loader2, Save, Languages, Eye, EyeOff, GripVertical } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SectionData {
  id: string
  type: string
  visible: boolean
  data: any
}

interface HomepageSectionEditorProps {
  sectionId: string
  initialData: SectionData
  onUpdate?: (sectionId: string, data: SectionData) => void
}

export function HomepageSectionEditor({ 
  sectionId, 
  initialData, 
  onUpdate 
}: HomepageSectionEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [sectionData, setSectionData] = useState<SectionData>(initialData)
  const [translationPreviews, setTranslationPreviews] = useState<{
    en?: any
    jp?: any
  }>({})

  // 섹션 저장
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          type: sectionData.type,
          visible: sectionData.visible,
          data: sectionData.data
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "저장 완료",
          description: `${sectionId} 섹션이 성공적으로 저장되었습니다.`
        })
        onUpdate?.(sectionId, sectionData)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 번역 미리보기 생성
  const handleGenerateTranslation = async (targetLanguage: 'en' | 'jp') => {
    setIsTranslating(true)
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          sectionId,
          data: sectionData.data,
          targetLanguage
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setTranslationPreviews(prev => ({
          ...prev,
          [targetLanguage]: result.translatedData
        }))
        toast({
          title: "번역 생성 완료",
          description: `${targetLanguage.toUpperCase()} 번역이 생성되었습니다.`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "번역 생성 실패",
        description: error instanceof Error ? error.message : "번역 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsTranslating(false)
    }
  }

  // 번역 적용 및 저장
  const handleApplyTranslation = async (targetLanguage: 'en' | 'jp') => {
    if (!translationPreviews[targetLanguage]) return

    const mergedData = mergeTranslationData(sectionData.data, translationPreviews[targetLanguage], targetLanguage)
    
    const updatedSection = {
      ...sectionData,
      data: mergedData
    }

    setSectionData(updatedSection)
    
    // 자동 저장
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          type: updatedSection.type,
          visible: updatedSection.visible,
          data: updatedSection.data
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "번역 적용 완료",
          description: `${targetLanguage.toUpperCase()} 번역이 적용되고 저장되었습니다.`
        })
        onUpdate?.(sectionId, updatedSection)
        
        // 번역 미리보기 초기화
        setTranslationPreviews(prev => ({
          ...prev,
          [targetLanguage]: undefined
        }))
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "번역 적용 실패",
        description: error instanceof Error ? error.message : "번역 적용 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 번역 데이터 병합
  const mergeTranslationData = (originalData: any, translatedData: any, targetLang: 'en' | 'jp') => {
    const merged = JSON.parse(JSON.stringify(originalData))
    
    const mergeObject = (original: any, translated: any) => {
      if (!original || !translated) return original
      
      if (Array.isArray(original)) {
        return original.map((item, index) => 
          translated[index] ? mergeObject(item, translated[index]) : item
        )
      }
      
      if (typeof original === 'object' && typeof translated === 'object') {
        for (const key in translated) {
          if (key in original) {
            if (typeof original[key] === 'string' && typeof translated[key] === 'string') {
              // 다국어 객체로 변환
              if (typeof original[key] === 'string') {
                original[key] = {
                  ko: original[key],
                  [targetLang]: translated[key]
                }
              } else if (original[key].ko) {
                original[key][targetLang] = translated[key]
              }
            } else {
              original[key] = mergeObject(original[key], translated[key])
            }
          }
        }
      }
      
      return original
    }
    
    return mergeObject(merged, translatedData)
  }

  // 섹션 타입별 렌더링
  const renderSectionEditor = () => {
    switch (sectionData.type) {
      case 'hero':
        return renderHeroEditor()
      case 'category':
        return renderCategoryEditor()
      case 'quicklinks':
        return renderQuicklinksEditor()
      default:
        return renderGenericEditor()
    }
  }

  const renderHeroEditor = () => (
    <div className="space-y-4">
      {sectionData.data.slides?.map((slide: any, index: number) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm">슬라이드 {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={slide.title?.ko || slide.title || ''}
                onChange={(e) => updateSlideField(index, 'title', e.target.value)}
                placeholder="슬라이드 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium">부제목</label>
              <Input
                value={slide.subtitle?.ko || slide.subtitle || ''}
                onChange={(e) => updateSlideField(index, 'subtitle', e.target.value)}
                placeholder="슬라이드 부제목을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium">태그</label>
              <Input
                value={slide.tag?.ko || slide.tag || ''}
                onChange={(e) => updateSlideField(index, 'tag', e.target.value)}
                placeholder="태그를 입력하세요"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderCategoryEditor = () => (
    <div className="space-y-4">
      {sectionData.data.categories?.map((category: any, index: number) => (
        <Card key={category.id || index}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">카테고리명</label>
                <Input
                  value={category.name?.ko || category.name || ''}
                  onChange={(e) => updateCategoryField(index, 'name', e.target.value)}
                  placeholder="카테고리명을 입력하세요"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">배지</label>
                <Input
                  value={category.badge?.ko || category.badge || ''}
                  onChange={(e) => updateCategoryField(index, 'badge', e.target.value)}
                  placeholder="배지 텍스트 (선택사항)"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderQuicklinksEditor = () => (
    <div className="space-y-4">
      {sectionData.data.links?.map((link: any, index: number) => (
        <Card key={link.id || index}>
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">링크 제목</label>
              <Input
                value={link.title?.ko || link.title || ''}
                onChange={(e) => updateLinkField(index, 'title', e.target.value)}
                placeholder="링크 제목을 입력하세요"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderGenericEditor = () => (
    <div>
      <label className="text-sm font-medium">JSON 데이터</label>
      <Textarea
        value={JSON.stringify(sectionData.data, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value)
            setSectionData(prev => ({ ...prev, data: parsed }))
          } catch (error) {
            // JSON 파싱 오류는 무시
          }
        }}
        className="font-mono text-xs"
        rows={10}
      />
    </div>
  )

  // 헬퍼 함수들
  const updateSlideField = (index: number, field: string, value: string) => {
    setSectionData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        slides: prev.data.slides.map((slide: any, i: number) => 
          i === index ? { ...slide, [field]: value } : slide
        )
      }
    }))
  }

  const updateCategoryField = (index: number, field: string, value: string) => {
    setSectionData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        categories: prev.data.categories.map((category: any, i: number) => 
          i === index ? { ...category, [field]: value } : category
        )
      }
    }))
  }

  const updateLinkField = (index: number, field: string, value: string) => {
    setSectionData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        links: prev.data.links.map((link: any, i: number) => 
          i === index ? { ...link, [field]: value } : link
        )
      }
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="capitalize">{sectionData.type}</CardTitle>
            <Badge variant={sectionData.visible ? "default" : "secondary"}>
              {sectionData.visible ? "표시" : "숨김"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={sectionData.visible}
              onCheckedChange={(checked) => 
                setSectionData(prev => ({ ...prev, visible: checked }))
              }
            />
            {sectionData.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 섹션 에디터 */}
        {renderSectionEditor()}
        
        {/* 번역 생성 영역 */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Languages className="h-4 w-4" />
            번역 관리
          </h4>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateTranslation('en')}
              disabled={isTranslating}
            >
              {isTranslating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              영어 번역 생성
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateTranslation('jp')}
              disabled={isTranslating}
            >
              {isTranslating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              일본어 번역 생성
            </Button>
          </div>
          
          {/* 번역 미리보기 */}
          {Object.entries(translationPreviews).map(([lang, data]) => {
            if (!data) return null
            
            return (
              <div key={lang} className="border rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {lang.toUpperCase()} 번역 미리보기
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleApplyTranslation(lang as 'en' | 'jp')}
                    disabled={isLoading}
                  >
                    번역 적용
                  </Button>
                </div>
                <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )
          })}
        </div>
        
        {/* 저장 버튼 */}
        <div className="border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            섹션 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}