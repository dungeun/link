'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Globe,
  Search,
  Filter,
  Edit2,
  Plus,
  ChevronRight,
  Home,
  Menu,
  Grid3x3,
  Link2,
  Megaphone,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  MessageSquare
} from 'lucide-react'

interface LanguagePackCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  count: number
  lastUpdated: string
  href: string
  color: string
}

export default function LanguagePacksPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<LanguagePackCategory[]>([
    {
      id: 'hero',
      name: '히어로 배너',
      description: '메인 페이지 상단 슬라이드 텍스트',
      icon: <Home className="w-6 h-6" />,
      count: 15,
      lastUpdated: '2024-01-15',
      href: '/admin/language-packs/hero',
      color: 'blue'
    },
    {
      id: 'header',
      name: '헤더 메뉴',
      description: '상단 네비게이션 메뉴 텍스트',
      icon: <Menu className="w-6 h-6" />,
      count: 8,
      lastUpdated: '2024-01-14',
      href: '/admin/language-packs/header',
      color: 'indigo'
    },
    {
      id: 'category',
      name: '카테고리',
      description: '카테고리 메뉴 및 라벨',
      icon: <Grid3x3 className="w-6 h-6" />,
      count: 24,
      lastUpdated: '2024-01-14',
      href: '/admin/language-packs/category',
      color: 'purple'
    },
    {
      id: 'quicklinks',
      name: '바로가기 링크',
      description: '빠른 접근 링크 텍스트',
      icon: <Link2 className="w-6 h-6" />,
      count: 6,
      lastUpdated: '2024-01-13',
      href: '/admin/language-packs/quicklinks',
      color: 'green'
    },
    {
      id: 'promotion',
      name: '프로모션 배너',
      description: '이벤트 및 공지사항 텍스트',
      icon: <Megaphone className="w-6 h-6" />,
      count: 10,
      lastUpdated: '2024-01-13',
      href: '/admin/language-packs/promotion',
      color: 'orange'
    },
    {
      id: 'campaigns',
      name: '캠페인',
      description: '캠페인 관련 UI 텍스트',
      icon: <ShoppingCart className="w-6 h-6" />,
      count: 32,
      lastUpdated: '2024-01-12',
      href: '/admin/language-packs/campaigns',
      color: 'pink'
    },
    {
      id: 'users',
      name: '사용자',
      description: '사용자 페이지 텍스트',
      icon: <Users className="w-6 h-6" />,
      count: 45,
      lastUpdated: '2024-01-11',
      href: '/admin/language-packs/users',
      color: 'cyan'
    },
    {
      id: 'common',
      name: '공통',
      description: '버튼, 라벨 등 공통 텍스트',
      icon: <Settings className="w-6 h-6" />,
      count: 68,
      lastUpdated: '2024-01-10',
      href: '/admin/language-packs/common',
      color: 'gray'
    },
    {
      id: 'forms',
      name: '폼/입력',
      description: '입력 폼 관련 텍스트',
      icon: <FileText className="w-6 h-6" />,
      count: 52,
      lastUpdated: '2024-01-10',
      href: '/admin/language-packs/forms',
      color: 'teal'
    },
    {
      id: 'messages',
      name: '메시지/알림',
      description: '시스템 메시지 및 알림 텍스트',
      icon: <MessageSquare className="w-6 h-6" />,
      count: 38,
      lastUpdated: '2024-01-09',
      href: '/admin/language-packs/messages',
      color: 'red'
    }
  ])

  const [stats, setStats] = useState({
    totalPacks: 0,
    translatedKo: 0,
    translatedEn: 0,
    translatedJp: 0
  })

  useEffect(() => {
    loadLanguagePackStats()
  }, [])

  const loadLanguagePackStats = async () => {
    try {
      const response = await fetch('/api/admin/language-packs')
      if (response.ok) {
        const packs = await response.json()
        setStats({
          totalPacks: packs.length,
          translatedKo: packs.filter((p: any) => p.ko).length,
          translatedEn: packs.filter((p: any) => p.en).length,
          translatedJp: packs.filter((p: any) => p.jp).length
        })
      }
    } catch (error) {
      console.error('Failed to load language pack stats:', error)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      pink: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100',
      cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100',
      gray: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
      teal: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
      red: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
    }
    return colors[color] || colors.gray
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">언어팩 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                카테고리별로 언어팩을 관리하고 번역을 수정합니다
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/language-packs/bulk-edit')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              일괄 편집
            </button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">전체 언어팩</span>
                <Globe className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPacks}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">한국어</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {Math.round((stats.translatedKo / stats.totalPacks) * 100)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.translatedKo}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">영어</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {Math.round((stats.translatedEn / stats.totalPacks) * 100)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.translatedEn}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">일본어</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {Math.round((stats.translatedJp / stats.totalPacks) * 100)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">{stats.translatedJp}</p>
            </div>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="카테고리 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
              onClick={() => router.push(category.href)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(category.color)}`}>
                    {category.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {category.count}개 항목
                  </span>
                  <span className="text-gray-400">
                    {new Date(category.lastUpdated).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>

              <div className={`h-1 ${getColorClasses(category.color).split(' ')[0]}`} />
            </div>
          ))}
        </div>

        {/* 도움말 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 언어팩 관리 가이드
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <p>• <strong>카테고리별 관리:</strong> 각 섹션의 언어팩을 개별 관리</p>
              <p>• <strong>일괄 편집:</strong> 여러 언어팩을 한 번에 수정</p>
              <p>• <strong>자동 번역:</strong> Google Translate API 연동</p>
            </div>
            <div className="space-y-2">
              <p>• <strong>실시간 반영:</strong> 수정 즉시 사이트에 적용</p>
              <p>• <strong>버전 관리:</strong> 변경 이력 자동 저장</p>
              <p>• <strong>검색 기능:</strong> 키워드로 빠른 검색</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}