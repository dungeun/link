'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableFooterLink } from './SortableFooterLink';
import type { FooterColumn } from '@/lib/stores/ui-config.store';

interface SortableFooterColumnProps {
  column: FooterColumn;
  onUpdate: (columnId: string, updates: Partial<FooterColumn>) => void;
  onDelete: (columnId: string) => void;
  onAddLink: (columnId: string) => void;
}

export function SortableFooterColumn({ column, onUpdate, onDelete, onAddLink }: SortableFooterColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLinkDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = column.links.findIndex((link) => link.id === active.id);
      const newIndex = column.links.findIndex((link) => link.id === over.id);
      
      const newLinks = arrayMove(column.links, oldIndex, newIndex).map((link, index) => ({
        ...link,
        order: index + 1,
      }));
      
      onUpdate(column.id, { links: newLinks });
    }
  };

  const handleLinkUpdate = (linkId: string, updates: any) => {
    const newLinks = column.links.map((link) =>
      link.id === linkId ? { ...link, ...updates } : link
    );
    onUpdate(column.id, { links: newLinks });
  };

  const handleLinkDelete = (linkId: string) => {
    const newLinks = column.links.filter((link) => link.id !== linkId);
    onUpdate(column.id, { links: newLinks });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-white ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
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
            <input
              type="text"
              value={column.title}
              onChange={(e) => onUpdate(column.id, { title: e.target.value })}
              className="px-3 py-2 border rounded-lg font-medium focus:ring-2 focus:ring-indigo-500"
              placeholder="컬럼 제목"
            />
          </div>
          <button
            onClick={() => onDelete(column.id)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 링크 목록 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
        <SortableContext items={column.links} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {column.links.map((link) => (
              <SortableFooterLink
                key={link.id}
                link={link}
                onUpdate={handleLinkUpdate}
                onDelete={handleLinkDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => onAddLink(column.id)}
        className="mt-3 w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + 링크 추가
      </button>
    </div>
  );
}