'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';

interface Section {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  fixed?: boolean;
  order: number;
  type: 'hero' | 'category' | 'quicklinks' | 'promo' | 'ranking' | 'custom' | 'recommended';
}

interface SortableSectionItemProps {
  section: Section;
  onToggleVisibility: (id: string) => void;
}

function SortableSectionItem({ section, onToggleVisibility }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: section.id,
    disabled: section.fixed 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 bg-white border rounded-lg ${
        section.fixed ? 'opacity-60' : ''
      } ${isDragging ? 'shadow-lg' : 'hover:shadow-md'} transition-shadow`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`mr-4 text-gray-400 ${section.fixed ? 'cursor-not-allowed' : 'cursor-move'}`}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {section.name}
          {section.fixed && <span className="ml-2 text-xs text-gray-500">(고정)</span>}
        </div>
        <div className="text-sm text-gray-600">{section.description}</div>
      </div>

      <button
        onClick={() => onToggleVisibility(section.id)}
        className={`ml-4 p-2 rounded ${
          section.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
        }`}
        disabled={section.fixed}
      >
        {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </button>
    </div>
  );
}

export function SectionOrderTab() {
  const { config, updateSectionOrder, updateMainPageCustomSections } = useUIConfigStore();
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // 섹션 기본 정보 매핑
  const sectionInfo: Record<string, { name: string; description: string; fixed?: boolean }> = {
    hero: {
      name: '히어로 배너',
      description: '메인 배너 슬라이드'
    },
    category: {
      name: '카테고리 메뉴',
      description: '카테고리별 아이콘 그리드'
    },
    quicklinks: {
      name: '바로가기 링크',
      description: '빠른 접근 링크'
    },
    promo: {
      name: '프로모션 배너',
      description: '이벤트 및 공지 배너'
    },
    ranking: {
      name: '실시간 랭킹',
      description: '인기/마감임박 캠페인'
    },
    recommended: {
      name: '추천 캠페인',
      description: '큐레이션된 캠페인 목록'
    },
    cta: {
      name: '하단 CTA',
      description: '회원가입 유도 영역',
      fixed: true
    }
  };
  
  // Store에서 섹션 순서 가져와서 Section 형태로 변환
  const [sections, setSections] = useState<Section[]>([]);
  
  // 초기 로드 시 중복 감지
  useEffect(() => {
    const sectionOrder = config.mainPage?.sectionOrder || [];
    const customSections = config.mainPage?.customSections || [];
    
    // 중복 ID 감지
    const allIds = [...sectionOrder.map(s => s.id), ...customSections.map(s => s.id)];
    const uniqueIds = new Set(allIds);
    
    if (allIds.length !== uniqueIds.size) {
      console.warn('Duplicate section IDs detected in stored configuration');
    }
  }, [config]);
  
  useEffect(() => {
    const sectionOrder = config.mainPage?.sectionOrder || [];
    
    const convertedSections = sectionOrder.map(section => ({
      id: section.id,
      type: section.type,
      name: sectionInfo[section.id]?.name || section.id,
      description: sectionInfo[section.id]?.description || '',
      visible: section.visible,
      fixed: sectionInfo[section.id]?.fixed || false,
      order: section.order
    }));
    
    // 커스텀 섹션 추가 (중복 방지를 위해 유니크한 ID 보장)
    const customSectionsRaw = config.mainPage?.customSections || [];
    
    // 먼저 커스텀 섹션의 중복 ID를 제거
    const uniqueCustomSections = customSectionsRaw.filter((cs, index, self) => 
      index === self.findIndex(s => s.id === cs.id)
    );
    
    // 이미 사용된 ID 수집
    const usedIds = new Set(convertedSections.map(s => s.id));
    
    const customSections = uniqueCustomSections.map((cs, index) => {
      let finalId = cs.id || `custom-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ID가 이미 사용 중이면 새로운 ID 생성
      if (usedIds.has(finalId)) {
        finalId = `${finalId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`Duplicate custom section ID detected: ${cs.id}, using new ID: ${finalId}`);
      }
      
      usedIds.add(finalId);
      
      return {
        id: finalId,
        type: 'custom' as const,
        name: cs.title,
        description: cs.subtitle || '커스텀 섹션',
        visible: cs.visible,
        fixed: false,
        order: cs.order || 999 + index
      };
    });
    
    // 중복 ID 제거 및 정렬
    const sectionMap = new Map<string, Section>();
    
    // 기본 섹션 먼저 추가
    convertedSections.forEach(section => {
      sectionMap.set(section.id, section);
    });
    
    // 커스텀 섹션 추가 (중복 ID는 덮어쓰기 방지)
    customSections.forEach(section => {
      if (!sectionMap.has(section.id)) {
        sectionMap.set(section.id, section);
      } else {
        // 중복된 ID가 있으면 새로운 ID로 변경
        const newId = `${section.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`Duplicate section ID found: ${section.id}, changing to ${newId}`);
        sectionMap.set(newId, { ...section, id: newId });
      }
    });
    
    const allSections = Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
    
    // 디버깅용 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('All sections:', allSections);
      console.log('Section IDs:', allSections.map(s => s.id));
    }
    
    setSections(allSections);
  }, [config]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const newSections = await new Promise<Section[]>((resolve) => {
        setSections((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          
          const newItems = arrayMove(items, oldIndex, newIndex);
          
          // 순서 재정렬
          const reorderedItems = newItems.map((item, index) => ({
            ...item,
            order: index + 1
          }));
          
          resolve(reorderedItems);
          return reorderedItems;
        });
      });

      // Store에 업데이트
      const sectionOrder = newSections.map(section => ({
        id: section.id,
        type: section.type,
        order: section.order,
        visible: section.visible
      }));
      
      updateSectionOrder(sectionOrder);
      
      // API 호출하여 즉시 저장
      try {
        const response = await fetch('/api/admin/ui-config', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ config })
        });
        
        if (response.ok) {
          setSaveMessage({ type: 'success', message: '섹션 순서가 저장되었습니다.' });
          setTimeout(() => setSaveMessage(null), 3000);
        } else {
          throw new Error('저장 실패');
        }
      } catch (error) {
        console.error('섹션 순서 저장 실패:', error);
        setSaveMessage({ type: 'error', message: '섹션 순서 저장에 실패했습니다.' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const updatedSections = sections.map(section => 
      section.id === id && !section.fixed
        ? { ...section, visible: !section.visible }
        : section
    );
    
    setSections(updatedSections);
    
    // Store에 업데이트
    const sectionOrder = updatedSections.map(section => ({
      id: section.id,
      type: section.type,
      order: section.order,
      visible: section.visible
    }));
    
    updateSectionOrder(sectionOrder);
    
    // API 호출하여 즉시 저장
    try {
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });
      
      if (response.ok) {
        setSaveMessage({ type: 'success', message: '섹션 표시 상태가 저장되었습니다.' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('섹션 표시 상태 저장 실패:', error);
      setSaveMessage({ type: 'error', message: '섹션 표시 상태 저장에 실패했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // 중복 섹션 정리 함수
  const cleanupDuplicateSections = async () => {
    // 기본 섹션만 유지 (중복 제거)
    const defaultSectionOrder = [
      { id: 'hero', type: 'hero' as const, order: 1, visible: true },
      { id: 'category', type: 'category' as const, order: 2, visible: true },
      { id: 'quicklinks', type: 'quicklinks' as const, order: 3, visible: true },
      { id: 'promo', type: 'promo' as const, order: 4, visible: true },
      { id: 'ranking', type: 'ranking' as const, order: 5, visible: true },
      { id: 'recommended', type: 'recommended' as const, order: 6, visible: true }
    ];
    
    // 커스텀 섹션은 중복 제거하여 유지
    const existingCustomSections = config.mainPage?.customSections || [];
    const seenCustomIds = new Set<string>();
    const cleanedCustomSections = existingCustomSections.filter((section: any) => {
      if (seenCustomIds.has(section.id)) {
        return false;
      }
      seenCustomIds.add(section.id);
      return true;
    });
    
    // Store 업데이트
    updateSectionOrder(defaultSectionOrder);
    updateMainPageCustomSections(cleanedCustomSections);
    
    // 새로운 config로 API 호출
    const cleanedConfig = {
      ...config,
      mainPage: {
        ...config.mainPage,
        sectionOrder: defaultSectionOrder,
        customSections: cleanedCustomSections
      }
    };
    
    try {
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: cleanedConfig })
      });
      
      if (response.ok) {
        setSaveMessage({ type: 'success', message: '중복 섹션이 정리되었습니다. 새로고침합니다...' });
        
        // localStorage 정리
        localStorage.removeItem('ui-config-storage');
        
        // 2초 후 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: '정리 중 오류가 발생했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {saveMessage.message}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold mb-2">섹션 순서 관리</h2>
            <p className="text-sm text-gray-600 mb-2">
              드래그하여 홈페이지에 표시될 섹션 순서를 변경할 수 있습니다. 
              눈 아이콘을 클릭하여 섹션 표시 여부를 설정하세요.
            </p>
            <p className="text-xs text-blue-600">
              ※ 변경사항은 자동으로 저장됩니다.
            </p>
          </div>
          {/* 중복 정리 버튼 */}
          {sections.length !== new Set(sections.map(s => s.id)).size && (
            <button
              onClick={cleanupDuplicateSections}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              중복 섹션 정리
            </button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">홈페이지 구조 미리보기</h3>
        <div className="space-y-2">
          {sections
            .filter(section => section.visible)
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <div
                key={section.id}
                className="flex items-center p-3 bg-gray-50 rounded border border-gray-200"
              >
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{section.name}</span>
                {section.fixed && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    고정
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}