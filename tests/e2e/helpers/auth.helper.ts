import { Page } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * 인증 관련 헬퍼 함수들
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * 관리자로 로그인
   */
  async loginAsAdmin() {
    await this.page.goto('/admin/login');
    await this.page.fill('input[name="email"]', testData.admin.email);
    await this.page.fill('input[name="password"]', testData.admin.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/admin/dashboard');
  }

  /**
   * 브랜드로 로그인
   */
  async loginAsBrand() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[name="email"]', testData.brand.email);
    await this.page.fill('input[name="password"]', testData.brand.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  /**
   * 인플루언서로 로그인
   */
  async loginAsInfluencer() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[name="email"]', testData.influencer.email);
    await this.page.fill('input[name="password"]', testData.influencer.password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  /**
   * 회원가입 (브랜드)
   */
  async signupAsBrand() {
    await this.page.goto('/auth/signup');
    await this.page.click('button:has-text("브랜드")');
    
    await this.page.fill('input[name="email"]', testData.brand.email);
    await this.page.fill('input[name="password"]', testData.brand.password);
    await this.page.fill('input[name="confirmPassword"]', testData.brand.password);
    await this.page.fill('input[name="name"]', testData.brand.name);
    await this.page.fill('input[name="company"]', testData.brand.company);
    await this.page.fill('input[name="phone"]', testData.brand.phone);
    
    await this.page.check('input[name="terms"]');
    await this.page.check('input[name="privacy"]');
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/auth/signup/complete');
  }

  /**
   * 회원가입 (인플루언서)
   */
  async signupAsInfluencer() {
    await this.page.goto('/auth/signup');
    await this.page.click('button:has-text("인플루언서")');
    
    await this.page.fill('input[name="email"]', testData.influencer.email);
    await this.page.fill('input[name="password"]', testData.influencer.password);
    await this.page.fill('input[name="confirmPassword"]', testData.influencer.password);
    await this.page.fill('input[name="name"]', testData.influencer.name);
    await this.page.fill('input[name="nickname"]', testData.influencer.nickname);
    
    // SNS 계정 정보
    await this.page.fill('input[name="instagram"]', testData.influencer.instagram);
    await this.page.fill('input[name="youtube"]', testData.influencer.youtube);
    
    await this.page.check('input[name="terms"]');
    await this.page.check('input[name="privacy"]');
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/auth/signup/complete');
  }

  /**
   * 로그아웃
   */
  async logout() {
    await this.page.click('button[aria-label="User menu"]');
    await this.page.click('button:has-text("로그아웃")');
    await this.page.waitForURL('/');
  }

  /**
   * 현재 로그인 상태 확인
   */
  async isLoggedIn(): Promise<boolean> {
    const userMenu = await this.page.locator('button[aria-label="User menu"]').isVisible();
    return userMenu;
  }

  /**
   * 세션 쿠키 저장
   */
  async saveAuthState(path: string) {
    await this.page.context().storageState({ path });
  }
}