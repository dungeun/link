import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  type: 'BUSINESS' | 'INFLUENCER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: 'BUSINESS' | 'INFLUENCER';
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const router = useRouter();

  // 토큰 관리
  const getAccessToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  const setAccessToken = useCallback((token: string) => {
    localStorage.setItem('accessToken', token);
    // 쿠키에도 토큰 저장 (미들웨어 호환성을 위해)
    document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=lax`;
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    // 쿠키도 제거
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  // 현재 사용자 정보 가져오기
  const getCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data; // handle both { user: {...} } and direct user object
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
        // Sync with localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // 토큰이 유효하지 않음
        clearTokens();
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [getAccessToken, clearTokens]);

  // 로그인
  const login = useCallback(async (data: LoginData) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle both 'token' and 'accessToken' fields for compatibility
        const token = result.accessToken || result.token;
        if (token) {
          setAccessToken(token);
          // Also save to auth-token for compatibility
          localStorage.setItem('auth-token', token);
        }
        // Save user to localStorage
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, [setAccessToken]);

  // 회원가입
  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Handle nested tokens structure from register endpoint
        const token = result.tokens?.accessToken || result.accessToken || result.token;
        if (token) {
          setAccessToken(token);
          // Also save to auth-token for compatibility
          localStorage.setItem('auth-token', token);
        }
        // Save user to localStorage
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, [setAccessToken]);

  // 로그아웃
  const logout = useCallback(async () => {
    const token = getAccessToken();
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearTokens();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/');
  }, [getAccessToken, clearTokens, router]);

  // 초기화
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    getCurrentUser,
  };
}