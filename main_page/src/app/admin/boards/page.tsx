'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, Filter, ChevronDown } from 'lucide-react'

interface Board {
  id: string
  name: string
  description: string
  category: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  postCount: number
  visibility: 'PUBLIC' | 'PRIVATE' | 'MEMBERS_ONLY'
  createdAt: string
  updatedAt: string
  lastPostAt: string | null
}

interface BoardPost {
  id: string
  boardId: string
  title: string
  author: string
  status: 'PUBLISHED' | 'DRAFT' | 'HIDDEN'
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
}

export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(false)

  // 게시판 목록 로드
  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/boards')
      if (response.ok) {
        const data = await response.json()
        setBoards(data.boards)
      }
    } catch (error) {
      console.error('Failed to load boards:', error)
    } finally {
      setLoading(false)
    }
  }

  // 게시판 선택 시 게시물 로드
  const selectBoard = async (board: Board) => {
    setSelectedBoard(board)
    try {
      const response = await fetch(`/api/admin/boards/${board.id}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  // 게시판 상태 변경
  const toggleBoardStatus = async (boardId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const response = await fetch(`/api/admin/boards/${boardId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        loadBoards()
      }
    } catch (error) {
      console.error('Failed to update board status:', error)
    }
  }

  // 게시물 상태 변경
  const togglePostStatus = async (postId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED'
    try {
      const response = await fetch(`/api/admin/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok && selectedBoard) {
        selectBoard(selectedBoard)
      }
    } catch (error) {
      console.error('Failed to update post status:', error)
    }
  }

  // 게시판 삭제
  const deleteBoard = async (boardId: string) => {
    if (!confirm('정말 이 게시판을 삭제하시겠습니까? 모든 게시물도 함께 삭제됩니다.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadBoards()
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(null)
          setPosts([])
        }
      }
    } catch (error) {
      console.error('Failed to delete board:', error)
    }
  }

  // 게시물 삭제
  const deletePost = async (postId: string) => {
    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE'
      })
      if (response.ok && selectedBoard) {
        selectBoard(selectedBoard)
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  // 필터된 게시판 목록
  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          board.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || board.category === filterCategory
    const matchesStatus = filterStatus === 'all' || board.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            플랫폼의 모든 게시판과 콘텐츠를 관리합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 게시판 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">게시판 목록</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 검색 및 필터 */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="게시판 검색..."
                      className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border rounded-lg"
                    >
                      <option value="all">모든 카테고리</option>
                      <option value="notice">공지사항</option>
                      <option value="faq">FAQ</option>
                      <option value="community">커뮤니티</option>
                      <option value="review">리뷰</option>
                      <option value="event">이벤트</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border rounded-lg"
                    >
                      <option value="all">모든 상태</option>
                      <option value="ACTIVE">활성</option>
                      <option value="INACTIVE">비활성</option>
                      <option value="ARCHIVED">보관</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 게시판 리스트 */}
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">로딩 중...</div>
                ) : filteredBoards.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">게시판이 없습니다</div>
                ) : (
                  filteredBoards.map(board => (
                    <div
                      key={board.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                        selectedBoard?.id === board.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => selectBoard(board)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{board.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{board.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {board.category}
                            </span>
                            <span>{board.postCount}개 게시물</span>
                            <span
                              className={`px-2 py-1 rounded ${
                                board.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : board.status === 'INACTIVE'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {board.status === 'ACTIVE' ? '활성' : 
                               board.status === 'INACTIVE' ? '비활성' : '보관'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBoardStatus(board.id, board.status)
                            }}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                          >
                            {board.status === 'ACTIVE' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingBoard(board)
                              setShowEditModal(true)
                            }}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteBoard(board.id)
                            }}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 게시물 목록 */}
          <div className="lg:col-span-2">
            {selectedBoard ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedBoard.name} - 게시물
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        총 {posts.length}개의 게시물
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      새 게시물
                    </button>
                  </div>
                </div>

                {/* 게시물 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          제목
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          작성자
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          상태
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          조회
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          좋아요
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          댓글
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          작성일
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {posts.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            게시물이 없습니다
                          </td>
                        </tr>
                      ) : (
                        posts.map(post => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {post.title}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {post.author}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  post.status === 'PUBLISHED'
                                    ? 'bg-green-100 text-green-700'
                                    : post.status === 'DRAFT'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {post.status === 'PUBLISHED' ? '게시' :
                                 post.status === 'DRAFT' ? '임시' : '숨김'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {post.viewCount}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {post.likeCount}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {post.commentCount}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => togglePostStatus(post.id, post.status)}
                                  className="p-1 text-gray-500 hover:text-indigo-600"
                                >
                                  {post.status === 'PUBLISHED' ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  className="p-1 text-gray-500 hover:text-indigo-600"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deletePost(post.id)}
                                  className="p-1 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">게시판을 선택하세요</p>
                  <p className="text-sm">왼쪽 목록에서 관리할 게시판을 선택하면</p>
                  <p className="text-sm">해당 게시판의 게시물을 관리할 수 있습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 게시판 생성/수정 모달은 필요시 추가 */}
    </div>
  )
}