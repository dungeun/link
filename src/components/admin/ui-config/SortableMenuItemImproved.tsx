'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import type { MenuItem } from '@/lib/stores/ui-config.store';

interface SortableMenuItemProps {
  menu: MenuItem;
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onDelete: (id: string) => void;
}

interface LanguagePackData {
  key: string;
  ko: string;
  en: string;
  jp: string;
}

export function SortableMenuItemImproved({ menu, onUpdate, onDelete }: SortableMenuItemProps) {
  const [languageData, setLanguageData] = useState<LanguagePackData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    // 언어팩 데이터 가져오기
    const fetchLanguageData = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      if (!token) {
        console.log('토큰이 없어서 언어팩 데이터를 가져올 수 없습니다.');
        return;
      }

      try {
        console.log(`언어팩 데이터 로드 시작: ${menu.label}`);
        const response = await fetch(`/api/admin/language-packs/${encodeURIComponent(menu.label)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log(`언어팩 API 응답: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('언어팩 데이터:', data);
          
          // 응답 데이터 구조에 맞게 처리
          setLanguageData({
            key: data.key || menu.label,
            ko: data.ko || '',
            en: data.en || '',
            jp: data.jp || ''
          });
        } else {
          console.error('언어팩 데이터 로드 실패:', response.status, response.statusText);
          // 실패해도 기본값 설정
          setLanguageData({
            key: menu.label,
            ko: menu.label.split('.').pop() || menu.label,
            en: menu.label.split('.').pop() || menu.label,
            jp: menu.label.split('.').pop() || menu.label
          });
        }
      } catch (error) {
        console.error('언어팩 데이터 로드 실패:', error);
        // 에러 발생시에도 기본값 설정
        setLanguageData({
          key: menu.label,
          ko: menu.label.split('.').pop() || menu.label,
          en: menu.label.split('.').pop() || menu.label,
          jp: menu.label.split('.').pop() || menu.label
        });
      }
    };

    if (menu.label.includes('.')) {
      fetchLanguageData();
    }
  }, [menu.label]);

  const handleEditName = async () => {
    if (!editedName.trim()) {
      alert('메뉴 이름을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      console.log(`메뉴 이름 업데이트 시작: ${menu.label} → ${editedName}`);

      // 언어팩 업데이트 (자동 번역)
      const response = await fetch(`/api/admin/language-packs/${encodeURIComponent(menu.label)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ko: editedName,
          autoTranslate: false // 번역 서비스 문제로 일단 false
        }),
      });

      console.log(`언어팩 업데이트 응답: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('언어팩 업데이트 실패:', response.status, errorData);
        
        // 만약 언어팩이 없어서 실패했다면 직접 생성
        if (response.status === 404) {
          console.log('언어팩이 없어서 새로 생성합니다.');
          const createResponse = await fetch('/api/admin/language-packs/simple-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              key: menu.label,
              ko: editedName,
              category: 'header'
            }),
          });
          
          if (createResponse.ok) {
            const createdData = await createResponse.json();
            setLanguageData({
              key: createdData.key || menu.label,
              ko: createdData.ko || editedName,
              en: createdData.en || editedName,
              jp: createdData.jp || editedName
            });
            setIsEditing(false);
            alert('메뉴 이름이 생성되었습니다.');
            return;
          }
        }
        
        throw new Error(`언어팩 업데이트 실패: ${response.status}`);
      }

      const updatedData = await response.json();
      console.log('언어팩 업데이트 성공:', updatedData);
      
      // 응답 데이터 구조에 맞게 처리
      setLanguageData({
        key: updatedData.key || menu.label,
        ko: updatedData.ko || editedName,
        en: updatedData.en || editedName,
        jp: updatedData.jp || editedName
      });
      setIsEditing(false);
      
      alert('메뉴 이름이 업데이트되었습니다.');
    } catch (error) {
      console.error('메뉴 이름 업데이트 실패:', error);
      alert(`메뉴 이름 업데이트 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 메뉴 이름 표시 로직 개선
  const getDisplayName = () => {
    // 1. UI 섹션의 content.name이 있으면 최우선 사용 (캠페인, 병원, 구매평)
    if (menu.href && menu.href.startsWith('/category/')) {
      // 카테고리 메뉴의 경우 실제 카테고리 이름 추출
      const parts = menu.label.split('.');
      const slug = parts[parts.length - 1]; // campaign, hospital, review
      const nameMap: Record<string, string> = {
        'campaign': '캠페인',
        'hospital': '병원', 
        'review': '구매평'
      };
      if (nameMap[slug]) {
        return nameMap[slug];
      }
    }
    
    // 2. 언어팩 데이터가 있으면 한국어 번역 사용
    if (languageData?.ko) {
      return languageData.ko;
    }
    
    // 3. 언어팩 키가 아닌 일반 텍스트인 경우 그대로 표시
    if (!menu.label.includes('.')) {
      return menu.label;
    }
    
    // 4. 언어팩 키인데 데이터가 없으면 키의 마지막 부분만 표시
    const parts = menu.label.split('.');
    return parts[parts.length - 1];
  };
  
  const displayName = getDisplayName();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border ${isDragging ? 'shadow-lg border-blue-500' : 'border-gray-200'}`}
    >
      <div className="grid grid-cols-12 gap-2 items-center p-4">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="col-span-1 cursor-move text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>

        {/* 메뉴 이름 (표시용) */}
        <div className="col-span-3">
          {isEditing ? (
            <div className="flex space-x-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="메뉴 이름"
                autoFocus
              />
              <button
                onClick={handleEditName}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedName('');
                }}
                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="font-medium">{displayName}</span>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedName(displayName);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="이름 편집"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          {languageData && (
            <div className="text-xs text-gray-500 mt-1">
              EN: {languageData.en} | JP: {languageData.jp}
            </div>
          )}
        </div>

        {/* 언어팩 키 (내부용) */}
        <div className="col-span-3">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
            {menu.label}
          </code>
        </div>

        {/* 링크 URL */}
        <div className="col-span-3">
          <input
            type="text"
            value={menu.href}
            onChange={(e) => onUpdate(menu.id, { href: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="링크 URL"
            title={menu.label.startsWith('category.') ? '카테고리 링크는 자동 생성됩니다' : '링크 URL을 입력하세요'}
            readOnly={menu.label.startsWith('category.')}
          />
        </div>

        {/* 작업 버튼 */}
        <div className="col-span-2 flex items-center justify-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={menu.visible}
              onChange={(e) => onUpdate(menu.id, { visible: e.target.checked })}
              className="mr-1"
            />
            <span className="text-sm">표시</span>
          </label>
          <button
            onClick={() => onDelete(menu.id)}
            className="text-red-500 hover:text-red-700"
            title="삭제"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}