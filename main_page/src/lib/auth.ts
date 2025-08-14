// 이 파일은 더 이상 사용되지 않습니다.
// 실제 인증은 /hooks/useAuth.ts를 사용하세요.
export interface User {
  id: string;
  email: string;
  name: string;
  type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
}

// Deprecated: useAuth 훅을 사용하세요
export const AuthService = {
  login: () => {
    console.warn('AuthService.login is deprecated. Use useAuth hook instead.');
  },
  logout: () => {
    console.warn('AuthService.logout is deprecated. Use useAuth hook instead.');
  },
  getCurrentUser: (): User | null => {
    console.warn('AuthService.getCurrentUser is deprecated. Use useAuth hook instead.');
    return null;
  },
  isLoggedIn: (): boolean => {
    console.warn('AuthService.isLoggedIn is deprecated. Use useAuth hook instead.');
    return false;
  }
};