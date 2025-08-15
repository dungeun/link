'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Plus, Trash2, Save, TestTube } from 'lucide-react'

interface ApiConfig {
  id?: string
  service: string
  apiKey?: string | null
  apiSecret?: string | null
  endpoint?: string | null
  region?: string | null
  bucket?: string | null
  additionalConfig?: Record<string, unknown>
  isEnabled: boolean
}

const API_SERVICES = [
  { 
    value: 'toss_payments', 
    label: 'Toss Payments',
    fields: ['apiKey', 'apiSecret'],
    testable: false,
    description: '토스페이먼츠 결제 서비스 연동'
  },
  { 
    value: 'aws_s3', 
    label: 'AWS S3',
    fields: ['apiKey', 'apiSecret', 'region', 'bucket'],
    testable: true,
    description: '파일 업로드 및 스토리지 서비스'
  },
  { 
    value: 'sendgrid', 
    label: 'SendGrid Email',
    fields: ['apiKey'],
    testable: true,
    description: '이메일 발송 서비스'
  },
  { 
    value: 'twilio', 
    label: 'Twilio SMS',
    fields: ['apiKey', 'apiSecret'],
    testable: false,
    description: 'SMS 발송 서비스'
  },
  { 
    value: 'firebase', 
    label: 'Firebase FCM',
    fields: ['apiKey', 'additionalConfig'],
    testable: false,
    description: '푸시 알림 서비스'
  },
  { 
    value: 'naver_cloud', 
    label: 'Naver Cloud Platform',
    fields: ['apiKey', 'apiSecret', 'endpoint'],
    testable: false,
    description: '네이버 클라우드 서비스'
  },
  { 
    value: 'kakao', 
    label: 'Kakao API',
    fields: ['apiKey'],
    testable: false,
    description: '카카오 소셜 로그인 및 알림톡'
  }
]

export function ApiConfigSection() {
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [editingConfigs, setEditingConfigs] = useState<Record<string, ApiConfig>>({})
  const [changedServices, setChangedServices] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadApiConfigs()
  }, [])

  const loadApiConfigs = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/api-config', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs)
        
        // 편집용 설정 초기화
        const editing: Record<string, ApiConfig> = {}
        data.configs.forEach((config: ApiConfig) => {
          editing[config.service] = config
        })
        setEditingConfigs(editing)
      }
    } catch (error) {
      console.error('Failed to load API configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (service: string) => {
    setSaving(service)
    try {
      const config = editingConfigs[service]
      if (!config) return

      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch('/api/admin/api-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const data = await response.json()
        
        // 설정 목록 업데이트
        const newConfigs = configs.map(c => 
          c.service === service ? data.config : c
        )
        
        // 새 서비스인 경우 추가
        if (!configs.find(c => c.service === service)) {
          newConfigs.push(data.config)
        }
        
        setConfigs(newConfigs)
        
        // 변경 상태 초기화
        const updated = new Set(changedServices)
        updated.delete(service)
        setChangedServices(updated)
        
        alert('API 설정이 저장되었습니다.')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('API 설정 저장에 실패했습니다.')
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (service: string) => {
    if (!confirm('이 API 설정을 삭제하시겠습니까?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch(`/api/admin/api-config?service=${service}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (response.ok) {
        setConfigs(configs.filter(c => c.service !== service))
        delete editingConfigs[service]
        alert('API 설정이 삭제되었습니다.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('API 설정 삭제에 실패했습니다.')
    }
  }

  const handleTest = async (service: string) => {
    setTesting(service)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token')
      const response = await fetch(`/api/admin/api-config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ service })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        alert(`✅ ${getServiceInfo(service)?.label} API 연결 테스트 성공!\n\n${data.message || '정상적으로 연결되었습니다.'}`)
      } else {
        alert(`❌ ${getServiceInfo(service)?.label} API 연결 테스트 실패\n\n${data.error || '연결에 실패했습니다.'}`)
      }
    } catch (error) {
      alert(`❌ ${getServiceInfo(service)?.label} API 연결 테스트 실패\n\n네트워크 오류가 발생했습니다.`)
    } finally {
      setTesting(null)
    }
  }


  const updateConfig = (service: string, field: string, value: string | boolean | Record<string, unknown>) => {
    setEditingConfigs({
      ...editingConfigs,
      [service]: {
        ...editingConfigs[service],
        [field]: value
      }
    })
    
    // 원본과 비교하여 변경 여부 확인
    const original = configs.find(c => c.service === service)
    const updated = new Set(changedServices)
    
    if (original) {
      const isChanged = JSON.stringify(original) !== JSON.stringify({
        ...editingConfigs[service],
        [field]: value
      })
      
      if (isChanged) {
        updated.add(service)
      } else {
        updated.delete(service)
      }
    } else {
      // 새로 추가된 서비스는 항상 변경된 것으로 표시
      updated.add(service)
    }
    
    setChangedServices(updated)
  }

  const getServiceInfo = (service: string) => {
    return API_SERVICES.find(s => s.value === service)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 전체 API 서비스 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {API_SERVICES.map((serviceInfo) => {
          const service = serviceInfo.value
          const config = editingConfigs[service]
          const isConfigured = !!config

          return (
            <div key={service} className={`bg-white p-6 rounded-lg shadow border-2 transition-all ${
              isConfigured 
                ? 'border-blue-200 hover:border-blue-400' 
                : 'border-gray-100 hover:border-gray-300 opacity-75'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {serviceInfo.label}
                    {isConfigured && (
                      <>
                        {changedServices.has(service) && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                            변경됨
                          </span>
                        )}
                        {config.isEnabled && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            활성화
                          </span>
                        )}
                      </>
                    )}
                    {!isConfigured && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                        미설정
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{serviceInfo.description}</p>
                </div>
              </div>

              {!isConfigured ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">이 서비스를 사용하려면 설정이 필요합니다</p>
                  <button
                    onClick={() => {
                      const newConfig: ApiConfig = {
                        service: service,
                        isEnabled: false
                      }
                      setEditingConfigs({
                        ...editingConfigs,
                        [service]: newConfig
                      })
                      setChangedServices(new Set([...changedServices, service]))
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    설정 시작
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <span className="mr-2 text-sm font-medium text-gray-700">서비스 상태:</span>
                      <input
                        type="checkbox"
                        checked={config.isEnabled}
                        onChange={(e) => updateConfig(service, 'isEnabled', e.target.checked)}
                        className="sr-only"
                      />
                      <div className="relative">
                        <div className={`block w-10 h-6 rounded-full transition-colors ${config.isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.isEnabled ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {config.isEnabled ? '활성화' : '비활성화'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    {serviceInfo.fields.includes('apiKey') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets[`${service}_key`] ? 'text' : 'password'}
                        value={config.apiKey || ''}
                        onChange={(e) => updateConfig(service, 'apiKey', e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="API Key 입력"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets({
                          ...showSecrets,
                          [`${service}_key`]: !showSecrets[`${service}_key`]
                        })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={showSecrets[`${service}_key`] ? '값 숨기기' : '값 보기'}
                      >
                        {showSecrets[`${service}_key`] ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                      </div>
                    )}

                    {serviceInfo.fields.includes('apiSecret') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets[`${service}_secret`] ? 'text' : 'password'}
                        value={config.apiSecret || ''}
                        onChange={(e) => updateConfig(service, 'apiSecret', e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="API Secret 입력"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets({
                          ...showSecrets,
                          [`${service}_secret`]: !showSecrets[`${service}_secret`]
                        })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={showSecrets[`${service}_secret`] ? '값 숨기기' : '값 보기'}
                      >
                        {showSecrets[`${service}_secret`] ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                      </div>
                    )}

                    {serviceInfo.fields.includes('endpoint') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={config.endpoint || ''}
                      onChange={(e) => updateConfig(service, 'endpoint', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://api.example.com"
                    />
                      </div>
                    )}

                    {serviceInfo.fields.includes('region') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <input
                      type="text"
                      value={config.region || ''}
                      onChange={(e) => updateConfig(service, 'region', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="ap-northeast-2"
                    />
                      </div>
                    )}

                    {serviceInfo.fields.includes('bucket') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bucket Name
                    </label>
                    <input
                      type="text"
                      value={config.bucket || ''}
                      onChange={(e) => updateConfig(service, 'bucket', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="my-bucket"
                    />
                      </div>
                    )}

                    {serviceInfo.fields.includes('additionalConfig') && (
                      <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      추가 설정 (JSON)
                    </label>
                    <textarea
                      value={config.additionalConfig ? JSON.stringify(config.additionalConfig, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const json = JSON.parse(e.target.value)
                          updateConfig(service, 'additionalConfig', json)
                        } catch {
                          // JSON 파싱 실패 시 무시
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={4}
                      placeholder="{}"
                    />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                    {serviceInfo.testable && (
                      <button
                        onClick={() => handleTest(service)}
                        disabled={testing === service || !config.apiKey}
                        className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                        title={!config.apiKey ? 'API Key를 먼저 입력해주세요' : '연결 테스트'}
                      >
                        <TestTube className="w-4 h-4" />
                        {testing === service ? '테스트 중...' : '테스트'}
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(service)}
                      disabled={saving === service || !changedServices.has(service)}
                      className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                        changedServices.has(service) 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={!changedServices.has(service) ? '변경사항이 없습니다' : '설정 저장'}
                    >
                      <Save className="w-4 h-4" />
                      {saving === service ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 설정을 초기화하시겠습니까?')) {
                          handleDelete(service)
                        }
                      }}
                      className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-1 text-sm font-medium transition-colors"
                      title="설정 초기화"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}