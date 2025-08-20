'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Loader2, RefreshCw, Save, Download, Upload } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { HomepageSectionEditor } from './HomepageSectionEditor'

interface HomepageData {
  metadata: {
    version: string
    lastUpdated: string
    orderedAt: string
    backupLevel: string
  }
  sectionOrder: string[]
  sections: Record<string, {
    type: string
    visible: boolean
    data: any
  }>
}

export function HomepageManager() {
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    loadHomepageData()
  }, [])

  const loadHomepageData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/homepage-sections?language=ko')
      const result = await response.json()
      
      if (result.success) {
        setHomepageData(result.homepage)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "데이터 로드 실패",
        description: error instanceof Error ? error.message : "홈페이지 데이터를 불러올 수 없습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 섹션 순서 변경
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !homepageData) return

    const newOrder = Array.from(homepageData.sectionOrder)
    const [reorderedSection] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, reorderedSection)

    // 임시로 UI 업데이트
    setHomepageData(prev => prev ? {
      ...prev,
      sectionOrder: newOrder
    } : null)

    // 서버에 순서 저장
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          sectionOrder: newOrder
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "순서 변경 완료",
          description: "섹션 순서가 성공적으로 저장되었습니다."
        })
        setHasChanges(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      // 실패시 원래 순서로 되돌리기
      await loadHomepageData()
      toast({
        title: "순서 변경 실패",
        description: error instanceof Error ? error.message : "섹션 순서 변경에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  // 섹션 업데이트 핸들러
  const handleSectionUpdate = (sectionId: string, updatedData: any) => {
    setHomepageData(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: updatedData
        },
        metadata: {
          ...prev.metadata,
          lastUpdated: new Date().toISOString()
        }
      }
    })
    setHasChanges(true)
  }

  // 섹션 가시성 토글
  const handleToggleVisibility = async (sectionId: string) => {
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          sectionId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // UI 업데이트
        setHomepageData(prev => {
          if (!prev) return null
          
          return {
            ...prev,
            sections: {
              ...prev.sections,
              [sectionId]: {
                ...prev.sections[sectionId],
                visible: !prev.sections[sectionId].visible
              }
            }
          }
        })
        
        toast({
          title: "가시성 변경 완료",
          description: `${sectionId} 섹션의 표시 상태가 변경되었습니다.`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "가시성 변경 실패",
        description: error instanceof Error ? error.message : "섹션 가시성 변경에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  // JSON 내보내기
  const handleExportJson = () => {
    if (!homepageData) return

    const dataStr = JSON.stringify(homepageData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `homepage-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    toast({
      title: "내보내기 완료",
      description: "홈페이지 데이터가 JSON 파일로 다운로드되었습니다."
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">홈페이지 데이터 로딩 중...</span>
      </div>
    )
  }

  if (!homepageData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500 mb-4">홈페이지 데이터를 불러올 수 없습니다.</p>
          <Button onClick={loadHomepageData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>홈페이지 섹션 관리</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                드래그로 순서 변경 | 각 섹션별로 편집 후 저장
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                버전 {homepageData.metadata.version}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
              >
                <Download className="h-4 w-4 mr-1" />
                JSON 내보내기
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHomepageData}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                새로고침
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="text-xs text-gray-500 space-y-1">
            <p>마지막 업데이트: {new Date(homepageData.metadata.lastUpdated).toLocaleString('ko-KR')}</p>
            <p>순서 변경: {new Date(homepageData.metadata.orderedAt).toLocaleString('ko-KR')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 섹션 에디터 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="homepage-sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {homepageData.sectionOrder.map((sectionId, index) => {
                const section = homepageData.sections[sectionId]
                if (!section) return null

                return (
                  <Draggable 
                    key={sectionId} 
                    draggableId={sectionId} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging ? 'rotate-2 scale-105' : ''
                        }`}
                      >
                        <div {...provided.dragHandleProps}>
                          <HomepageSectionEditor
                            sectionId={sectionId}
                            initialData={{
                              id: sectionId,
                              type: section.type,
                              visible: section.visible,
                              data: section.data
                            }}
                            onUpdate={handleSectionUpdate}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 저장 상태 */}
      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <Save className="h-4 w-4" />
                <span className="text-sm">변경사항이 있습니다.</span>
              </div>
              <Button size="sm" onClick={() => setHasChanges(false)}>
                확인
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}