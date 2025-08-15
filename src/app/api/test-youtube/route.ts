import { NextRequest, NextResponse } from 'next/server';
import { freeSocialScraperService } from '@/lib/services/free-social-scraper.service';
import { newYouTubeScraperService } from '@/lib/services/youtube-scraper-new.service';

// YouTube 스크래핑 테스트용 API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelName, useNew = true } = body;
    
    if (!channelName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Channel name is required' 
      }, { status: 400 });
    }
    
    console.log(`Testing YouTube scraping for: ${channelName} (useNew: ${useNew})`);
    
    let stats;
    let method;
    
    if (useNew) {
      // 새로운 크롤링 방법 사용
      stats = await newYouTubeScraperService.getYouTubeStats(channelName);
      method = 'new';
    } else {
      // 기존 방법 사용
      stats = await freeSocialScraperService.getYouTubeStats(channelName);
      method = 'old';
    }
    
    if (stats) {
      return NextResponse.json({
        success: true,
        stats,
        method,
        message: `Successfully scraped YouTube stats for ${channelName} using ${method} method`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to scrape YouTube stats',
        stats: null,
        method
      });
    }
    
  } catch (error) {
    console.error('YouTube scraping test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: null
    }, { status: 500 });
  }
}