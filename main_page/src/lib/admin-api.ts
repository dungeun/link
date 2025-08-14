/**
 * 관리자 페이지 전용 API 클라이언트
 * Authorization 헤더가 자동으로 포함되는 fetch 래퍼
 */

// 토큰 가져오기 함수
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // localStorage에서 먼저 확인
  let token = localStorage.getItem('accessToken') || localStorage.getItem('auth-token');
  
  // localStorage에 없으면 쿠키에서 확인
  if (!token) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken' || name === 'auth-token') {
        token = value;
        break;
      }
    }
  }
  
  return token || null;
}

// 관리자 API 요청을 위한 fetch 래퍼
export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  console.log('[adminFetch] Token found:', !!token);
  if (token) {
    console.log('[adminFetch] Token prefix:', token.substring(0, 20) + '...');
  }
  
  const headers = new Headers(options.headers);
  
  // Content-Type 기본값 설정
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Authorization 헤더 추가
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 쿠키도 함께 전송
  });
}

// 편의 메서드들
export const adminApi = {
  get: (url: string, options?: RequestInit) => 
    adminFetch(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options?: RequestInit) => 
    adminFetch(url, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  put: (url: string, data?: any, options?: RequestInit) => 
    adminFetch(url, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  
  delete: (url: string, options?: RequestInit) => 
    adminFetch(url, { ...options, method: 'DELETE' }),
  
  patch: (url: string, data?: any, options?: RequestInit) => 
    adminFetch(url, { 
      ...options, 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
};