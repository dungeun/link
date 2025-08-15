// 새로운 YouTube 구독자 수 크롤링 서비스
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface YouTubeStats {
  followers: number;
  platform: string;
  username: string;
  lastUpdated: Date;
  error?: string;
}

export class YouTubeScraperService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseFollowerCount(str: string): number {
    if (!str) return 0;
    
    // 쉼표 제거
    str = str.replace(/,/g, '');
    
    // K, M, B 처리
    if (str.match(/[Kk]/)) {
      return Math.floor(parseFloat(str.replace(/[Kk]/g, '')) * 1000);
    }
    if (str.match(/[Mm]/)) {
      return Math.floor(parseFloat(str.replace(/[Mm]/g, '')) * 1000000);
    }
    if (str.match(/[Bb]/)) {
      return Math.floor(parseFloat(str.replace(/[Bb]/g, '')) * 1000000000);
    }
    
    // 만, 억 처리 (한국어)
    if (str.includes('만')) {
      return Math.floor(parseFloat(str.replace(/만/g, '')) * 10000);
    }
    if (str.includes('억')) {
      return Math.floor(parseFloat(str.replace(/억/g, '')) * 100000000);
    }
    
    return parseInt(str, 10) || 0;
  }

  async getYouTubeStats(channelName: string): Promise<YouTubeStats | null> {
    try {
      await this.delay(Math.random() * 2000 + 1000);

      let searchName = channelName.replace('@', '').trim();
      console.log(`[NEW] YouTube: Getting stats for ${searchName}`);
      
      // URL 생성
      const urls = [
        `https://www.youtube.com/@${searchName}`,
        `https://www.youtube.com/c/${searchName}`,
        `https://www.youtube.com/channel/${searchName}`,
        `https://www.youtube.com/user/${searchName}`
      ];

      for (const url of urls) {
        try {
          console.log(`[NEW] YouTube: Trying ${url}`);
          const response = await axios.get(url, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept': 'text/html,application/xhtml+xml',
              'Cache-Control': 'no-cache'
            },
            timeout: 15000,
            maxRedirects: 5
          });

          const html = response.data;
          console.log(`[NEW] YouTube: Got response, parsing...`);
          
          // 방법 1: 구독자 수를 정확히 추출하는 로직
          let subscribers = 0;
          
          // subscriberCountText에서 정확한 구독자 수 찾기
          const subscriberRegex = /"subscriberCountText":\s*\{\s*(?:"simpleText":\s*"([^"]+)"|"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)")/g;
          let match;
          
          while ((match = subscriberRegex.exec(html)) !== null) {
            const text = match[1] || match[2];
            console.log(`[NEW] YouTube: Found subscriberCountText: "${text}"`);
            
            if (text && text.toLowerCase().includes('subscriber')) {
              // "4.66M subscribers" 또는 "466만 subscribers" 같은 형식에서 숫자 추출
              const numberMatch = text.match(/^([\d,\.]+[KMB만억]?)/);
              if (numberMatch) {
                subscribers = this.parseFollowerCount(numberMatch[1]);
                console.log(`[NEW] YouTube: Extracted subscribers: ${subscribers} from "${text}"`);
                break;
              }
            }
          }
          
          // 방법 2: 직접적인 구독자 수 필드
          if (subscribers === 0) {
            const directPatterns = [
              /"subscriberCount":"(\d+)"/,
              /"subscribers_count":"(\d+)"/
            ];
            
            for (const pattern of directPatterns) {
              const directMatch = html.match(pattern);
              if (directMatch) {
                subscribers = parseInt(directMatch[1], 10);
                console.log(`[NEW] YouTube: Found direct subscriber count: ${subscribers}`);
                break;
              }
            }
          }
          
          // 방법 3: 한국어 패턴
          if (subscribers === 0) {
            const koreanPatterns = [
              /구독자\s*([\d,]+)/,
              /([\d,]+)\s*명의?\s*구독자/,
              /([\d,]+)\s*구독자/
            ];
            
            for (const pattern of koreanPatterns) {
              const koreanMatch = html.match(pattern);
              if (koreanMatch) {
                subscribers = this.parseFollowerCount(koreanMatch[1]);
                console.log(`[NEW] YouTube: Found Korean subscriber count: ${subscribers}`);
                break;
              }
            }
          }
          
          // 방법 4: 모든 subscriber 관련 숫자 패턴
          if (subscribers === 0) {
            const allNumberPatterns = [
              /([\d,\.]+[KMB만억]?)\s*[^0-9]*subscribers?/gi,
              /(\d{1,7})\s*[^0-9]*subscribers?/gi
            ];
            
            for (const pattern of allNumberPatterns) {
              const matches = html.match(pattern);
              if (matches) {
                for (const match of matches) {
                  const numberMatch = match.match(/([\d,\.]+[KMB만억]?)/);
                  if (numberMatch) {
                    const number = this.parseFollowerCount(numberMatch[1]);
                    if (number > 0) {
                      subscribers = number;
                      console.log(`[NEW] YouTube: Found subscribers with pattern: ${subscribers} from "${match}"`);
                      break;
                    }
                  }
                }
                if (subscribers > 0) break;
              }
            }
          }
          
          if (subscribers > 0) {
            console.log(`[NEW] YouTube: SUCCESS - Found ${subscribers} subscribers for ${searchName}`);
            return {
              followers: subscribers,
              platform: 'youtube',
              username: channelName,
              lastUpdated: new Date()
            };
          }
          
        } catch (e) {
          console.log(`[NEW] YouTube: Failed ${url}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // 모든 방법 실패시
      console.log(`[NEW] YouTube: All methods failed for ${searchName}`);
      return {
        followers: 1,
        platform: 'youtube',
        username: channelName,
        lastUpdated: new Date(),
        error: 'Scraping failed - showing minimum value'
      };

    } catch (error) {
      console.error('[NEW] YouTube scraping error:', error instanceof Error ? error.message : 'Unknown error');
      return {
        followers: 1,
        platform: 'youtube',
        username: channelName,
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const newYouTubeScraperService = new YouTubeScraperService();