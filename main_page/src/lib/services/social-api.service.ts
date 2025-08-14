// 다양한 소셜 미디어 API를 활용한 서비스
import axios from 'axios';

export interface SocialApiStats {
  followers: number;
  following?: number;
  posts?: number;
  platform: string;
  username: string;
  lastUpdated: Date;
  source: 'api' | 'scrape' | 'cache';
}

export class SocialApiService {
  private cache: Map<string, { data: SocialApiStats; timestamp: number }> = new Map();
  private cacheTimeout = 3600000; // 1시간

  // Instagram - 여러 방법 시도
  async getInstagramStats(username: string): Promise<SocialApiStats | null> {
    const cleanUsername = username.replace('@', '').trim();
    const cacheKey = `instagram:${cleanUsername}`;

    // 캐시 확인
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 방법 1: RapidAPI Instagram Scraper (무료 티어 있음)
      try {
        const rapidApiResponse = await axios.get(
          `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${cleanUsername}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
              'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        if (rapidApiResponse.data && rapidApiResponse.data.data) {
          const userData = rapidApiResponse.data.data;
          const result: SocialApiStats = {
            followers: userData.follower_count || 0,
            following: userData.following_count,
            posts: userData.media_count,
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (rapidError) {
        console.log('RapidAPI failed, trying alternative methods...');
      }

      // 방법 2: Proxycurl Social Media API (LinkedIn 중심이지만 Instagram도 지원)
      try {
        const proxycurlResponse = await axios.get(
          `https://nubela.co/proxycurl/api/instagram/profile?username=${cleanUsername}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY || ''}`
            },
            timeout: 10000
          }
        );

        if (proxycurlResponse.data) {
          const result: SocialApiStats = {
            followers: proxycurlResponse.data.followers_count || 0,
            following: proxycurlResponse.data.following_count,
            posts: proxycurlResponse.data.posts_count,
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (proxycurlError) {
        console.log('Proxycurl failed, trying alternative methods...');
      }

      // 방법 3: SocialBlade 스타일 스크래핑 (공개 데이터)
      try {
        const socialBladeUrl = `https://socialblade.com/instagram/user/${cleanUsername}`;
        const response = await axios.get(socialBladeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const match = response.data.match(/Followers<\/span>[\s\S]*?>([\d,]+)</);
        if (match) {
          const result: SocialApiStats = {
            followers: parseInt(match[1].replace(/,/g, ''), 10),
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date(),
            source: 'scrape'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (socialBladeError) {
        console.log('SocialBlade scraping failed');
      }

      return null;
    } catch (error) {
      console.error('Instagram stats error:', error);
      return null;
    }
  }

  // YouTube - YouTube Data API v3 또는 대안
  async getYouTubeStats(channelName: string): Promise<SocialApiStats | null> {
    const cacheKey = `youtube:${channelName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 방법 1: Social Counts API (무료)
      try {
        const socialCountsUrl = `https://api.socialcounts.org/youtube-live-subscriber-count/${channelName}`;
        const response = await axios.get(socialCountsUrl, {
          timeout: 10000
        });

        if (response.data && response.data.est_sub) {
          const result: SocialApiStats = {
            followers: response.data.est_sub,
            platform: 'youtube',
            username: channelName,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (socialCountsError) {
        console.log('Social Counts API failed');
      }

      // 방법 2: RapidAPI YouTube Scraper
      try {
        const rapidApiResponse = await axios.get(
          `https://youtube-scraper5.p.rapidapi.com/channel?url=https://www.youtube.com/@${channelName}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
              'X-RapidAPI-Host': 'youtube-scraper5.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        if (rapidApiResponse.data) {
          const result: SocialApiStats = {
            followers: rapidApiResponse.data.subscriberCount || 0,
            posts: rapidApiResponse.data.videoCount,
            platform: 'youtube',
            username: channelName,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (rapidError) {
        console.log('RapidAPI YouTube failed');
      }

      return null;
    } catch (error) {
      console.error('YouTube stats error:', error);
      return null;
    }
  }

  // TikTok - 여러 방법 시도
  async getTikTokStats(username: string): Promise<SocialApiStats | null> {
    const cleanUsername = username.replace('@', '').trim();
    const cacheKey = `tiktok:${cleanUsername}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 방법 1: RapidAPI TikTok Scraper
      try {
        const rapidApiResponse = await axios.get(
          `https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${cleanUsername}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'demo-key',
              'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        if (rapidApiResponse.data && rapidApiResponse.data.data) {
          const userData = rapidApiResponse.data.data;
          const result: SocialApiStats = {
            followers: userData.stats?.followerCount || 0,
            following: userData.stats?.followingCount,
            posts: userData.stats?.videoCount,
            platform: 'tiktok',
            username: cleanUsername,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (rapidError) {
        console.log('RapidAPI TikTok failed');
      }

      // 방법 2: TikTok 공개 API (제한적)
      try {
        const tikApiResponse = await axios.get(
          `https://www.tiktok.com/api/user/detail/?uniqueId=${cleanUsername}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
            },
            timeout: 10000
          }
        );

        if (tikApiResponse.data && tikApiResponse.data.userInfo) {
          const userData = tikApiResponse.data.userInfo;
          const result: SocialApiStats = {
            followers: userData.stats?.followerCount || 0,
            following: userData.stats?.followingCount,
            posts: userData.stats?.videoCount,
            platform: 'tiktok',
            username: cleanUsername,
            lastUpdated: new Date(),
            source: 'api'
          };
          this.saveToCache(cacheKey, result);
          return result;
        }
      } catch (tikApiError) {
        console.log('TikTok API failed');
      }

      return null;
    } catch (error) {
      console.error('TikTok stats error:', error);
      return null;
    }
  }

  // 네이버 블로그
  async getNaverBlogStats(blogId: string): Promise<SocialApiStats | null> {
    const cacheKey = `naver:${blogId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 네이버 블로그 API (공개)
      const apiUrl = `https://blog.naver.com/api/blogs/${blogId}`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Referer': 'https://blog.naver.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (response.data) {
        const result: SocialApiStats = {
          followers: response.data.subscriberCount || response.data.buddyCount || 0,
          posts: response.data.postCount,
          platform: 'naverBlog',
          username: blogId,
          lastUpdated: new Date(),
          source: 'api'
        };
        this.saveToCache(cacheKey, result);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Naver Blog stats error:', error);
      return null;
    }
  }

  // 캐시 관리
  private getFromCache(key: string): SocialApiStats | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Returning cached data for ${key}`);
      return { ...cached.data, source: 'cache' };
    }
    return null;
  }

  private saveToCache(key: string, data: SocialApiStats): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
export const socialApiService = new SocialApiService();