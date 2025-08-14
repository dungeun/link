'use client'

import { useState, useEffect } from 'react'
import { Instagram, Youtube, MessageCircle, BookOpen, RefreshCw, Link, Unlink, TrendingUp } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '@/lib/api/client'
import { useLanguage } from '@/hooks/useLanguage'

interface SNSAccount {
  platform: string
  username: string | null
  isConnected: boolean
  followers: number
  todayVisitors?: number  // 네이버 블로그 오늘 방문자수
  lastUpdated: string | null
}

interface SNSConnectionProps {
  onFollowersUpdate?: (total: number) => void
}

export default function SNSConnection({ onFollowersUpdate }: SNSConnectionProps) {
  const [snsAccounts, setSnsAccounts] = useState<SNSAccount[]>([])
  const [totalFollowers, setTotalFollowers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [connecting, setConnecting] = useState(false)
  const { t } = useLanguage()

  // 플랫폼 정보
  const platformInfo = {
    instagram: {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      placeholder: '@username'
    },
    youtube: {
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-red-600',
      placeholder: '채널명'
    },
    tiktok: {
      name: 'TikTok',
      icon: MessageCircle,
      color: 'bg-black',
      placeholder: '@username'
    },
    naverBlog: {
      name: '네이버 블로그',
      icon: BookOpen,
      color: 'bg-green-600',
      placeholder: '블로그 ID'
    }
  }

  // SNS 계정 정보 로드 (DB에서만 가져오기, 자동 새로고침 안함)
  const loadSNSAccounts = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/api/user/sns-connect')
      if (response.ok) {
        const data = await response.json()
        setSnsAccounts(data.snsAccounts)
        setTotalFollowers(data.totalFollowers)
        if (onFollowersUpdate) {
          onFollowersUpdate(data.totalFollowers)
        }
      }
    } catch (error) {
      console.error('Failed to load SNS accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSNSAccounts()
  }, [])

  // SNS 계정 연동
  const handleConnect = async () => {
    if (!selectedPlatform || !username.trim()) {
      alert('사용자명을 입력해주세요.')
      return
    }

    try {
      setConnecting(true)
      const response = await apiPost('/api/user/sns-connect', {
        platform: selectedPlatform,
        username: username.trim()
      })

      if (response.ok) {
        const data = await response.json()
        
        // 팔로워 수를 가져왔는지 확인
        if (data.followers === 0) {
          alert('계정은 연동되었지만 팔로워 수를 가져올 수 없습니다. 계정명을 다시 확인해주세요.')
        }
        
        // 계정 목록 업데이트
        setSnsAccounts(prev => prev.map(acc => 
          acc.platform === selectedPlatform 
            ? {
                ...acc,
                username: data.username,
                isConnected: true,
                followers: data.followers,
                todayVisitors: data.todayVisitors,
                lastUpdated: data.lastUpdated
              }
            : acc
        ))

        // 총 팔로워 수 재계산
        const newTotal = snsAccounts.reduce((sum, acc) => {
          if (acc.platform === selectedPlatform) {
            return sum + data.followers
          }
          return sum + (acc.followers || 0)
        }, 0)
        
        setTotalFollowers(newTotal)
        if (onFollowersUpdate) {
          onFollowersUpdate(newTotal)
        }

        // 모달 닫기
        setShowConnectModal(false)
        setSelectedPlatform(null)
        setUsername('')
        
        if (data.followers > 0) {
          alert(`SNS 계정이 연동되었습니다! (팔로워: ${data.followers.toLocaleString()}명)`)
        }
      }
    } catch (error) {
      console.error('Failed to connect SNS:', error)
      alert('SNS 계정 연동에 실패했습니다.')
    } finally {
      setConnecting(false)
    }
  }

  // SNS 계정 연동 해제
  const handleDisconnect = async (platform: string) => {
    if (!confirm('정말 연동을 해제하시겠습니까?')) {
      return
    }

    try {
      const response = await apiPost('/api/user/sns-connect', {
        platform,
        disconnect: true
      })

      if (response.ok) {
        // 계정 목록 업데이트
        setSnsAccounts(prev => prev.map(acc => 
          acc.platform === platform 
            ? {
                ...acc,
                username: null,
                isConnected: false,
                followers: 0,
                lastUpdated: null
              }
            : acc
        ))

        // 총 팔로워 수 재계산
        const newTotal = snsAccounts.reduce((sum, acc) => {
          if (acc.platform === platform) {
            return sum
          }
          return sum + (acc.followers || 0)
        }, 0)
        
        setTotalFollowers(newTotal)
        if (onFollowersUpdate) {
          onFollowersUpdate(newTotal)
        }

        alert('SNS 계정 연동이 해제되었습니다.')
      }
    } catch (error) {
      console.error('Failed to disconnect SNS:', error)
      alert('연동 해제에 실패했습니다.')
    }
  }

  // 팔로워 수 새로고침
  const handleRefreshFollowers = async (platform?: string) => {
    try {
      setRefreshing(platform || 'all')
      const url = platform 
        ? `/api/user/sns-connect?platform=${platform}`
        : '/api/user/sns-connect'
      
      const response = await apiPut(url, {})

      if (response.ok) {
        const data = await response.json()
        
        // 팔로워 수 업데이트
        if (data.updated && data.updated.length > 0) {
          setSnsAccounts(prev => {
            const updated = [...prev]
            data.updated.forEach((update: any) => {
              const index = updated.findIndex(acc => acc.platform === update.platform)
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  followers: update.followers,
                  todayVisitors: update.todayVisitors,
                  lastUpdated: update.lastUpdated
                }
              }
            })
            return updated
          })

          // 총 팔로워 수 재계산
          const newTotal = snsAccounts.reduce((sum, acc) => {
            const update = data.updated.find((u: any) => u.platform === acc.platform)
            return sum + (update ? update.followers : acc.followers || 0)
          }, 0)
          
          setTotalFollowers(newTotal)
          if (onFollowersUpdate) {
            onFollowersUpdate(newTotal)
          }
        }

        if (data.updated && data.updated.length > 0) {
          const successCount = data.updated.filter((u: any) => u.followers > 0).length
          if (successCount > 0) {
            alert(`${successCount}개 계정의 팔로워 수가 업데이트되었습니다!`)
          } else {
            alert('팔로워 수를 가져올 수 없습니다. 계정명을 확인하거나 나중에 다시 시도해주세요.')
          }
        } else {
          alert('업데이트할 계정이 없습니다.')
        }
      }
    } catch (error) {
      console.error('Failed to refresh followers:', error)
      alert('팔로워 수 업데이트에 실패했습니다.')
    } finally {
      setRefreshing(null)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">SNS 계정 연동</h3>
        <button
          onClick={() => handleRefreshFollowers()}
          disabled={refreshing === 'all'}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing === 'all' ? 'animate-spin' : ''}`} />
          전체 새로고침
        </button>
      </div>

      {/* 총 팔로워 수 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">총 팔로워 수</p>
            <p className="text-3xl font-bold">{formatNumber(totalFollowers)}</p>
          </div>
          <TrendingUp className="w-10 h-10 opacity-50" />
        </div>
      </div>

      {/* SNS 계정 목록 */}
      <div className="space-y-3">
        {snsAccounts.map((account) => {
          const info = platformInfo[account.platform as keyof typeof platformInfo]
          if (!info) return null

          const Icon = info.icon

          return (
            <div key={account.platform} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{info.name}</p>
                    {account.isConnected ? (
                      <p className="text-sm text-gray-500">@{account.username}</p>
                    ) : (
                      <p className="text-sm text-gray-400">연동되지 않음</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {account.isConnected && (
                    <>
                      <div className="text-right">
                        {account.followers > 0 ? (
                          account.platform === 'naverBlog' ? (
                            <>
                              <p className="font-bold text-gray-900">{formatNumber(account.followers)}<span className="text-xs text-gray-500">(이웃)</span></p>
                              <p className="text-sm text-gray-700">{(account.todayVisitors || 0).toLocaleString()}<span className="text-xs text-gray-500">(방문)</span></p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-gray-900">{formatNumber(account.followers)}</p>
                              <p className="text-xs text-gray-500">팔로워</p>
                            </>
                          )
                        ) : (
                          <>
                            <p className="text-sm text-gray-400">데이터 없음</p>
                            <p className="text-xs text-gray-400">새로고침 시도</p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleRefreshFollowers(account.platform)}
                        disabled={refreshing === account.platform}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing === account.platform ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  )}
                  
                  {account.isConnected ? (
                    <button
                      onClick={() => handleDisconnect(account.platform)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Unlink className="w-4 h-4" />
                      연동 해제
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPlatform(account.platform)
                        setShowConnectModal(true)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Link className="w-4 h-4" />
                      연동하기
                    </button>
                  )}
                </div>
              </div>

              {account.isConnected && account.lastUpdated && (
                <p className="text-xs text-gray-400 mt-2">
                  마지막 업데이트: {new Date(account.lastUpdated).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* 연동 모달 */}
      {showConnectModal && selectedPlatform && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {platformInfo[selectedPlatform as keyof typeof platformInfo]?.name} 계정 연동
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={platformInfo[selectedPlatform as keyof typeof platformInfo]?.placeholder}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConnectModal(false)
                  setSelectedPlatform(null)
                  setUsername('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting || !username.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {connecting ? '연동 중...' : '연동하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}