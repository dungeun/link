// 더 가벼운 버전 - axios와 cheerio를 사용한 HTML 파싱
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SocialStats {
  followers: number;
  following?: number;
  posts?: number;
  platform: string;
  username: string;
  lastUpdated: Date;
  error?: string;
  errorCode?: 'USER_NOT_FOUND' | 'AUTH_REQUIRED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'PARSE_ERROR';
}

export class SocialScraperLiteService {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  // Instagram 팔로워 수 가져오기 (web_profile_info API 사용)
  async getInstagramStats(username: string): Promise<SocialStats | null> {
    try {
      const cleanUsername = username.replace('@', '').trim();
      
      // 1. 먼저 새로운 web_profile_info 엔드포인트 시도
      try {
        const apiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`;
        const apiResponse = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Instagram 76.0.0.15.395 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 138226743)',
            'Origin': 'https://www.instagram.com',
            'Referer': 'https://www.instagram.com/',
            'Accept': 'application/json',
            'X-IG-App-ID': '936619743392459'
          },
          timeout: 10000
        });

        if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.user) {
          const userData = apiResponse.data.data.user;
          const followerCount = userData.edge_followed_by?.count || 0;
          
          console.log(`Instagram API success for ${cleanUsername}: ${followerCount} followers`);
          return {
            followers: followerCount,
            following: userData.edge_follow?.count,
            posts: userData.edge_owner_to_timeline_media?.count,
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      } catch (apiError: any) {
        console.log(`Instagram API failed for ${cleanUsername}, trying HTML parsing...`);
      }

      // 2. API 실패시 HTML 파싱 시도
      const url = `https://www.instagram.com/${cleanUsername}/`;
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
        },
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 404) {
        return {
          followers: -1,
          platform: 'instagram',
          username: cleanUsername,
          lastUpdated: new Date(),
          errorCode: 'USER_NOT_FOUND'
        };
      }

      const html = response.data;
      
      // meta 태그에서 추출
      const $ = cheerio.load(html);
      const metaContent = $('meta[property="og:description"]').attr('content');
      if (metaContent) {
        // "12.3K Followers, 456 Following, 789 Posts" 형식 파싱
        const match = metaContent.match(/([\d,.]+[KMB]?)\s*Followers/i);
        if (match) {
          return {
            followers: this.parseNumber(match[1]),
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      }

      // 다른 패턴 시도
      const followersMatch = html.match(/"edge_followed_by":\{"count":(\d+)\}/);
      if (followersMatch) {
        return {
          followers: parseInt(followersMatch[1], 10),
          platform: 'instagram',
          username: cleanUsername,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error: any) {
      console.error('Instagram scraping error:', error.message);
      if (error.code === 'ECONNABORTED') {
        return {
          followers: -3,
          platform: 'instagram',
          username: username,
          lastUpdated: new Date(),
          errorCode: 'TIMEOUT'
        };
      }
      return null;
    }
  }

  // YouTube 구독자 수 가져오기
  async getYouTubeStats(channelName: string): Promise<SocialStats | null> {
    try {
      let url = '';
      if (channelName.startsWith('@')) {
        url = `https://www.youtube.com/${channelName}`;
      } else if (channelName.includes('youtube.com')) {
        url = channelName;
      } else {
        url = `https://www.youtube.com/@${channelName}`;
      }

      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 10000
      });

      const html = response.data;
      
      // 구독자 수 추출 - 여러 패턴 시도
      const patterns = [
        /"subscriberCountText":\{"simpleText":"([\d,.]+[KMB]?)[^"]*"\}/,
        /"subscriberCount":"(\d+)"/,
        /"subscriber_count":"(\d+)"/,
        /subscribers?":\s*"?([\d,.]+[KMB]?)/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return {
            followers: this.parseNumber(match[1]),
            platform: 'youtube',
            username: channelName,
            lastUpdated: new Date()
          };
        }
      }

      // meta 태그에서 추출
      const $ = cheerio.load(html);
      const interactionCount = $('meta[itemprop="interactionCount"]').attr('content');
      if (interactionCount) {
        return {
          followers: parseInt(interactionCount, 10),
          platform: 'youtube',
          username: channelName,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error: any) {
      console.error('YouTube scraping error:', error.message);
      return null;
    }
  }

  // TikTok 팔로워 수 가져오기
  async getTikTokStats(username: string): Promise<SocialStats | null> {
    try {
      const cleanUsername = username.replace('@', '').trim();
      const url = `https://www.tiktok.com/@${cleanUsername}`;
      
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
        },
        timeout: 10000
      });

      const html = response.data;
      
      // JSON 데이터에서 추출
      const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData && jsonData.__DEFAULT_SCOPE__) {
            const userData = jsonData.__DEFAULT_SCOPE__['webapp.user-detail'];
            if (userData && userData.userInfo && userData.userInfo.stats) {
              return {
                followers: userData.userInfo.stats.followerCount || 0,
                following: userData.userInfo.stats.followingCount || 0,
                posts: userData.userInfo.stats.videoCount || 0,
                platform: 'tiktok',
                username: cleanUsername,
                lastUpdated: new Date()
              };
            }
          }
        } catch (e) {
          console.error('TikTok JSON parsing error:', e);
        }
      }

      // 다른 패턴으로 시도
      const patterns = [
        /"followerCount":(\d+)/,
        /"fans":(\d+)/,
        /(\d+)\s*Followers/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return {
            followers: parseInt(match[1], 10),
            platform: 'tiktok',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      }

      return null;
    } catch (error: any) {
      console.error('TikTok scraping error:', error.message);
      return null;
    }
  }

  // 네이버 블로그 이웃 수 가져오기
  async getNaverBlogStats(blogId: string): Promise<SocialStats | null> {
    try {
      let cleanBlogId = blogId;
      if (blogId.includes('blog.naver.com/')) {
        cleanBlogId = blogId.split('blog.naver.com/')[1].split('/')[0].split('?')[0];
      }
      
      const url = `https://blog.naver.com/${cleanBlogId}`;
      
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'Referer': 'https://www.naver.com/'
        },
        timeout: 10000
      });

      const html = response.data;
      
      // 이웃 수 추출 패턴들
      const patterns = [
        /이웃\s*<[^>]*>(\d+)</,
        /buddyCount['"]\s*:\s*(\d+)/,
        /"buddyCnt":(\d+)/,
        /이웃\s*(\d+)/
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return {
            followers: parseInt(match[1], 10),
            platform: 'naverBlog',
            username: cleanBlogId,
            lastUpdated: new Date()
          };
        }
      }

      // iframe src에서 blogId 추출 후 API 호출 시도
      const iframeMatch = html.match(/mainFrame.*?src="([^"]+)"/);
      if (iframeMatch) {
        const iframeUrl = `https://blog.naver.com${iframeMatch[1]}`;
        const iframeResponse = await axios.get(iframeUrl, {
          headers: this.headers,
          timeout: 10000
        });
        
        const iframeHtml = iframeResponse.data;
        for (const pattern of patterns) {
          const match = iframeHtml.match(pattern);
          if (match) {
            return {
              followers: parseInt(match[1], 10),
              platform: 'naverBlog',
              username: cleanBlogId,
              lastUpdated: new Date()
            };
          }
        }
      }

      return null;
    } catch (error: any) {
      console.error('Naver Blog scraping error:', error.message);
      return null;
    }
  }

  // 숫자 파싱 유틸리티
  private parseNumber(str: string): number {
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

  // 모든 플랫폼 한번에 가져오기
  async getAllStats(accounts: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    naverBlog?: string;
  }): Promise<Record<string, SocialStats | null>> {
    const results: Record<string, SocialStats | null> = {};
    
    // 병렬로 실행
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
    
    return results;
  }
}

// 싱글톤 인스턴스
export const socialScraperLiteService = new SocialScraperLiteService();