'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import SNSConnection from './SNSConnection'

interface ConnectedPlatform {
  platform: string
  username: string
  isConnected: boolean
  followers?: number
  profileImage?: string
  connectDate?: string
}

interface SNSIntegrationSettingsProps {
  connectedPlatforms: ConnectedPlatform[]
  onPlatformUpdate: (platforms: ConnectedPlatform[]) => void
  userId: string
  refreshConnections: () => Promise<void>
}

export default function SNSIntegrationSettings({
  connectedPlatforms,
  onPlatformUpdate,
  userId,
  refreshConnections
}: SNSIntegrationSettingsProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`${platform} 연동을 해제하시겠습니까?`)) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/user/sns-connect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform })
      })

      if (response.ok) {
        // 해당 플랫폼을 연동 해제 상태로 업데이트
        const updatedPlatforms = connectedPlatforms.map(p => 
          p.platform === platform 
            ? { ...p, isConnected: false, username: '', followers: 0 }
            : p
        )
        onPlatformUpdate(updatedPlatforms)
        await refreshConnections()
        alert(`${platform} 연동이 해제되었습니다.`)
      } else {
        alert(`${platform} 연동 해제에 실패했습니다.`)
      }
    } catch (error) {
      console.error('SNS 연동 해제 오류:', error)
      alert('연동 해제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* SNS 연동 관리 섹션 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">SNS 계정 연동 관리</h4>
        
        <SNSConnection 
          connectedPlatforms={connectedPlatforms}
          onConnectionUpdate={async (updatedPlatforms) => {
            onPlatformUpdate(updatedPlatforms)
            await refreshConnections()
          }}
        />

        {/* 연동 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-xl">💡</div>
            <div>
              <h5 className="font-medium text-blue-900 mb-2">SNS 연동 안내</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• SNS 계정을 연동하면 실시간 팔로워 수와 통계를 확인할 수 있습니다</li>
                <li>• 연동된 계정 정보는 캠페인 신청 시 자동으로 활용됩니다</li>
                <li>• 정확한 통계를 위해 공개 계정으로 설정해주세요</li>
                <li>• 계정 정보는 안전하게 암호화되어 저장됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 연동 통계 요약 */}
      {connectedPlatforms.some(p => p.isConnected) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">연동 통계 요약</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {connectedPlatforms.filter(p => p.isConnected).length}
              </div>
              <div className="text-sm text-gray-600">연동된 플랫폼</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(connectedPlatforms.reduce((sum, p) => sum + (p.followers || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">총 팔로워</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((connectedPlatforms.filter(p => p.isConnected).length / connectedPlatforms.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">연동 완성도</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {connectedPlatforms.find(p => p.isConnected && p.followers === Math.max(...connectedPlatforms.map(p => p.followers || 0)))?.platform || '-'}
              </div>
              <div className="text-sm text-gray-600">주요 플랫폼</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}