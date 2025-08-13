'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableMenuItemWithLanguagePack } from '@/components/admin/SortableMenuItemWithLanguagePack';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import type { MenuItem } from '@/lib/stores/ui-config.store';

export function HeaderConfigTab() {
  const { config, updateHeaderMenus } = useUIConfigStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleHeaderDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = config.header.menus.findIndex((item) => item.id === active.id);
      const newIndex = config.header.menus.findIndex((item) => item.id === over.id);
      
      const newMenus = arrayMove(config.header.menus, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      
      updateHeaderMenus(newMenus);
    }
  };

  const handleMenuUpdate = (id: string, updates: Partial<MenuItem>) => {
    const newMenus = config.header.menus.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    updateHeaderMenus(newMenus);
  };

  const handleAddMenu = () => {
    const newMenu: MenuItem = {
      id: `menu-${Date.now()}`,
      label: '새 메뉴',
      href: '#',
      order: config.header.menus.length + 1,
      visible: true,
    };
    updateHeaderMenus([...config.header.menus, newMenu]);
  };

  const handleDeleteMenu = (id: string) => {
    updateHeaderMenus(config.header.menus.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 메뉴 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">메뉴 설정</h2>
          <button
            onClick={handleAddMenu}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            메뉴 추가
          </button>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleHeaderDragEnd}>
          <SortableContext items={config.header.menus} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {config.header.menus.map((menu) => (
                <SortableMenuItemWithLanguagePack
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

    </div>
  );
}