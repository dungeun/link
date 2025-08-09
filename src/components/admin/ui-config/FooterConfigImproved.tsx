'use client';

import { useState } from 'react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';

interface FooterColumn {
  title: string;
  items: Array<{
    label: string;
    href: string;
  }>;
}

export function FooterConfigImproved() {
  const { config, updateFooter } = useUIConfigStore();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState<number | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('/');

  const generateFooterKey = (type: 'column' | 'item', index?: number) => {
    const timestamp = Date.now();
    if (type === 'column') {
      return `footer.column.custom_${timestamp}`;
    } else {
      return `footer.item.custom_${timestamp}`;
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) {
      alert('컬럼 제목을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      const columnKey = generateFooterKey('column');

      // 언어팩에 추가
      const response = await fetch('/api/admin/language-packs/auto-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: columnKey,
          ko: newColumnTitle,
          category: 'footer',
          autoTranslate: true
        }),
      });

      if (!response.ok) {
        throw new Error('언어팩 추가 실패');
      }

      const languagePackData = await response.json();

      // 새 컬럼 추가
      const newColumn: FooterColumn = {
        title: columnKey,
        items: []
      };

      const updatedColumns = [...(config.footer.columns || []), newColumn];
      updateFooter({ ...config.footer, columns: updatedColumns });

      setNewColumnTitle('');
      setIsAddingColumn(false);

      alert(`컬럼이 추가되었습니다.\n한국어: ${languagePackData.ko}\n영어: ${languagePackData.en}\n일본어: ${languagePackData.ja}`);

    } catch (error) {
      console.error('컬럼 추가 실패:', error);
      alert('컬럼 추가 중 오류가 발생했습니다.');
    }
  };

  const handleAddItem = async (columnIndex: number) => {
    if (!newItemName.trim()) {
      alert('메뉴 이름을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      const itemKey = generateFooterKey('item');

      // 언어팩에 추가
      const response = await fetch('/api/admin/language-packs/auto-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: itemKey,
          ko: newItemName,
          category: 'footer',
          autoTranslate: true
        }),
      });

      if (!response.ok) {
        throw new Error('언어팩 추가 실패');
      }

      const languagePackData = await response.json();

      // 아이템 추가
      const updatedColumns = [...(config.footer.columns || [])];
      updatedColumns[columnIndex].items.push({
        label: itemKey,
        href: newItemUrl || '/'
      });

      updateFooter({ ...config.footer, columns: updatedColumns });

      setNewItemName('');
      setNewItemUrl('/');
      setIsAddingItem(null);

      alert(`메뉴가 추가되었습니다.\n한국어: ${languagePackData.ko}\n영어: ${languagePackData.en}\n일본어: ${languagePackData.ja}`);

    } catch (error) {
      console.error('메뉴 추가 실패:', error);
      alert('메뉴 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteColumn = async (columnIndex: number) => {
    if (!confirm('이 컬럼과 모든 하위 메뉴를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      const column = config.footer.columns[columnIndex];

      // 커스텀 컬럼인 경우 언어팩에서 삭제
      if (token && column.title.includes('custom_')) {
        await fetch(`/api/admin/language-packs/${column.title}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // 하위 아이템들도 언어팩에서 삭제
        for (const item of column.items) {
          if (item.label.includes('custom_')) {
            await fetch(`/api/admin/language-packs/${item.label}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          }
        }
      }

      const updatedColumns = config.footer.columns.filter((_, index) => index !== columnIndex);
      updateFooter({ ...config.footer, columns: updatedColumns });

    } catch (error) {
      console.error('컬럼 삭제 실패:', error);
      alert('컬럼 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteItem = async (columnIndex: number, itemIndex: number) => {
    if (!confirm('이 메뉴를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
      const item = config.footer.columns[columnIndex].items[itemIndex];

      // 커스텀 아이템인 경우 언어팩에서 삭제
      if (token && item.label.includes('custom_')) {
        await fetch(`/api/admin/language-packs/${item.label}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      const updatedColumns = [...config.footer.columns];
      updatedColumns[columnIndex].items = updatedColumns[columnIndex].items.filter((_, index) => index !== itemIndex);
      updateFooter({ ...config.footer, columns: updatedColumns });

    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('메뉴 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateItem = (columnIndex: number, itemIndex: number, updates: any) => {
    const updatedColumns = [...config.footer.columns];
    updatedColumns[columnIndex].items[itemIndex] = {
      ...updatedColumns[columnIndex].items[itemIndex],
      ...updates
    };
    updateFooter({ ...config.footer, columns: updatedColumns });
  };

  return (
    <div className="space-y-6">
      {/* 푸터 컬럼 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">푸터 컬럼 설정</h2>
          <button
            onClick={() => setIsAddingColumn(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            컬럼 추가
          </button>
        </div>

        {/* 새 컬럼 추가 폼 */}
        {isAddingColumn && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3">새 컬럼 추가</h3>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="컬럼 제목 (한국어)"
                />
              </div>
              <button
                onClick={handleAddColumn}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnTitle('');
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                취소
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              * 컬럼 제목은 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}

        {/* 컬럼 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.footer.columns?.map((column, columnIndex) => (
            <div key={columnIndex} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
                  {column.title.includes('.') ? (
                    <code className="text-sm bg-gray-200 px-2 py-1 rounded">{column.title}</code>
                  ) : (
                    column.title
                  )}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsAddingItem(columnIndex)}
                    className="text-blue-600 hover:text-blue-800"
                    title="메뉴 추가"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  {column.title.includes('custom_') && (
                    <button
                      onClick={() => handleDeleteColumn(columnIndex)}
                      className="text-red-500 hover:text-red-700"
                      title="컬럼 삭제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 아이템 추가 폼 */}
              {isAddingItem === columnIndex && (
                <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm mb-2"
                    placeholder="메뉴 이름 (한국어)"
                  />
                  <input
                    type="text"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm mb-2"
                    placeholder="링크 URL"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddItem(columnIndex)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      추가
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingItem(null);
                        setNewItemName('');
                        setNewItemUrl('/');
                      }}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 아이템 목록 */}
              <div className="space-y-2">
                {column.items?.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2 bg-white p-2 rounded">
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => handleUpdateItem(columnIndex, itemIndex, { href: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      placeholder="URL"
                    />
                    {item.label.includes('custom_') && (
                      <button
                        onClick={() => handleDeleteItem(columnIndex, itemIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <div className="text-xs text-gray-500">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(!config.footer.columns || config.footer.columns.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            푸터 컬럼이 없습니다. 위의 "컬럼 추가" 버튼을 클릭하여 컬럼을 추가하세요.
          </div>
        )}
      </div>

      {/* 회사 정보 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">회사 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
            <input
              type="text"
              value={config.footer.companyInfo?.name || ''}
              onChange={(e) => updateFooter({
                ...config.footer,
                companyInfo: { ...config.footer.companyInfo, name: e.target.value }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              value={config.footer.companyInfo?.address || ''}
              onChange={(e) => updateFooter({
                ...config.footer,
                companyInfo: { ...config.footer.companyInfo, address: e.target.value }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={config.footer.companyInfo?.email || ''}
              onChange={(e) => updateFooter({
                ...config.footer,
                companyInfo: { ...config.footer.companyInfo, email: e.target.value }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="tel"
              value={config.footer.companyInfo?.phone || ''}
              onChange={(e) => updateFooter({
                ...config.footer,
                companyInfo: { ...config.footer.companyInfo, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}