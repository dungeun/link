'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuItem } from '@/lib/stores/ui-config.store';

interface SortableMenuItemProps {
  menu: MenuItem;
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onDelete: (id: string) => void;
}

export function SortableMenuItem({ menu, onUpdate, onDelete }: SortableMenuItemProps) {
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
          <input
            type="text"
            value={menu.label}
            onChange={(e) => onUpdate(menu.id, { label: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="메뉴 이름"
          />
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