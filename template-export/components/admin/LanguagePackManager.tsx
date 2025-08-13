'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, RefreshCw, Search } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface LanguagePack {
  id: string;
  key: string;
  ko: string;
  en: string;
  jp: string;
  category: string;
  description?: string;
  isEditable: boolean;
}

export default function LanguagePackManager() {
  const [languagePacks, setLanguagePacks] = useState<LanguagePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<LanguagePack | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // 언어팩 로드
  const loadLanguagePacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await adminApi.get(`/api/admin/language-packs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLanguagePacks(data);
      }
    } catch (error) {
      console.error('언어팩 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguagePacks();
  }, [selectedCategory, searchTerm]);

  // 기본 언어팩 초기화
  const initializeLanguagePacks = async () => {
    if (!confirm('기본 언어팩을 초기화하시겠습니까? 기존 항목은 유지됩니다.')) {
      return;
    }

    try {
      setIsInitializing(true);
      const response = await adminApi.put('/api/admin/language-packs/translate');
      if (response.ok) {
        const result = await response.json();
        alert(`초기화 완료!\n생성: ${result.summary.created}개\n건너뜀: ${result.summary.skipped}개`);
        loadLanguagePacks();
      } else {
        throw new Error('초기화 실패');
      }
    } catch (error) {
      console.error('언어팩 초기화 실패:', error);
      alert('언어팩 초기화에 실패했습니다.');
    } finally {
      setIsInitializing(false);
    }
  };

  // 언어팩 삭제
  const deletePack = async (id: string) => {
    if (!confirm('이 언어팩을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await adminApi.delete(`/api/admin/language-packs?id=${id}`);
      if (response.ok) {
        loadLanguagePacks();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('언어팩 삭제 실패:', error);
      alert('언어팩 삭제에 실패했습니다.');
    }
  };

  const categories = ['all', 'menu', 'button', 'label', 'message', 'other'];

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">언어팩 관리</h1>
        <p className="text-gray-600">시스템 전체의 다국어 텍스트를 관리합니다.</p>
      </div>

      {/* 툴바 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {/* 카테고리 필터 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '전체' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {/* 초기화 버튼 */}
            <button
              onClick={initializeLanguagePacks}
              disabled={isInitializing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
              기본 항목 초기화
            </button>

            {/* 추가 버튼 */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 언어팩 추가
            </button>
          </div>
        </div>
      </div>

      {/* 언어팩 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">키</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">카테고리</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">한국어</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">영어</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">일본어</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">설명</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : languagePacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    언어팩이 없습니다.
                  </td>
                </tr>
              ) : (
                languagePacks.map((pack) => (
                  <tr key={pack.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{pack.key}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs">
                        {pack.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{pack.ko}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{pack.en}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{pack.jp}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {pack.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {pack.isEditable && (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditingPack(pack)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePack(pack.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성/수정 모달 */}
      {(isCreateModalOpen || editingPack) && (
        <LanguagePackModal
          pack={editingPack}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPack(null);
          }}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            setEditingPack(null);
            loadLanguagePacks();
          }}
        />
      )}
    </div>
  );
}

// 언어팩 생성/수정 모달
function LanguagePackModal({
  pack,
  onClose,
  onSuccess
}: {
  pack?: LanguagePack | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    key: pack?.key || '',
    ko: pack?.ko || '',
    en: pack?.en || '',
    jp: pack?.jp || '',
    category: pack?.category || 'label',
    description: pack?.description || '',
    autoTranslate: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/admin/language-packs';
      const method = pack ? 'PUT' : 'POST';
      const body = pack 
        ? { id: pack.id, ...formData }
        : formData;

      const response = await adminApi[method.toLowerCase() as 'post' | 'put'](url, body);
      
      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('언어팩 저장 실패:', error);
      alert('언어팩 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {pack ? '언어팩 수정' : '새 언어팩 추가'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* 키 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                키 (Key) *
              </label>
              <input
                type="text"
                required
                disabled={!!pack}
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="예: menu.home"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                required
                disabled={!!pack}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="menu">Menu</option>
                <option value="button">Button</option>
                <option value="label">Label</option>
                <option value="message">Message</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* 한국어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                한국어 *
              </label>
              <input
                type="text"
                required
                value={formData.ko}
                onChange={(e) => setFormData({ ...formData, ko: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 영어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영어
              </label>
              <input
                type="text"
                value={formData.en}
                onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={!pack ? "비워두면 자동 번역됩니다" : ""}
              />
            </div>

            {/* 일본어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일본어
              </label>
              <input
                type="text"
                value={formData.jp}
                onChange={(e) => setFormData({ ...formData, jp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={!pack ? "비워두면 자동 번역됩니다" : ""}
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="이 텍스트가 사용되는 위치나 용도를 설명하세요"
              />
            </div>

            {/* 자동 번역 옵션 */}
            {!pack && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoTranslate"
                  checked={formData.autoTranslate}
                  onChange={(e) => setFormData({ ...formData, autoTranslate: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoTranslate" className="text-sm text-gray-700">
                  비어있는 언어는 자동 번역 (Google Translate API 필요)
                </label>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}