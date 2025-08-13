'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableMenuItemImproved } from './SortableMenuItemImproved';
import { useLanguage } from '@/hooks/useLanguage';

interface MenuItem {
  id: string;
  label: string;
  name: string;
  href: string;
  icon?: string | null;
  visible: boolean;
  order: number;
}

export function HeaderConfigDB() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuUrl, setNewMenuUrl] = useState('/');
  const [newMenuIcon, setNewMenuIcon] = useState('');
  const { t } = useLanguage();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 메뉴 목록 로드
  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ui-menus?type=header');
      
      if (response.ok) {
        const data = await response.json();
        const formattedMenus = data.menus.map((menu: any) => ({
          id: menu.id,
          label: menu.content?.label || menu.sectionId,
          name: menu.content?.name || '',
          href: menu.content?.href || '/',
          icon: menu.content?.icon,
          visible: menu.visible,
          order: menu.order
        }));
        setMenus(formattedMenus);
      }
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = menus.findIndex((item) => item.id === active.id);
      const newIndex = menus.findIndex((item) => item.id === over.id);
      
      const newMenus = arrayMove(menus, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      
      setMenus(newMenus);

      // 순서 업데이트 API 호출
      for (const menu of newMenus) {
        await fetch('/api/admin/ui-menus', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({
            id: menu.id,
            order: menu.order
          })
        });
      }
    }
  };

  const handleMenuUpdate = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const response = await fetch('/api/admin/ui-menus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          id,
          ...updates,
          autoTranslate: true
        })
      });

      if (response.ok) {
        const newMenus = menus.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        );
        setMenus(newMenus);
      }
    } catch (error) {
      console.error('Failed to update menu:', error);
      alert('메뉴 업데이트 실패');
    }
  };

  const handleAddMenu = async () => {
    if (!newMenuName.trim()) {
      alert('메뉴 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/ui-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          type: 'header',
          name: newMenuName,
          href: newMenuUrl || '/',
          icon: newMenuIcon || null,
          autoTranslate: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 메뉴 목록 새로고침
        await loadMenus();
        
        // 입력 필드 초기화
        setNewMenuName('');
        setNewMenuUrl('/');
        setNewMenuIcon('');
        setIsAddingMenu(false);
        
        alert('메뉴가 추가되고 자동 번역되었습니다.');
      } else {
        throw new Error('메뉴 추가 실패');
      }
    } catch (error) {
      console.error('Failed to add menu:', error);
      alert('메뉴 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('이 메뉴를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ui-menus?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        setMenus(menus.filter((item) => item.id !== id));
        alert('메뉴가 삭제되었습니다.');
      } else {
        throw new Error('메뉴 삭제 실패');
      }
    } catch (error) {
      console.error('Failed to delete menu:', error);
      alert('메뉴 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">메뉴를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">헤더 메뉴 설정</h2>
          <button
            onClick={() => setIsAddingMenu(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            메뉴 추가
          </button>
        </div>

        {/* 새 메뉴 추가 폼 */}
        {isAddingMenu && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3">새 메뉴 추가</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메뉴 이름 (한국어)
                </label>
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 이벤트"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  링크 URL
                </label>
                <input
                  type="text"
                  value={newMenuUrl}
                  onChange={(e) => setNewMenuUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: /events"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이콘 (선택)
                </label>
                <input
                  type="text"
                  value={newMenuIcon}
                  onChange={(e) => setNewMenuIcon(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 📅"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleAddMenu}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setIsAddingMenu(false);
                    setNewMenuName('');
                    setNewMenuUrl('/');
                    setNewMenuIcon('');
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  취소
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              * 메뉴 이름은 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}

        {/* 기존 메뉴 목록 */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
            <div className="col-span-1"></div>
            <div className="col-span-3">메뉴 이름</div>
            <div className="col-span-3">언어팩 키</div>
            <div className="col-span-3">링크 URL</div>
            <div className="col-span-2 text-center">작업</div>
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={menus} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {menus.map((menu) => (
                  <SortableMenuItemImproved
                    key={menu.id}
                    menu={menu}
                    onUpdate={handleMenuUpdate}
                    onDelete={handleDeleteMenu}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {menus.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            메뉴가 없습니다. 위의 "메뉴 추가" 버튼을 클릭하여 메뉴를 추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}