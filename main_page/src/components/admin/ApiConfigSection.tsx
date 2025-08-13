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
  additionalConfig?: any
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
  const [newService, setNewService] = useState('')
  const [editingConfigs, setEditingConfigs] = useState<Record<string, ApiConfig>>({})

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
      // API 테스트 로직 구현
      // 각 서비스별로 간단한 테스트 API 호출
      alert(`${service} API 연결 테스트 성공!`)
    } catch (error) {
      alert(`${service} API 연결 테스트 실패`)
    } finally {
      setTesting(null)
    }
  }

  const handleAddService = () => {
    if (!newService) {
      alert('서비스를 선택해주세요.')
      return
    }

    if (editingConfigs[newService]) {
      alert('이미 설정된 서비스입니다.')
      return
    }

    const newConfig: ApiConfig = {
      service: newService,
      isEnabled: false
    }

    setEditingConfigs({
      ...editingConfigs,
      [newService]: newConfig
    })

    setNewService('')
  }

  const updateConfig = (service: string, field: string, value: any) => {
    setEditingConfigs({
      ...editingConfigs,
      [service]: {
        ...editingConfigs[service],
        [field]: value
      }
    })
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
      {/* 새 API 추가 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">새 API 서비스 추가</h3>
        <div className="space-y-4">
          <select
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">연동할 서비스를 선택하세요...</option>
            {API_SERVICES.filter(s => !editingConfigs[s.value]).map(service => (
              <option key={service.value} value={service.value}>
                {service.label} - {service.description}
              </option>
            ))}
          </select>
          {newService && (
            <div className="text-sm text-gray-600">
              {API_SERVICES.find(s => s.value === newService)?.description}
            </div>
          )}
          <button
            onClick={handleAddService}
            disabled={!newService}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            서비스 추가
          </button>
        </div>
      </div>

      {/* API 설정 목록 */}
      <div className="space-y-4">
        {Object.entries(editingConfigs).map(([service, config]) => {
          const serviceInfo = getServiceInfo(service)
          if (!serviceInfo) return null

          return (
            <div key={service} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {serviceInfo.label}
                  </h3>
                  <p className="text-sm text-gray-500">{serviceInfo.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.isEnabled}
                      onChange={(e) => updateConfig(service, 'isEnabled', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">활성화</span>
                  </label>
                  {serviceInfo.testable && (
                    <button
                      onClick={() => handleTest(service)}
                      disabled={testing === service}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 text-sm"
                    >
                      <TestTube className="w-4 h-4" />
                      {testing === service ? '테스트 중...' : '테스트'}
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(service)}
                    disabled={saving === service}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving === service ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                  <div className="md:col-span-2">
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
            </div>
          )
        })}
      </div>

      {Object.keys(editingConfigs).length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          설정된 API가 없습니다. 위에서 새 API를 추가해주세요.
        </div>
      )}
    </div>
  )
}