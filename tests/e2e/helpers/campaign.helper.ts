import { Page } from '@playwright/test';
import { testData } from '../fixtures/test-data';

/**
 * 캠페인 관련 헬퍼 함수들
 */
export class CampaignHelper {
  constructor(private page: Page) {}

  /**
   * 캠페인 생성 (관리자)
   */
  async createCampaignAsAdmin() {
    await this.page.goto('/admin/campaigns/new');
    
    // 기본 정보
    await this.page.fill('input[name="title"]', testData.campaign.title);
    await this.page.fill('textarea[name="description"]', testData.campaign.description);
    
    // 카테고리 선택
    await this.page.selectOption('select[name="category"]', testData.campaign.category);
    
    // 플랫폼 선택
    await this.page.click(`input[value="${testData.campaign.platform}"]`);
    
    // 예산 및 참여자 수
    await this.page.fill('input[name="budget"]', testData.campaign.budget.toString());
    await this.page.fill('input[name="participantCount"]', testData.campaign.participantCount.toString());
    
    // 날짜 설정
    const startDate = testData.campaign.startDate.toISOString().split('T')[0];
    const endDate = testData.campaign.endDate.toISOString().split('T')[0];
    await this.page.fill('input[name="startDate"]', startDate);
    await this.page.fill('input[name="endDate"]', endDate);
    
    // 요구사항 추가
    for (const requirement of testData.campaign.requirements) {
      await this.page.click('button:has-text("요구사항 추가")');
      await this.page.fill('input[name="requirement"]', requirement);
      await this.page.click('button:has-text("추가")');
    }
    
    // 해시태그 추가
    for (const hashtag of testData.campaign.hashtags) {
      await this.page.fill('input[name="hashtag"]', hashtag);
      await this.page.press('input[name="hashtag"]', 'Enter');
    }
    
    // 리워드 설정
    await this.page.selectOption('select[name="rewardType"]', testData.campaign.rewards.type);
    await this.page.fill('input[name="productName"]', testData.campaign.rewards.productName);
    await this.page.fill('input[name="productValue"]', testData.campaign.rewards.productValue.toString());
    
    // 저장
    await this.page.click('button:has-text("캠페인 생성")');
    await this.page.waitForURL(/\/admin\/campaigns\/[^\/]+$/);
  }

  /**
   * 캠페인 생성 (브랜드)
   */
  async createCampaignAsBrand() {
    await this.page.goto('/campaigns/new');
    
    // 기본 정보
    await this.page.fill('input[name="title"]', testData.campaign.title);
    await this.page.fill('textarea[name="description"]', testData.campaign.description);
    
    // 카테고리 선택
    await this.page.selectOption('select[name="category"]', testData.campaign.category);
    
    // 플랫폼 선택
    await this.page.click(`label:has-text("${testData.campaign.platform}")`);
    
    // 예산 및 참여자 수
    await this.page.fill('input[name="budget"]', testData.campaign.budget.toString());
    await this.page.fill('input[name="participantCount"]', testData.campaign.participantCount.toString());
    
    // 날짜 설정
    const startDate = testData.campaign.startDate.toISOString().split('T')[0];
    const endDate = testData.campaign.endDate.toISOString().split('T')[0];
    await this.page.fill('input[name="startDate"]', startDate);
    await this.page.fill('input[name="endDate"]', endDate);
    
    // 저장 및 게시
    await this.page.click('button:has-text("저장")');
    await this.page.waitForTimeout(1000);
    await this.page.click('button:has-text("게시")');
    await this.page.waitForURL(/\/campaigns\/[^\/]+$/);
  }

  /**
   * 캠페인 검색
   */
  async searchCampaign(keyword: string) {
    await this.page.goto('/campaigns');
    await this.page.fill('input[placeholder*="검색"]', keyword);
    await this.page.press('input[placeholder*="검색"]', 'Enter');
    await this.page.waitForTimeout(1000);
  }

  /**
   * 캠페인 상세 페이지로 이동
   */
  async goToCampaignDetail(campaignId: string) {
    await this.page.goto(`/campaigns/${campaignId}`);
    await this.page.waitForSelector('h1');
  }

  /**
   * 캠페인 참여 신청 (인플루언서)
   */
  async applyToCampaign() {
    // 캠페인 상세 페이지에서 시작
    await this.page.click('button:has-text("참여 신청")');
    
    // 신청 모달/페이지
    await this.page.fill('textarea[name="message"]', testData.application.message);
    
    // 포트폴리오 링크 추가
    for (const link of testData.application.portfolio) {
      await this.page.click('button:has-text("포트폴리오 추가")');
      await this.page.fill('input[name="portfolioUrl"]', link);
    }
    
    // 예상 도달 수
    await this.page.fill('input[name="expectedReach"]', testData.application.expectedReach.toString());
    
    // 콘텐츠 계획
    await this.page.fill('textarea[name="contentPlan"]', testData.application.contentPlan);
    
    // 제출
    await this.page.click('button:has-text("신청하기")');
    await this.page.waitForSelector('text=신청이 완료되었습니다');
  }

  /**
   * 캠페인 참여 승인 (관리자/브랜드)
   */
  async approveApplication(applicationId: string) {
    await this.page.goto(`/admin/applications/${applicationId}`);
    await this.page.click('button:has-text("승인")');
    await this.page.click('button:has-text("확인")'); // 확인 모달
    await this.page.waitForSelector('text=승인되었습니다');
  }

  /**
   * 콘텐츠 제출 (인플루언서)
   */
  async submitContent(campaignId: string) {
    await this.page.goto(`/my/campaigns/${campaignId}`);
    await this.page.click('button:has-text("콘텐츠 제출")');
    
    // 콘텐츠 URL
    await this.page.fill('input[name="contentUrl"]', testData.content.url);
    
    // 캡션
    await this.page.fill('textarea[name="caption"]', testData.content.caption);
    
    // 성과 지표
    await this.page.fill('input[name="likes"]', testData.content.metrics.likes.toString());
    await this.page.fill('input[name="comments"]', testData.content.metrics.comments.toString());
    await this.page.fill('input[name="shares"]', testData.content.metrics.shares.toString());
    
    // 제출
    await this.page.click('button:has-text("제출")');
    await this.page.waitForSelector('text=콘텐츠가 제출되었습니다');
  }

  /**
   * 콘텐츠 승인 (관리자/브랜드)
   */
  async approveContent(contentId: string) {
    await this.page.goto(`/admin/contents/${contentId}`);
    await this.page.click('button:has-text("승인")');
    await this.page.click('button:has-text("확인")');
    await this.page.waitForSelector('text=승인되었습니다');
  }

  /**
   * 캠페인 상태 확인
   */
  async getCampaignStatus(): Promise<string> {
    const statusElement = await this.page.locator('[data-testid="campaign-status"]');
    return await statusElement.textContent() || '';
  }
}