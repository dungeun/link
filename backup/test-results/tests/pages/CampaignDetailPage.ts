import { Page, Locator, expect } from '@playwright/test';

/**
 * 📄 캠페인 상세 페이지 Page Object Model
 * 
 * 캠페인 상세 페이지의 모든 요소와 액션을 캡슐화하여
 * 테스트 코드의 재사용성과 유지보수성을 향상시킵니다.
 */
export class CampaignDetailPage {
  readonly page: Page;
  
  // 주요 요소 로케이터들
  readonly campaignTitle: Locator;
  readonly campaignDescription: Locator;
  readonly headerImage: Locator;
  readonly productImages: Locator;
  readonly detailImages: Locator;
  readonly platformTags: Locator;
  readonly budgetInfo: Locator;
  readonly deadline: Locator;
  readonly requirements: Locator;
  readonly applyButton: Locator;
  readonly backButton: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly applicationModal: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 기본 정보 요소들
    this.campaignTitle = page.locator('h1, .campaign-title, [data-testid="campaign-title"]');
    this.campaignDescription = page.locator('.description, .campaign-description, .content');
    
    // 이미지 요소들
    this.headerImage = page.locator('[data-testid="campaign-header-image"], .header-image, .campaign-header img');
    this.productImages = page.locator('[data-testid="product-images"] img, .product-images img, .media-images img');
    this.detailImages = page.locator('[data-testid="detail-images"] img, .detail-images img, .campaign-detail-images img');
    
    // 메타 정보 요소들
    this.platformTags = page.locator('.platform-tag, .platform-label, .platform-badge');
    this.budgetInfo = page.locator('.budget, .price, .amount, [data-testid="budget"]');
    this.deadline = page.locator('.deadline, .due-date, [data-testid="deadline"]');
    this.requirements = page.locator('.requirements, .guidelines, [data-testid="requirements"]');
    
    // 액션 요소들
    this.applyButton = page.locator('text=지원하기, text=Apply, button[data-action="apply"], .apply-button');
    this.backButton = page.locator('text=목록으로, text=뒤로, .back-button, [aria-label="뒤로"]');
    
    // 상태 요소들
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.errorMessage = page.locator('.error-message, .alert-error, [data-testid="error"]');
    this.applicationModal = page.locator('.modal, .dialog, [data-testid="application-modal"], .application-form');
  }

  /**
   * 특정 캠페인 상세 페이지로 이동
   */
  async goto(campaignId: string) {
    console.log(`📄 캠페인 상세 페이지로 이동: ${campaignId}`);
    await this.page.goto(`/campaigns/${campaignId}`);
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
    
    console.log('✅ 캠페인 상세 페이지 로드 완료');
  }

  /**
   * 캠페인 기본 정보 가져오기
   */
  async getCampaignInfo() {
    const title = await this.campaignTitle.first().textContent();
    const description = await this.campaignDescription.first().textContent();
    const platforms = await this.platformTags.allTextContents();
    const budget = await this.budgetInfo.first().textContent();
    const deadline = await this.deadline.first().textContent();
    
    return {
      title: title?.trim(),
      description: description?.trim(),
      platforms: platforms.map(p => p.trim()).filter(Boolean),
      budget: budget?.trim(),
      deadline: deadline?.trim()
    };
  }

  /**
   * 헤더 이미지 검증
   */
  async validateHeaderImage() {
    console.log('🖼️ 헤더 이미지 검증 중...');
    
    const headerExists = await this.headerImage.count() > 0;
    if (!headerExists) {
      console.log('⚠️ 헤더 이미지가 없음');
      return false;
    }
    
    await expect(this.headerImage.first()).toBeVisible();
    
    const imageSrc = await this.headerImage.first().getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).not.toBe('');
    
    // 이미지 로드 완료 확인
    await expect(this.headerImage.first()).toHaveJSProperty('complete', true);
    
    const naturalWidth = await this.headerImage.first().evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
    
    console.log(`✅ 헤더 이미지 검증 완료 (src: ${imageSrc})`);
    return true;
  }

  /**
   * 제품 이미지들 검증
   */
  async validateProductImages() {
    console.log('🖼️ 제품 이미지들 검증 중...');
    
    const imageCount = await this.productImages.count();
    console.log(`📷 제품 이미지 수: ${imageCount}개`);
    
    if (imageCount === 0) {
      console.log('⚠️ 제품 이미지가 없음');
      return [];
    }
    
    const validatedImages = [];
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const image = this.productImages.nth(i);
      await expect(image).toBeVisible();
      
      const imageSrc = await image.getAttribute('src');
      const imageAlt = await image.getAttribute('alt');
      
      expect(imageSrc).toBeTruthy();
      await expect(image).toHaveJSProperty('complete', true);
      
      const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
      
      validatedImages.push({
        index: i,
        src: imageSrc,
        alt: imageAlt,
        width: naturalWidth
      });
      
      console.log(`✅ 제품 이미지 ${i + 1} 검증 완료`);
    }
    
    return validatedImages;
  }

  /**
   * 상세 이미지들 검증
   */
  async validateDetailImages() {
    console.log('🖼️ 상세 이미지들 검증 중...');
    
    const imageCount = await this.detailImages.count();
    console.log(`📷 상세 이미지 수: ${imageCount}개`);
    
    if (imageCount === 0) {
      console.log('⚠️ 상세 이미지가 없음');
      return [];
    }
    
    const validatedImages = [];
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const image = this.detailImages.nth(i);
      await expect(image).toBeVisible();
      
      const imageSrc = await image.getAttribute('src');
      expect(imageSrc).toBeTruthy();
      await expect(image).toHaveJSProperty('complete', true);
      
      validatedImages.push({
        index: i,
        src: imageSrc
      });
      
      console.log(`✅ 상세 이미지 ${i + 1} 검증 완료`);
    }
    
    return validatedImages;
  }

  /**
   * 모든 이미지 검증
   */
  async validateAllImages() {
    console.log('🖼️ 모든 이미지 검증 시작...');
    
    const results = {
      headerImage: await this.validateHeaderImage(),
      productImages: await this.validateProductImages(),
      detailImages: await this.validateDetailImages()
    };
    
    const totalImages = (results.headerImage ? 1 : 0) + 
                       results.productImages.length + 
                       results.detailImages.length;
    
    console.log(`✅ 전체 이미지 검증 완료: ${totalImages}개`);
    return results;
  }

  /**
   * 지원 버튼 상태 확인
   */
  async getApplyButtonStatus() {
    const buttonExists = await this.applyButton.count() > 0;
    
    if (!buttonExists) {
      return { exists: false, enabled: false, text: null, status: 'not_found' };
    }
    
    const isEnabled = await this.applyButton.isEnabled();
    const isVisible = await this.applyButton.isVisible();
    const buttonText = await this.applyButton.textContent();
    
    let status = 'unknown';
    if (buttonText?.includes('지원 완료') || buttonText?.includes('지원함')) {
      status = 'already_applied';
    } else if (buttonText?.includes('지원하기') && isEnabled) {
      status = 'available';
    } else if (!isEnabled) {
      status = 'disabled';
    }
    
    return {
      exists: buttonExists,
      enabled: isEnabled,
      visible: isVisible,
      text: buttonText?.trim(),
      status
    };
  }

  /**
   * 캠페인 지원하기
   */
  async applyCampaign() {
    console.log('📝 캠페인 지원 시작...');
    
    const buttonStatus = await this.getApplyButtonStatus();
    
    if (!buttonStatus.exists) {
      throw new Error('지원 버튼을 찾을 수 없습니다.');
    }
    
    if (!buttonStatus.enabled) {
      throw new Error(`지원 버튼이 비활성화되어 있습니다. 상태: ${buttonStatus.status}`);
    }
    
    // 지원 버튼 클릭
    await this.applyButton.click();
    
    // 모달이나 폼이 나타나는지 확인
    const modalAppeared = await this.applicationModal.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (modalAppeared) {
      console.log('📋 지원 모달이 나타남');
      return 'modal_opened';
    } else {
      // 페이지 이동이나 인라인 폼 확인
      await this.page.waitForTimeout(1000);
      const currentUrl = this.page.url();
      console.log(`🔗 현재 URL: ${currentUrl}`);
      
      if (currentUrl.includes('/apply') || currentUrl.includes('/application')) {
        return 'page_redirect';
      } else {
        return 'inline_form';
      }
    }
  }

  /**
   * 지원 모달에서 폼 작성
   */
  async fillApplicationForm(applicationData: {
    message: string;
    portfolio?: string;
    experience?: string;
  }) {
    console.log('📝 지원 폼 작성 중...');
    
    const modal = this.applicationModal.first();
    await expect(modal).toBeVisible();
    
    // 지원 메시지 입력
    const messageField = modal.locator('textarea[name="message"], input[name="message"]');
    if (await messageField.count() > 0) {
      await messageField.fill(applicationData.message);
      console.log('✅ 지원 메시지 입력 완료');
    }
    
    // 포트폴리오 URL 입력
    if (applicationData.portfolio) {
      const portfolioField = modal.locator('input[name="portfolio"], textarea[name="portfolio"]');
      if (await portfolioField.count() > 0) {
        await portfolioField.fill(applicationData.portfolio);
        console.log('✅ 포트폴리오 URL 입력 완료');
      }
    }
    
    // 경험 입력
    if (applicationData.experience) {
      const experienceField = modal.locator('textarea[name="experience"], input[name="experience"]');
      if (await experienceField.count() > 0) {
        await experienceField.fill(applicationData.experience);
        console.log('✅ 경험 정보 입력 완료');
      }
    }
  }

  /**
   * 지원 폼 제출
   */
  async submitApplication() {
    console.log('📤 지원서 제출 중...');
    
    const modal = this.applicationModal.first();
    const submitButton = modal.locator('button[type="submit"], .submit-button, text=제출, text=지원하기');
    
    const submitExists = await submitButton.count() > 0;
    if (!submitExists) {
      throw new Error('제출 버튼을 찾을 수 없습니다.');
    }
    
    const isEnabled = await submitButton.isEnabled();
    if (!isEnabled) {
      throw new Error('제출 버튼이 비활성화되어 있습니다.');
    }
    
    await submitButton.click();
    
    // 제출 완료 대기
    await this.page.waitForTimeout(2000);
    
    // 성공 메시지 확인
    const successMessage = this.page.locator('text=지원이 완료, text=성공적으로 제출, text=지원해주셔서 감사, .success-message');
    const successExists = await successMessage.count() > 0;
    
    if (successExists) {
      const messageText = await successMessage.first().textContent();
      console.log(`✅ 지원 완료: ${messageText}`);
      return true;
    }
    
    return false;
  }

  /**
   * 이미지 확대보기/모달 테스트
   */
  async testImageModal() {
    console.log('🔍 이미지 확대보기 테스트...');
    
    // 클릭 가능한 이미지 찾기
    const clickableImages = this.page.locator('img[style*="cursor"], img.clickable, .image-gallery img');
    const clickableCount = await clickableImages.count();
    
    if (clickableCount === 0) {
      console.log('⚠️ 클릭 가능한 이미지가 없음');
      return false;
    }
    
    const firstClickableImage = clickableImages.first();
    await firstClickableImage.click();
    
    // 모달 또는 라이트박스 확인
    const modal = this.page.locator('.modal, .lightbox, .image-modal, [data-testid="image-modal"]');
    const modalExists = await modal.count() > 0;
    
    if (modalExists) {
      await expect(modal.first()).toBeVisible();
      console.log('✅ 이미지 모달 표시됨');
      
      // 모달 내부의 확대된 이미지 확인
      const modalImage = modal.locator('img').first();
      await expect(modalImage).toBeVisible();
      
      // 모달 닫기
      await this.page.keyboard.press('Escape');
      await expect(modal.first()).not.toBeVisible();
      console.log('✅ 이미지 모달 닫기 완료');
      
      return true;
    }
    
    return false;
  }

  /**
   * 목록으로 돌아가기
   */
  async goBackToList() {
    console.log('📄 캠페인 목록으로 돌아가기...');
    
    if (await this.backButton.count() > 0) {
      await this.backButton.click();
    } else {
      // 브라우저 뒤로가기 사용
      await this.page.goBack();
    }
    
    await this.page.waitForLoadState('networkidle');
    console.log('✅ 캠페인 목록으로 돌아가기 완료');
  }

  /**
   * 플랫폼 정보 검증
   */
  async validatePlatformInfo() {
    console.log('📱 플랫폼 정보 검증 중...');
    
    const platformCount = await this.platformTags.count();
    console.log(`📱 플랫폼 태그 수: ${platformCount}개`);
    
    if (platformCount === 0) {
      console.log('⚠️ 플랫폼 정보가 없음');
      return [];
    }
    
    const platforms = await this.platformTags.allTextContents();
    const validPlatforms = platforms.map(p => p.trim()).filter(Boolean);
    
    console.log(`📱 플랫폼 목록: ${validPlatforms.join(', ')}`);
    return validPlatforms;
  }

  /**
   * 예산 정보 검증
   */
  async validateBudgetInfo() {
    console.log('💰 예산 정보 검증 중...');
    
    if (await this.budgetInfo.count() === 0) {
      console.log('⚠️ 예산 정보가 없음');
      return null;
    }
    
    const budgetText = await this.budgetInfo.first().textContent();
    console.log(`💰 예산 정보: ${budgetText}`);
    
    // 예산 형식 검증 (숫자와 원화 표시)
    const budgetPattern = /[\d,]+원|[\d,]+\s*만원|무료|협의/;
    const hasValidFormat = budgetPattern.test(budgetText || '');
    
    console.log(`💰 예산 형식 유효성: ${hasValidFormat ? '✅' : '❌'}`);
    
    return {
      text: budgetText?.trim(),
      isValid: hasValidFormat
    };
  }

  /**
   * 페이지 에러 상태 확인
   */
  async hasError(): Promise<boolean> {
    const errorExists = await this.errorMessage.count() > 0;
    
    if (errorExists) {
      const errorText = await this.errorMessage.first().textContent();
      console.log(`🚨 페이지 에러: ${errorText}`);
    }
    
    return errorExists;
  }

  /**
   * 페이지 검증 - 필수 요소들이 존재하는지 확인
   */
  async validatePage() {
    console.log('✅ 캠페인 상세 페이지 검증 중...');
    
    // 에러 상태 먼저 확인
    const hasError = await this.hasError();
    if (hasError) {
      throw new Error('페이지에 에러가 있습니다.');
    }
    
    // 기본 요소들 확인
    await expect(this.campaignTitle).toBeVisible();
    
    // 설명이나 이미지 중 하나는 있어야 함
    const hasDescription = await this.campaignDescription.count() > 0;
    const hasImages = await this.productImages.count() > 0 || await this.headerImage.count() > 0;
    
    if (!hasDescription && !hasImages) {
      throw new Error('캠페인 설명이나 이미지가 없습니다.');
    }
    
    console.log('✅ 캠페인 상세 페이지 검증 완료');
  }

  /**
   * 반응형 디자인 확인
   */
  async testResponsiveDesign() {
    console.log('📱 반응형 디자인 확인 중...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    const results = [];
    
    for (const viewport of viewports) {
      console.log(`📱 ${viewport.name} 뷰포트 테스트...`);
      
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500);
      
      // 주요 요소들이 뷰포트에 맞게 조정되었는지 확인
      const titleBox = await this.campaignTitle.first().boundingBox();
      const isVisible = await this.campaignTitle.first().isVisible();
      
      results.push({
        viewport: viewport.name,
        titleVisible: isVisible,
        titleWidth: titleBox?.width,
        fitsInViewport: titleBox ? titleBox.width <= viewport.width : false
      });
      
      console.log(`📱 ${viewport.name}: 제목 표시=${isVisible}, 너비=${titleBox?.width}px`);
    }
    
    // 원래 뷰포트로 복원
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    return results;
  }
}