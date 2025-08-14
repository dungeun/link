import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = Array.isArray(params.path) ? params.path.join('/') : params.path;
    
    console.log('File request:', { filePath, fullUrl: request.url });
    
    // Vercel 환경에서는 파일 시스템 접근 불가
    if (process.env.VERCEL) {
      console.log('Vercel environment: file serving not supported');
      return new NextResponse('File not found in deployment environment', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    // 로컬 환경에서 파일 서빙
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
    
    console.log('Trying to serve file from:', fullPath);
    
    try {
      await access(fullPath, constants.F_OK);
    } catch {
      console.log('File not found:', fullPath);
      return new NextResponse('File not found', { status: 404 });
    }
    
    const fileBuffer = await readFile(fullPath);
    
    // MIME 타입 추정
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1년 캐시
      },
    });
    
  } catch (error) {
    console.error('File serving error:', {
      error: error instanceof Error ? error.message : String(error),
      path: params.path
    });
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}