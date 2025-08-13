'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FooterLink } from '@/lib/stores/ui-config.store';

interface SortableFooterLinkProps {
  link: FooterLink;
  onUpdate: (linkId: string, updates: Partial<FooterLink>) => void;
  onDelete: (linkId: string) => void;
}

export function SortableFooterLink({ link, onUpdate, onDelete }: SortableFooterLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 bg-gray-50 rounded ${isDragging ? 'shadow-md' : ''}`}
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>

      {/* 링크 라벨 */}
      <input
        type="text"
        value={link.label}
        onChange={(e) => onUpdate(link.id, { label: e.target.value })}
        className="flex-1 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-indigo-500"
        placeholder="링크 텍스트"
      />

      {/* 링크 URL */}
      <input
        type="text"
        value={link.href}
        onChange={(e) => onUpdate(link.id, { href: e.target.value })}
        className="flex-1 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-indigo-500"
        placeholder="URL"
      />

      {/* 표시 여부 */}
      <input
        type="checkbox"
        checked={link.visible}
        onChange={(e) => onUpdate(link.id, { visible: e.target.checked })}
        className="w-4 h-4"
      />

      {/* 삭제 버튼 */}
      <button
        onClick={() => onDelete(link.id)}
        className="text-red-500 hover:text-red-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}