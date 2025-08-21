import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { authService } from '@/lib/auth/services'
import { logger } from '@/lib/logger'
import { headerManager, MenuUpdateData, HeaderLogo, HeaderCTAButton } from '@/lib/cache/header-manager'

// 헤더 데이터 조회 (JSON에서 직접 로드)
export async function GET() {
  try {
    const headerData = await headerManager.getHeaderData()
    
    if (!headerData) {
      return NextResponse.json(
        { error: 'Failed to load header data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: headerData
    })
  } catch (error) {
    logger.errorWithException('Failed to get header data', error as Error, 'HeaderAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 헤더 데이터 업데이트 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    const payload = await authService.verifyToken(token)
    
    if (!payload || payload.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    let result = false

    switch (action) {
      case 'updateMenu':
        const menuData = data as MenuUpdateData
        result = await headerManager.updateMenu(menuData)
        break

      case 'updateMenuOrder':
        const { newOrder } = data
        result = await headerManager.updateMenuOrder(newOrder)
        break

      case 'toggleMenuVisibility':
        const { menuId } = data
        result = await headerManager.toggleMenuVisibility(menuId)
        break

      case 'updateLogo':
        const logoData = data as HeaderLogo
        result = await headerManager.updateLogo(logoData)
        break

      case 'updateCTAButton':
        const ctaData = data as HeaderCTAButton
        result = await headerManager.updateCTAButton(ctaData)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update header data' },
        { status: 500 }
      )
    }

    // 업데이트된 데이터 반환
    const updatedHeaderData = await headerManager.getHeaderData()

    return NextResponse.json({
      success: true,
      message: `Header ${action} completed successfully`,
      data: updatedHeaderData
    })

  } catch (error) {
    logger.errorWithException('Failed to update header', error as Error, 'HeaderAPI')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}