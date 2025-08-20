import { Page, Locator, expect } from '@playwright/test';

/**
 * 🎯 캠페인 목록 페이지 Page Object Model
 * 
 * 캠페인 목록 페이지의 모든 요소와 액션을 캡슐화하여
 * 테스트 코드의 재사용성과 유지보수성을 향상시킵니다.
 */
export class CampaignListPage {
  readonly page: Page;
  
  // 주요 요소 로케이터들
  readonly campaignCards: Locator;
  readonly platformFilter: Locator;
  readonly categoryFilter: Locator;
  readonly searchInput: Locator;
  readonly loadingSpinner: Locator;
  readonly pagination: Locator;
  readonly filterSection: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 캠페인 카드들
    this.campaignCards = page.locator('.campaign-card, [data-testid="campaign-card"], .grid > div').filter({
      has: page.locator('h2, h3, .title, .campaign-title')
    });
    
    // 필터 요소들
    this.platformFilter = page.locator('select[name*="platform"], .platform-filter, [data-testid="platform-filter"]');
    this.categoryFilter = page.locator('select[name*="category"], .category-filter, [data-testid="category-filter"]');
    this.searchInput = page.locator('input[placeholder*="검색"], input[name="search"], .search-input');
    
    // UI 상태 요소들
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.pagination = page.locator('.pagination, .page-nav, [data-testid="pagination"]');
    this.filterSection = page.locator('.filter-section, .filters, [data-testid="filters"]');
    this.sortDropdown = page.locator('select[name*="sort"], .sort-dropdown, [data-testid="sort-dropdown"]');
  }

  /**
   * 캠페인 목록 페이지로 이동
   */
  async goto() {
    console.log('🎯 캠페인 목록 페이지로 이동 중...');
    await this.page.goto('/campaigns');
    await this.waitForPageLoad();
  }

  /**
   * 페이지 로드 완료 대기
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    
    // 로딩 스피너가 사라질 때까지 대기
    if (await this.loadingSpinner.count() > 0) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    console.log('✅ 캠페인 목록 페이지 로드 완료');
  }

  /**
   * 캠페인 카드 수 반환
   */
  async getCampaignCount(): Promise<number> {
    const count = await this.campaignCards.count();
    console.log(`📊 캠페인 카드 수: ${count}개`);
    return count;
  }

  /**
   * 특정 인덱스의 캠페인 카드 반환
   */
  getCampaignCard(index: number): Locator {
    return this.campaignCards.nth(index);
  }

  /**
   * 첫 번째 캠페인 카드 반환
   */
  getFirstCampaign(): Locator {
    return this.campaignCards.first();
  }

  /**
   * 캠페인 제목으로 특정 캠페인 찾기
   */
  getCampaignByTitle(title: string): Locator {
    return this.campaignCards.filter({
      has: this.page.locator('h2, h3, .title, .campaign-title').filter({ hasText: title })
    });
  }

  /**
   * 플랫폼으로 필터링
   */
  async filterByPlatform(platform: string) {
    console.log(`🔍 플랫폼 필터링: ${platform}`);
    
    if (await this.platformFilter.count() > 0) {
      await this.platformFilter.selectOption({ label: platform });
      await this.waitForFilterUpdate();
    } else {
      // 버튼 형태의 필터 확인
      const platformButton = this.page.locator(`button[data-platform="${platform}"], .platform-button:has(text("${platform}"))`);
      if (await platformButton.count() > 0) {
        await platformButton.click();
        await this.waitForFilterUpdate();
      }
    }
  }

  /**
   * 카테고리로 필터링
   */
  async filterByCategory(category: string) {
    console.log(`🔍 카테고리 필터링: ${category}`);
    
    if (await this.categoryFilter.count() > 0) {
      await this.categoryFilter.selectOption({ label: category });
      await this.waitForFilterUpdate();
    }
  }

  /**
   * 검색어로 필터링
   */
  async searchCampaigns(searchTerm: string) {
    console.log(`🔍 캠페인 검색: ${searchTerm}`);
    
    if (await this.searchInput.count() > 0) {
      await this.searchInput.fill(searchTerm);
      await this.searchInput.press('Enter');
      await this.waitForFilterUpdate();
    }
  }

  /**
   * 정렬 옵션 변경
   */
  async sortBy(sortOption: string) {
    console.log(`📊 정렬 변경: ${sortOption}`);
    
    if (await this.sortDropdown.count() > 0) {
      await this.sortDropdown.selectOption({ label: sortOption });
      await this.waitForFilterUpdate();
    }
  }

  /**
   * 필터 업데이트 대기
   */
  async waitForFilterUpdate() {
    // 로딩 표시 대기
    await this.page.waitForTimeout(500);
    
    // 로딩 스피너가 나타났다가 사라지는 것을 대기
    if (await this.loadingSpinner.count() > 0) {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    }
    
    // 네트워크 안정화 대기
    await this.page.waitForLoadState('networkidle');
    console.log('✅ 필터 업데이트 완료');
  }

  /**
   * 캠페인 카드에서 정보 추출
   */
  async getCampaignInfo(campaignCard: Locator) {
    const title = await campaignCard.locator('h2, h3, .title, .campaign-title').first().textContent();
    const description = await campaignCard.locator('.description, .summary, .content').first().textContent();
    const platforms = await campaignCard.locator('.platform-tag, .platform-label, .platform-badge').allTextContents();
    const budget = await campaignCard.locator('.budget, .price, .amount').first().textContent();
    const status = await campaignCard.locator('.status, .badge').first().textContent();
    
    return {
      title: title?.trim(),
      description: description?.trim(),
      platforms: platforms.map(p => p.trim()).filter(Boolean),
      budget: budget?.trim(),
      status: status?.trim()
    };
  }

  /**
   * 특정 캠페인의 지원 버튼 찾기
   */
  getApplyButton(campaignCard: Locator): Locator {
    return campaignCard.locator('text=지원하기, text=Apply, button[data-action="apply"], .apply-button');
  }

  /**
   * 캠페인 상세 페이지로 이동
   */
  async goToCampaignDetail(campaignCard: Locator) {
    console.log('📄 캠페인 상세 페이지로 이동...');
    
    // 캠페인 제목이나 이미지 클릭
    const titleLink = campaignCard.locator('h2 a, h3 a, .title a, a');
    if (await titleLink.count() > 0) {
      await titleLink.first().click();
    } else {
      await campaignCard.click();
    }
    
    await this.page.waitForLoadState('networkidle');
    console.log('✅ 캠페인 상세 페이지 이동 완료');
  }

  /**
   * 페이지네이션으로 다음 페이지 이동
   */
  async goToNextPage() {
    console.log('📄 다음 페이지로 이동...');
    
    const nextButton = this.pagination.locator('button:has(text("다음")), .next, [aria-label="다음"]');
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await this.waitForFilterUpdate();
      return true;
    }
    
    console.log('⚠️ 다음 페이지 버튼이 없거나 비활성화됨');
    return false;
  }

  /**
   * 페이지네이션으로 이전 페이지 이동
   */
  async goToPreviousPage() {
    console.log('📄 이전 페이지로 이동...');
    
    const prevButton = this.pagination.locator('button:has(text("이전")), .prev, [aria-label="이전"]');
    if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
      await prevButton.click();
      await this.waitForFilterUpdate();
      return true;
    }
    
    console.log('⚠️ 이전 페이지 버튼이 없거나 비활성화됨');
    return false;
  }

  /**
   * 모든 캠페인 정보 수집
   */
  async getAllCampaignInfo() {
    const campaignCount = await this.getCampaignCount();
    const campaigns = [];
    
    console.log(`📊 ${campaignCount}개 캠페인 정보 수집 중...`);
    
    for (let i = 0; i < Math.min(campaignCount, 10); i++) {
      const card = this.getCampaignCard(i);
      const info = await this.getCampaignInfo(card);
      campaigns.push({ index: i, ...info });
    }
    
    return campaigns;
  }

  /**
   * 사용 가능한 플랫폼 옵션 목록 반환
   */
  async getAvailablePlatforms(): Promise<string[]> {
    if (await this.platformFilter.count() > 0) {
      const options = await this.platformFilter.locator('option').allTextContents();
      return options.filter(option => option.trim() && option !== '전체' && option !== 'All');
    }
    
    // 버튼 형태 확인
    const platformButtons = this.page.locator('.platform-button, button[data-platform]');
    if (await platformButtons.count() > 0) {
      return await platformButtons.allTextContents();
    }
    
    return [];
  }

  /**
   * 사용 가능한 카테고리 옵션 목록 반환
   */
  async getAvailableCategories(): Promise<string[]> {
    if (await this.categoryFilter.count() > 0) {
      const options = await this.categoryFilter.locator('option').allTextContents();
      return options.filter(option => option.trim() && option !== '전체' && option !== 'All');
    }
    
    return [];
  }

  /**
   * 현재 활성화된 필터 상태 확인
   */
  async getActiveFilters() {
    const activeFilters: any = {};
    
    if (await this.platformFilter.count() > 0) {
      activeFilters.platform = await this.platformFilter.inputValue();
    }
    
    if (await this.categoryFilter.count() > 0) {
      activeFilters.category = await this.categoryFilter.inputValue();
    }
    
    if (await this.searchInput.count() > 0) {
      activeFilters.search = await this.searchInput.inputValue();
    }
    
    return activeFilters;
  }

  /**
   * 모든 필터 초기화
   */
  async clearAllFilters() {
    console.log('🗑️ 모든 필터 초기화...');
    
    // 플랫폼 필터 초기화
    if (await this.platformFilter.count() > 0) {
      await this.platformFilter.selectOption('');
    }
    
    // 카테고리 필터 초기화
    if (await this.categoryFilter.count() > 0) {
      await this.categoryFilter.selectOption('');
    }
    
    // 검색어 초기화
    if (await this.searchInput.count() > 0) {
      await this.searchInput.fill('');
    }
    
    await this.waitForFilterUpdate();
    console.log('✅ 필터 초기화 완료');
  }

  /**
   * 캠페인 목록이 비어있는지 확인
   */
  async isEmpty(): Promise<boolean> {
    const count = await this.getCampaignCount();
    return count === 0;
  }

  /**
   * 빈 상태 메시지 확인
   */
  async getEmptyStateMessage(): Promise<string | null> {
    const emptyMessage = this.page.locator('.empty-state, .no-campaigns, .no-results, text=캠페인이 없습니다');
    
    if (await emptyMessage.count() > 0) {
      return await emptyMessage.first().textContent();
    }
    
    return null;
  }

  /**
   * 페이지 검증 - 필수 요소들이 존재하는지 확인
   */
  async validatePage() {
    console.log('✅ 캠페인 목록 페이지 검증 중...');
    
    // 기본 요소들 확인
    await expect(this.campaignCards.or(this.page.locator('.empty-state'))).toBeVisible();
    
    if (await this.filterSection.count() > 0) {
      await expect(this.filterSection).toBeVisible();
    }
    
    console.log('✅ 캠페인 목록 페이지 검증 완료');
  }
}