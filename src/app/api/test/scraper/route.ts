import { NextRequest, NextResponse } from 'next/server';
import { socialScraperLiteService } from '@/lib/services/social-scraper-lite.service';

// 테스트용 API - 실제 크롤링 테스트
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');
    
    if (!platform || !username) {
      return NextResponse.json(
        { error: 'Platform and username are required' },
        { status: 400 }
      );
    }
    
    let result = null;
    
    switch (platform) {
      case 'instagram':
        result = await socialScraperLiteService.getInstagramStats(username);
        break;
      case 'youtube':
        result = await socialScraperLiteService.getYouTubeStats(username);
        break;
      case 'tiktok':
        result = await socialScraperLiteService.getTikTokStats(username);
        break;
      case 'naverBlog':
        result = await socialScraperLiteService.getNaverBlogStats(username);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid platform. Use: instagram, youtube, tiktok, naverBlog' },
          { status: 400 }
        );
    }
    
    if (result) {
      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully scraped ${platform} data for ${username}`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to scrape ${platform} data for ${username}`,
        suggestion: 'Check if the username is correct or try again later'
      });
    }
    
  } catch (error) {
    console.error('Scraper test error:', error);
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        platform: req.nextUrl.searchParams.get('platform'),
        username: req.nextUrl.searchParams.get('username')
      },
      { status: 500 }
    );
  }
}

// 모든 플랫폼 한번에 테스트
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instagram, youtube, tiktok, naverBlog } = body;
    
    const accounts: Record<string, string> = {};
    if (instagram) accounts.instagram = instagram;
    if (youtube) accounts.youtube = youtube;
    if (tiktok) accounts.tiktok = tiktok;
    if (naverBlog) accounts.naverBlog = naverBlog;
    
    if (Object.keys(accounts).length === 0) {
      return NextResponse.json(
        { error: 'At least one platform username is required' },
        { status: 400 }
      );
    }
    
    const results = await socialScraperLiteService.getAllStats(accounts);
    
    // 결과 요약
    const summary = {
      total: 0,
      platforms: [] as Array<{ platform: string; username: string; followers: number; success: boolean }>
    };
    
    for (const [platform, stats] of Object.entries(results)) {
      if (stats) {
        summary.total += stats.followers;
        summary.platforms.push({
          platform,
          username: (stats as { username: string; followers: number }).username,
          followers: (stats as { username: string; followers: number }).followers,
          success: true
        });
      } else {
        summary.platforms.push({
          platform,
          username: accounts[platform],
          followers: 0,
          success: false
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      summary,
      message: `Scraped ${summary.platforms.filter(p => p.success).length} out of ${summary.platforms.length} platforms`
    });
    
  } catch (error) {
    console.error('Batch scraper test error:', error);
    return NextResponse.json(
      { 
        error: 'Batch scraping failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}