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

interface LanguagePackKey {
  key: string;
  ko: string;
  en: string;
  ja: string;
  description?: string;
}

export function SortableMenuItemWithLanguagePack({ menu, onUpdate, onDelete }: SortableMenuItemProps) {
  const [languagePackKeys, setLanguagePackKeys] = useState<LanguagePackKey[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState<LanguagePackKey | null>(null);

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
    // 언어팩 키 목록 가져오기
    const fetchLanguagePackKeys = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      if (!token) return;

      try {
        const response = await fetch('/api/admin/language-pack-keys?category=ui_config', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLanguagePackKeys(data.categories.header || []);
          
          // 현재 선택된 키 찾기
          const currentKey = data.categories.header.find((k: LanguagePackKey) => k.key === menu.label);
          if (currentKey) {
            setSelectedKey(currentKey);
          }
        }
      } catch (error) {
        console.error('언어팩 키 로드 실패:', error);
      }
    };

    fetchLanguagePackKeys();
  }, [menu.label]);

  const filteredKeys = languagePackKeys.filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.ko.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectKey = (key: LanguagePackKey) => {
    setSelectedKey(key);
    onUpdate(menu.id, { label: key.key });
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleDirectInput = (value: string) => {
    onUpdate(menu.id, { label: value });
    setSelectedKey(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-4 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center space-x-4">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>

        {/* 메뉴 설정 */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* 언어팩 키 선택 또는 직접 입력 */}
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                value={menu.label}
                onChange={(e) => handleDirectInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="언어팩 키 또는 직접 입력"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200"
                title="언어팩 키 선택"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* 선택된 키 미리보기 */}
            {selectedKey && (
              <div className="mt-1 text-xs text-gray-500">
                {selectedKey.ko} / {selectedKey.en}
              </div>
            )}

            {/* 드롭다운 */}
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="검색..."
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="p-1">
                  {filteredKeys.map((key) => (
                    <button
                      key={key.key}
                      onClick={() => handleSelectKey(key)}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                    >
                      <div className="font-mono text-sm">{key.key}</div>
                      <div className="text-xs text-gray-500">{key.ko} / {key.en}</div>
                    </button>
                  ))}
                  {filteredKeys.length === 0 && (
                    <div className="px-2 py-1 text-gray-500 text-sm">검색 결과가 없습니다</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <input
            type="text"
            value={menu.href}
            onChange={(e) => onUpdate(menu.id, { href: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="링크 URL"
          />
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={menu.visible}
                onChange={(e) => onUpdate(menu.id, { visible: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">표시</span>
            </label>
            <button
              onClick={() => onDelete(menu.id)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}