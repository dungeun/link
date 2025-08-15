import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/api-config - API 설정 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    // 모든 API 설정 조회
    const apiConfigs = await prisma.apiConfig.findMany({
      orderBy: { service: 'asc' }
    })

    // 민감한 정보는 마스킹 처리
    const maskedConfigs = apiConfigs.map(config => ({
      ...config,
      apiKey: config.apiKey ? maskApiKey(config.apiKey) : null,
      apiSecret: config.apiSecret ? '**********' : null
    }))

    return NextResponse.json({
      configs: maskedConfigs
    })

  } catch (error) {
    console.error('Get API configs error:', error)
    return NextResponse.json(
      { error: 'Failed to get API configurations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/api-config - API 설정 추가/업데이트
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { service, apiKey, apiSecret, endpoint, region, bucket, additionalConfig, isEnabled } = body

    if (!service) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      )
    }

    // 기존 설정 확인
    const existing = await prisma.apiConfig.findUnique({
      where: { service }
    })

    let result
    if (existing) {
      // 업데이트 - 빈 값이 아닌 경우만 업데이트
      const updateData: Record<string, unknown> = { isEnabled }
      
      if (apiKey && apiKey !== maskApiKey(existing.apiKey || '')) {
        updateData.apiKey = apiKey
      }
      if (apiSecret && apiSecret !== '**********') {
        updateData.apiSecret = apiSecret
      }
      if (endpoint !== undefined) updateData.endpoint = endpoint
      if (region !== undefined) updateData.region = region
      if (bucket !== undefined) updateData.bucket = bucket
      if (additionalConfig !== undefined) updateData.additionalConfig = additionalConfig

      result = await prisma.apiConfig.update({
        where: { service },
        data: updateData
      })
    } else {
      // 새로 생성
      result = await prisma.apiConfig.create({
        data: {
          service,
          apiKey,
          apiSecret,
          endpoint,
          region,
          bucket,
          additionalConfig,
          isEnabled: isEnabled ?? false
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...result,
        apiKey: result.apiKey ? maskApiKey(result.apiKey) : null,
        apiSecret: result.apiSecret ? '**********' : null
      }
    })

  } catch (error) {
    console.error('Save API config error:', error)
    return NextResponse.json(
      { error: 'Failed to save API configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/api-config/[service] - API 설정 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')

    if (!service) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      )
    }

    await prisma.apiConfig.delete({
      where: { service }
    })

    return NextResponse.json({
      success: true,
      message: 'API configuration deleted successfully'
    })

  } catch (error) {
    console.error('Delete API config error:', error)
    return NextResponse.json(
      { error: 'Failed to delete API configuration' },
      { status: 500 }
    )
  }
}

// API 키 마스킹 함수
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '********'
  }
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}