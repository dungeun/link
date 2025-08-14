import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== TEST LOGIN API ===')
  
  try {
    const body = await request.json()
    console.log('Body received:', body)
    
    return NextResponse.json({
      success: true,
      received: body
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed to parse JSON',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 })
  }
}