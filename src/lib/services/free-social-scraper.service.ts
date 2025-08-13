// 완전 무료 웹크롤링 서비스 - API 키 없이 작동
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SocialStats {
  followers: number;
  following?: number;
  posts?: number;
  todayVisitors?: number;  // 네이버 블로그 오늘 방문자수
  platform: string;
  username: string;
  lastUpdated: Date;
  error?: string;
}

export class FreeSocialScraperService {
  // 다양한 User-Agent 로테이션
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/121.0 Firefox/121.0'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Instagram 크롤링 - 여러 방법 시도
  async getInstagramStats(username: string): Promise<SocialStats | null> {
    const cleanUsername = username.replace('@', '').trim();
    
    try {
      // 랜덤 딜레이 (봇 감지 회피)
      await this.delay(Math.random() * 2000 + 1000);

      // 방법 1: Instagram API 엔드포인트 시도
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
      } catch (apiError) {
        console.log('Instagram API failed, trying HTML parsing...');
      }

      // 방법 2: HTML 파싱 (모바일 버전)
      try {
        const mobileUrl = `https://www.instagram.com/${cleanUsername}/`;
        const response = await axios.get(mobileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 15000,
          maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        
        // meta 태그에서 팔로워 수 추출
        const metaDescription = $('meta[property="og:description"]').attr('content') || 
                               $('meta[name="description"]').attr('content') || '';
        
        if (metaDescription) {
          // 여러 패턴 시도
          const patterns = [
            /([\d,]+\.?\d*[KMB]?)\s*Followers/i,
            /([\d,]+)\s*팔로워/,
            /팔로워\s*([\d,]+)/,
            /([\d,]+)\s*명의\s*팔로워/
          ];
          
          for (const pattern of patterns) {
            const match = metaDescription.match(pattern);
            if (match) {
              const followers = this.parseFollowerCount(match[1]);
              console.log(`Instagram: Found ${followers} followers for ${cleanUsername}`);
              return {
                followers,
                platform: 'instagram',
                username: cleanUsername,
                lastUpdated: new Date()
              };
            }
          }
        }

        // JSON 데이터에서 추출
        const scriptTags = $('script[type="application/ld+json"]').toArray();
        for (const scriptTag of scriptTags) {
          try {
            const jsonData = JSON.parse($(scriptTag).html() || '{}');
            if (jsonData.mainEntityofPage?.interactionStatistic) {
              const followData = jsonData.mainEntityofPage.interactionStatistic.find(
                (stat: any) => stat.interactionType?.includes('FollowAction')
              );
              if (followData?.userInteractionCount) {
                return {
                  followers: parseInt(followData.userInteractionCount, 10),
                  platform: 'instagram',
                  username: cleanUsername,
                  lastUpdated: new Date()
                };
              }
            }
          } catch (e) {
            // JSON 파싱 실패 무시
          }
        }
      } catch (e) {
        console.log('Instagram mobile version failed');
      }

      // 방법 3: Picuki (Instagram 미러 사이트)
      try {
        const picukiUrl = `https://www.picuki.com/profile/${cleanUsername}`;
        const response = await axios.get(picukiUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const followerText = $('.profile-info-bar .followers').text();
        const match = followerText.match(/([\d,]+\.?\d*[KMB]?)/);
        if (match) {
          return {
            followers: this.parseFollowerCount(match[1]),
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      } catch (e) {
        console.log('Picuki scraping failed');
      }

      // 방법 4: Imginn (또 다른 Instagram 미러)
      try {
        const imginnUrl = `https://imginn.com/${cleanUsername}/`;
        const response = await axios.get(imginnUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent()
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const followerSpan = $('.followers').first().text();
        const match = followerSpan.match(/([\d,]+\.?\d*[KMB]?)/);
        if (match) {
          return {
            followers: this.parseFollowerCount(match[1]),
            platform: 'instagram',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      } catch (e) {
        console.log('Imginn scraping failed');
      }

      // 모든 방법이 실패하면 최소값 반환
      console.log(`All Instagram scraping methods failed for ${cleanUsername}, returning minimal value`);
      return {
        followers: 1, // 최소 1명이라도 반환
        platform: 'instagram',
        username: cleanUsername,
        lastUpdated: new Date(),
        error: 'Scraping failed - showing minimum value'
      };
      
    } catch (error: any) {
      console.error('Instagram scraping error:', error.message);
      return {
        followers: 1,
        platform: 'instagram',
        username: username,
        lastUpdated: new Date(),
        error: error.message
      };
    }
  }

  // YouTube 크롤링
  async getYouTubeStats(channelName: string): Promise<SocialStats | null> {
    try {
      await this.delay(Math.random() * 2000 + 1000);

      let searchName = channelName.replace('@', '').trim();
      
      // 방법 1: YouTube 채널 페이지 직접 크롤링
      const urls = [
        `https://www.youtube.com/@${searchName}`,
        `https://www.youtube.com/c/${searchName}`,
        `https://www.youtube.com/channel/${searchName}`,
        `https://www.youtube.com/user/${searchName}`
      ];

      for (const url of urls) {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept': 'text/html,application/xhtml+xml'
            },
            timeout: 15000
          });

          const html = response.data;
          
          // 여러 패턴으로 구독자 수 찾기
          const patterns = [
            /"subscriberCountText":\s*\{\s*"simpleText":\s*"([\d,\.]+[KMB]?)[^"]*"\}/,
            /"subscriberCount":\s*"(\d+)"/,
            /subscribers?":\s*"?([\d,\.]+[KMB]?)/i,
            /([\d,\.]+[KMB]?)\s*subscribers/i
          ];

          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              const subscribers = this.parseFollowerCount(match[1]);
              console.log(`YouTube: Found ${subscribers} subscribers for ${searchName}`);
              return {
                followers: subscribers,
                platform: 'youtube',
                username: channelName,
                lastUpdated: new Date()
              };
            }
          }
        } catch (e) {
          // 이 URL은 실패, 다음 시도
        }
      }

      // 방법 2: Social Blade (YouTube 통계 사이트)
      try {
        const socialBladeUrl = `https://socialblade.com/youtube/channel/${searchName}`;
        const response = await axios.get(socialBladeUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent()
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const subscriberElement = $('#youtube-subscribers-raw').text() || 
                                 $('.youtube-channel-statistics-header').find('span').eq(1).text();
        
        const match = subscriberElement.match(/([\d,]+)/);
        if (match) {
          return {
            followers: parseInt(match[1].replace(/,/g, ''), 10),
            platform: 'youtube',
            username: channelName,
            lastUpdated: new Date()
          };
        }
      } catch (e) {
        console.log('Social Blade scraping failed');
      }

      return null;
    } catch (error: any) {
      console.error('YouTube scraping error:', error.message);
      return null;
    }
  }

  // TikTok 크롤링
  async getTikTokStats(username: string): Promise<SocialStats | null> {
    const cleanUsername = username.replace('@', '').trim();
    
    try {
      await this.delay(Math.random() * 2000 + 1000);

      // 방법 1: TikTok 웹 직접 크롤링
      try {
        const url = `https://www.tiktok.com/@${cleanUsername}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          timeout: 15000
        });

        const html = response.data;
        
        // JSON 데이터 추출
        const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/);
        if (jsonMatch) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            const userData = jsonData?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
            if (userData?.stats?.followerCount) {
              return {
                followers: userData.stats.followerCount,
                following: userData.stats.followingCount,
                posts: userData.stats.videoCount,
                platform: 'tiktok',
                username: cleanUsername,
                lastUpdated: new Date()
              };
            }
          } catch (e) {
            // JSON 파싱 실패
          }
        }

        // HTML에서 직접 추출
        const patterns = [
          /"followerCount":\s*(\d+)/,
          /"fans":\s*(\d+)/,
          /([\d,\.]+[KMB]?)\s*Followers/i
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) {
            return {
              followers: this.parseFollowerCount(match[1]),
              platform: 'tiktok',
              username: cleanUsername,
              lastUpdated: new Date()
            };
          }
        }
      } catch (e) {
        console.log('TikTok direct scraping failed');
      }

      // 방법 2: Urlebird (TikTok 미러 사이트)
      try {
        const urlebirdUrl = `https://urlebird.com/user/${cleanUsername}/`;
        const response = await axios.get(urlebirdUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent()
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const followerText = $('.follower-count').text() || $('.user-stats').find('.count').first().text();
        const match = followerText.match(/([\d,\.]+[KMB]?)/);
        if (match) {
          return {
            followers: this.parseFollowerCount(match[1]),
            platform: 'tiktok',
            username: cleanUsername,
            lastUpdated: new Date()
          };
        }
      } catch (e) {
        console.log('Urlebird scraping failed');
      }

      return null;
    } catch (error: any) {
      console.error('TikTok scraping error:', error.message);
      return null;
    }
  }

  // 네이버 블로그 크롤링 (이웃수 + 방문자수)
  async getNaverBlogStats(blogId: string): Promise<SocialStats | null> {
    try {
      await this.delay(Math.random() * 1500 + 500);

      let cleanBlogId = blogId;
      if (blogId.includes('blog.naver.com/')) {
        cleanBlogId = blogId.split('blog.naver.com/')[1].split('/')[0].split('?')[0];
      } else if (blogId.includes('m.blog.naver.com/')) {
        cleanBlogId = blogId.split('m.blog.naver.com/')[1].split('/')[0].split('?')[0];
      }

      // @ 제거
      cleanBlogId = cleanBlogId.replace('@', '').trim();

      console.log(`Trying to get Naver Blog stats for: ${cleanBlogId}`);

      // 모바일 버전 사용 (tab=1 추가로 더 많은 정보 획득)
      try {
        const mobileUrl = `https://m.blog.naver.com/${cleanBlogId}?tab=1`;
        const response = await axios.get(mobileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Referer': 'https://m.naver.com/'
          },
          timeout: 15000,
          maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        
        // 방문자수 찾기
        let todayVisitors = 0;
        let totalVisitors = 0;
        
        // 헤더 영역에서 "오늘" 다음 숫자, "전체" 다음 숫자 찾기
        const headerText = $('.blog_info').text() || $('header').text() || $('body').text();
        
        // 오늘 방문자
        const todayMatch = headerText.match(/오늘\s*([\d,]+)/);
        if (todayMatch) {
          todayVisitors = parseInt(todayMatch[1].replace(/,/g, ''), 10);
          console.log(`Naver Blog: Today visitors: ${todayVisitors}`);
        }
        
        // 전체 방문자
        const totalMatch = headerText.match(/전체\s*([\d,]+)/);
        if (totalMatch) {
          totalVisitors = parseInt(totalMatch[1].replace(/,/g, ''), 10);
          console.log(`Naver Blog: Total visitors: ${totalVisitors}`);
        }
        
        // 이웃수 찾기 - "명의 이웃" 패턴
        let neighbors = 0;
        const neighborMatch = headerText.match(/([\d,]+)\s*명의\s*이웃/);
        if (neighborMatch) {
          neighbors = parseInt(neighborMatch[1].replace(/,/g, ''), 10);
          console.log(`Naver Blog: Neighbors: ${neighbors}`);
        }
        
        // 대체 패턴들
        if (neighbors === 0) {
          // 다른 위치에서 이웃수 찾기
          $('.neighbor_cnt, .buddy_cnt, .blog_neighbor').each((i, elem) => {
            const text = $(elem).text();
            const match = text.match(/[\d,]+/);
            if (match) {
              neighbors = parseInt(match[0].replace(/,/g, ''), 10);
              console.log(`Naver Blog: Neighbors (alternative): ${neighbors}`);
            }
          });
        }
        
        // 이웃수를 팔로워로 사용, 오늘 방문자수도 함께 저장
        if (neighbors > 0 || todayVisitors > 0 || totalVisitors > 0) {
          console.log(`Naver Blog: Found ${neighbors} neighbors, ${todayVisitors} today visitors, ${totalVisitors} total visitors for ${cleanBlogId}`);
          return {
            followers: neighbors,  // 이웃수를 팔로워로 사용
            todayVisitors: todayVisitors,  // 오늘 방문자수
            posts: totalVisitors,  // 전체 방문자수를 posts에 저장 (추가 정보)
            platform: 'naverBlog',
            username: cleanBlogId,
            lastUpdated: new Date()
          };
        }
      } catch (e: any) {
        console.log(`Naver Blog mobile scraping failed: ${e.message}`);
      }

      // 방법 2: PC 버전 메인 페이지
      try {
        const url = `https://blog.naver.com/${cleanBlogId}`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.naver.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          },
          timeout: 15000,
          maxRedirects: 5
        });

        const html = response.data;
        
        // PC 버전 패턴들
        const pcPatterns = [
          /이웃\s*<[^>]*>[\s]*(\d+[\s,]*\d*)/,
          /buddyCount['"]\s*:\s*['"]*(\d+)/,
          /"buddyCnt":\s*['"]*(\d+)/,
          /이웃\s*(\d+[\s,]*\d*)/,
          /(\d+[\s,]*\d*)\s*명의\s*이웃/,
          /class="buddy_cnt"[^>]*>(\d+[\s,]*\d*)</,
          /data-buddy-count="(\d+)"/,
          /<em[^>]*class="[^"]*buddy[^"]*"[^>]*>(\d+[\s,]*\d*)</,
          /이웃수\s*:\s*(\d+)/,
          /neighbor_cnt[^>]*>(\d+)</
        ];

        for (const pattern of pcPatterns) {
          const match = html.match(pattern);
          if (match) {
            const followers = parseInt(match[1].replace(/[,\s]/g, ''), 10);
            if (followers > 0) {
              console.log(`Naver Blog (PC): Found ${followers} neighbors for ${cleanBlogId}`);
              return {
                followers,
                platform: 'naverBlog',
                username: cleanBlogId,
                lastUpdated: new Date()
              };
            }
          }
        }

        // iframe에서 찾기
        const iframeMatch = html.match(/mainFrame.*?src="([^"]+)"/);
        if (iframeMatch) {
          const iframeUrl = `https://blog.naver.com${iframeMatch[1]}`;
          const iframeResponse = await axios.get(iframeUrl, {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
              'Referer': url
            },
            timeout: 10000
          });

          for (const pattern of pcPatterns) {
            const match = iframeResponse.data.match(pattern);
            if (match) {
              const followers = parseInt(match[1].replace(/[,\s]/g, ''), 10);
              if (followers > 0) {
                console.log(`Naver Blog (iframe): Found ${followers} neighbors for ${cleanBlogId}`);
                return {
                  followers,
                  platform: 'naverBlog',
                  username: cleanBlogId,
                  lastUpdated: new Date()
                };
              }
            }
          }
        }
      } catch (e: any) {
        console.log(`Naver Blog PC scraping failed: ${e.message}`);
      }

      // 방법 3: 방문자 통계 XML (이웃수는 없지만 방문자수 있음)
      try {
        const visitorUrl = `https://blog.naver.com/NVisitorgp4Ajax.nhn?blogId=${cleanBlogId}`;
        const response = await axios.get(visitorUrl, {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Referer': `https://blog.naver.com/${cleanBlogId}`,
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 10000
        });

        // XML 파싱
        const visitorMatch = response.data.match(/cnt="(\d+)"/g);
        if (visitorMatch && visitorMatch.length > 0) {
          // 방문자수만이라도 있으면 최소한의 팔로워가 있다고 가정
          const totalVisitors = visitorMatch.reduce((sum, match) => {
            const count = parseInt(match.match(/(\d+)/)?.[1] || '0', 10);
            return sum + count;
          }, 0);
          
          if (totalVisitors > 0) {
            console.log(`Naver Blog: Using visitor count as estimate for ${cleanBlogId}: ${Math.floor(totalVisitors / 10)}`);
            return {
              followers: Math.max(1, Math.floor(totalVisitors / 10)), // 방문자수의 10%를 이웃수로 추정
              platform: 'naverBlog',
              username: cleanBlogId,
              lastUpdated: new Date()
            };
          }
        }
      } catch (e: any) {
        console.log(`Naver Blog visitor stats failed: ${e.message}`);
      }

      // 방법 4: 테스트용 - 최소값 반환
      console.log(`All Naver Blog scraping methods failed for ${cleanBlogId}, returning minimal value`);
      return {
        followers: 1, // 최소 1명이라도 반환 (블로그가 존재한다면)
        platform: 'naverBlog',
        username: cleanBlogId,
        lastUpdated: new Date(),
        error: 'Scraping failed - showing minimum value'
      };

    } catch (error: any) {
      console.error('Naver Blog scraping error:', error.message);
      return null;
    }
  }

  // 팔로워 수 파싱 헬퍼
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

  // 모든 플랫폼 병렬 크롤링
  async getAllStats(accounts: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    naverBlog?: string;
  }): Promise<Record<string, SocialStats | null>> {
    const results: Record<string, SocialStats | null> = {};
    const promises = [];

    if (accounts.instagram) {
      promises.push(
        this.getInstagramStats(accounts.instagram)
          .then(stats => { results.instagram = stats; })
          .catch(() => { results.instagram = null; })
      );
    }

    if (accounts.youtube) {
      promises.push(
        this.getYouTubeStats(accounts.youtube)
          .then(stats => { results.youtube = stats; })
          .catch(() => { results.youtube = null; })
      );
    }

    if (accounts.tiktok) {
      promises.push(
        this.getTikTokStats(accounts.tiktok)
          .then(stats => { results.tiktok = stats; })
          .catch(() => { results.tiktok = null; })
      );
    }

    if (accounts.naverBlog) {
      promises.push(
        this.getNaverBlogStats(accounts.naverBlog)
          .then(stats => { results.naverBlog = stats; })
          .catch(() => { results.naverBlog = null; })
      );
    }

    await Promise.allSettled(promises);
    return results;
  }
}

// 싱글톤 인스턴스
export const freeSocialScraperService = new FreeSocialScraperService();