import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for sharp to avoid build issues
let sharp: any;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp module not available, using fallback');
}

export async function GET(request: NextRequest) {
  try {
    // Sharp 모듈이 없으면 원본 이미지를 그대로 반환
    if (!sharp) {
      const imageUrl = new URL(request.url).searchParams.get('url');
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Image URL is required' },
          { status: 400 }
        );
      }
      
      // 원본 이미지를 프록시로 전달
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch image' },
          { status: 404 }
        );
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      return new NextResponse(new Uint8Array(imageBuffer), {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=2592000, immutable'
        }
      });
    }
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const format = searchParams.get('format') || 'webp';
    const quality = parseInt(searchParams.get('quality') || '85');
    const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined;
    const height = searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // 이미지 URL 검증
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // 외부 이미지 가져오기
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: 404 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Sharp를 사용한 이미지 처리
    let sharpInstance = sharp(Buffer.from(imageBuffer));
    
    // 크기 조정
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    } else {
      // 최대 크기 제한 (1920px)
      sharpInstance = sharpInstance.resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // 포맷 변환 및 최적화
    let optimizedBuffer: Buffer;
    let contentType = 'image/webp';

    switch (format) {
      case 'webp':
        optimizedBuffer = await sharpInstance
          .webp({ quality, effort: 4 })
          .toBuffer();
        contentType = 'image/webp';
        break;
      case 'avif':
        optimizedBuffer = await sharpInstance
          .avif({ quality, effort: 4 })
          .toBuffer();
        contentType = 'image/avif';
        break;
      case 'jpeg':
      case 'jpg':
        optimizedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true, mozjpeg: true })
          .toBuffer();
        contentType = 'image/jpeg';
        break;
      case 'png':
        optimizedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9, progressive: true })
          .toBuffer();
        contentType = 'image/png';
        break;
      default:
        // 기본값은 WebP
        optimizedBuffer = await sharpInstance
          .webp({ quality, effort: 4 })
          .toBuffer();
        contentType = 'image/webp';
    }

    // 캐시 헤더 설정 (1달)
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'X-Original-Size': imageBuffer.byteLength.toString(),
      'X-Optimized-Size': optimizedBuffer.byteLength.toString(),
      'X-Compression-Ratio': ((1 - optimizedBuffer.byteLength / imageBuffer.byteLength) * 100).toFixed(2) + '%'
    });

    return new NextResponse(new Uint8Array(optimizedBuffer), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}