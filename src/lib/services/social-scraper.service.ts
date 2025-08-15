import puppeteer from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth 플러그인을 사용해서 봇 감지 회피
puppeteerExtra.use(StealthPlugin());

interface SocialStats {
  followers: number;
  following?: number;
  posts?: number;
  platform: string;
  username: string;
  lastUpdated: Date;
}

export class SocialScraperService {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteerExtra.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-extensions'
        ]
      });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Instagram 팔로워 수 크롤링
  async getInstagramStats(username: string): Promise<SocialStats | null> {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      
      // 모바일 User-Agent 사용 (Instagram 모바일 버전이 더 간단함)
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
      
      const url = `https://www.instagram.com/${username}/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 팔로워 수 추출
      const stats = await page.evaluate(() => {
        // meta 태그에서 팔로워 수 추출 (더 안정적)
        const metaTag = document.querySelector('meta[property="og:description"]');
        if (metaTag) {
          const content = metaTag.getAttribute('content');
          if (content) {
            // "12.3K Followers, 456 Following, 789 Posts" 형식 파싱
            const match = content.match(/([\d,.]+[KMB]?)\s*Followers/i);
            if (match) {
              return match[1];
            }
          }
        }
        
        // 대체 방법: 페이지에서 직접 찾기
        const followerElements = Array.from(document.querySelectorAll('span'));
        for (const el of followerElements) {
          if (el.textContent && el.textContent.includes('followers')) {
            const parent = el.parentElement;
            if (parent) {
              const numberEl = parent.querySelector('span');
              if (numberEl && numberEl.textContent) {
                return numberEl.textContent;
              }
            }
          }
        }
        
        return null;
      });

      await page.close();

      if (stats) {
        return {
          followers: this.parseNumber(stats),
          platform: 'instagram',
          username,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Instagram scraping error:', error);
      return null;
    }
  }

  // YouTube 구독자 수 크롤링
  async getYouTubeStats(channelName: string): Promise<SocialStats | null> {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      
      // YouTube는 @username 또는 channel URL 형식 지원
      let url = '';
      if (channelName.startsWith('@')) {
        url = `https://www.youtube.com/${channelName}`;
      } else if (channelName.includes('youtube.com')) {
        url = channelName;
      } else {
        url = `https://www.youtube.com/@${channelName}`;
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 구독자 수 추출
      const stats = await page.evaluate(() => {
        // 구독자 수 찾기
        const subscriberElements = document.querySelectorAll('#subscriber-count');
        if (subscriberElements.length > 0) {
          const text = subscriberElements[0].textContent;
          if (text) {
            // "1.23M subscribers" 형식에서 숫자 추출
            const match = text.match(/([\d,.]+[KMB]?)/);
            if (match) {
              return match[1];
            }
          }
        }

        // 대체 방법
        const metaTag = document.querySelector('meta[itemprop="interactionCount"]');
        if (metaTag) {
          const content = metaTag.getAttribute('content');
          if (content) {
            return content;
          }
        }

        return null;
      });

      await page.close();

      if (stats) {
        return {
          followers: this.parseNumber(stats),
          platform: 'youtube',
          username: channelName,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('YouTube scraping error:', error);
      return null;
    }
  }

  // TikTok 팔로워 수 크롤링
  async getTikTokStats(username: string): Promise<SocialStats | null> {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      
      // TikTok 모바일 User-Agent
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
      
      const cleanUsername = username.replace('@', '');
      const url = `https://www.tiktok.com/@${cleanUsername}`;
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // TikTok 팔로워 수 추출
      const stats = await page.evaluate(() => {
        // 팔로워 수 찾기
        const followerElements = document.querySelectorAll('[data-e2e="followers-count"]');
        if (followerElements.length > 0) {
          return followerElements[0].textContent;
        }

        // 대체 방법: strong 태그에서 찾기
        const strongElements = Array.from(document.querySelectorAll('strong'));
        for (const el of strongElements) {
          const nextSibling = el.nextSibling;
          if (nextSibling && nextSibling.textContent && nextSibling.textContent.includes('Followers')) {
            return el.textContent;
          }
        }

        return null;
      });

      await page.close();

      if (stats) {
        return {
          followers: this.parseNumber(stats),
          platform: 'tiktok',
          username: cleanUsername,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('TikTok scraping error:', error);
      return null;
    }
  }

  // 네이버 블로그 이웃 수 크롤링
  async getNaverBlogStats(blogId: string): Promise<SocialStats | null> {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      
      // 네이버 블로그 URL
      let url = '';
      if (blogId.includes('blog.naver.com')) {
        url = blogId;
      } else {
        url = `https://blog.naver.com/${blogId}`;
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // iframe으로 로드되는 경우 대응
      await page.waitForTimeout(2000);

      // 이웃 수 추출
      const stats = await page.evaluate(() => {
        // 이웃 수 찾기
        const buddyElements = document.querySelectorAll('.buddy_cnt');
        if (buddyElements.length > 0) {
          const text = buddyElements[0].textContent;
          if (text) {
            const match = text.match(/(\d+)/);
            if (match) {
              return match[1];
            }
          }
        }

        // 대체 방법: 이웃 링크에서 찾기
        const buddyLinks = Array.from(document.querySelectorAll('a'));
        for (const link of buddyLinks) {
          if (link.textContent && link.textContent.includes('이웃')) {
            const match = link.textContent.match(/(\d+)/);
            if (match) {
              return match[1];
            }
          }
        }

        return null;
      });

      await page.close();

      if (stats) {
        return {
          followers: parseInt(stats, 10),
          platform: 'naverBlog',
          username: blogId,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Naver Blog scraping error:', error);
      return null;
    }
  }

  // 숫자 파싱 유틸리티 (1.2K, 3.4M 등을 실제 숫자로 변환)
  private parseNumber(str: string): number {
    if (!str) return 0;
    
    // 쉼표 제거
    str = str.replace(/,/g, '');
    
    // K, M, B 처리
    if (str.includes('K') || str.includes('k')) {
      return parseFloat(str.replace(/[Kk]/g, '')) * 1000;
    }
    if (str.includes('M') || str.includes('m')) {
      return parseFloat(str.replace(/[Mm]/g, '')) * 1000000;
    }
    if (str.includes('B') || str.includes('b')) {
      return parseFloat(str.replace(/[Bb]/g, '')) * 1000000000;
    }
    
    // 만, 억 처리 (한국어)
    if (str.includes('만')) {
      return parseFloat(str.replace(/만/g, '')) * 10000;
    }
    if (str.includes('억')) {
      return parseFloat(str.replace(/억/g, '')) * 100000000;
    }
    
    return parseInt(str, 10) || 0;
  }

  // 모든 플랫폼 한번에 크롤링
  async getAllStats(accounts: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    naverBlog?: string;
  }): Promise<Record<string, SocialStats | null>> {
    const results: Record<string, SocialStats | null> = {};
    
    try {
      await this.initialize();
      
      // 병렬로 크롤링 실행
      const promises = [];
      
      if (accounts.instagram) {
        promises.push(
          this.getInstagramStats(accounts.instagram)
            .then(stats => { results.instagram = stats; })
            .catch(err => { 
              console.error('Instagram error:', err); 
              results.instagram = null; 
            })
        );
      }
      
      if (accounts.youtube) {
        promises.push(
          this.getYouTubeStats(accounts.youtube)
            .then(stats => { results.youtube = stats; })
            .catch(err => { 
              console.error('YouTube error:', err); 
              results.youtube = null; 
            })
        );
      }
      
      if (accounts.tiktok) {
        promises.push(
          this.getTikTokStats(accounts.tiktok)
            .then(stats => { results.tiktok = stats; })
            .catch(err => { 
              console.error('TikTok error:', err); 
              results.tiktok = null; 
            })
        );
      }
      
      if (accounts.naverBlog) {
        promises.push(
          this.getNaverBlogStats(accounts.naverBlog)
            .then(stats => { results.naverBlog = stats; })
            .catch(err => { 
              console.error('Naver Blog error:', err); 
              results.naverBlog = null; 
            })
        );
      }
      
      await Promise.allSettled(promises);
      
    } finally {
      await this.cleanup();
    }
    
    return results;
  }
}

// 싱글톤 인스턴스
export const socialScraperService = new SocialScraperService();