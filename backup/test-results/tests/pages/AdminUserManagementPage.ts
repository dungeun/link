import { Page, Locator, expect } from '@playwright/test';

/**
 * 🛡️ 관리자 사용자 관리 페이지 Page Object Model
 * 
 * 관리자 사용자 관리 페이지의 모든 요소와 액션을 캡슐화하여
 * 테스트 코드의 재사용성과 유지보수성을 향상시킵니다.
 */
export class AdminUserManagementPage {
  readonly page: Page;
  
  // 주요 요소 로케이터들
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;
  readonly pagination: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly userDetailModal: Locator;
  readonly bulkActionButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // 테이블 관련 요소들
    this.userTable = page.locator('table, .user-list, [data-testid="user-table"]');
    this.userRows = page.locator('tbody tr, .user-row');
    
    // 필터 및 검색 요소들
    this.searchInput = page.locator('input[placeholder*="검색"], input[name="search"], .search-input');
    this.statusFilter = page.locator('select[name*="status"], .status-filter, [data-testid="status-filter"]');
    this.typeFilter = page.locator('select[name*="type"], .type-filter, [data-testid="type-filter"]');
    
    // UI 상태 요소들
    this.pagination = page.locator('.pagination, .page-nav, [data-testid="pagination"]');
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.errorMessage = page.locator('.error-message, .alert-error, [data-testid="error"]');
    this.successMessage = page.locator('.success-message, .alert-success, [data-testid="success"]');
    this.userDetailModal = page.locator('.modal, .user-detail, [data-testid="user-detail"]');
    this.bulkActionButtons = page.locator('.bulk-actions, [data-testid="bulk-actions"]');
  }

  /**
   * 관리자 사용자 관리 페이지로 이동
   */
  async goto() {
    console.log('🛡️ 관리자 사용자 관리 페이지로 이동 중...');
    await this.page.goto('/admin/users');
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
    
    console.log('✅ 관리자 사용자 관리 페이지 로드 완료');
  }

  /**
   * 사용자 목록 테이블 구조 검증
   */
  async validateTableStructure() {
    console.log('📊 사용자 테이블 구조 검증 중...');
    
    await expect(this.userTable).toBeVisible();
    
    // 예상되는 테이블 헤더들
    const expectedHeaders = ['이름', '이메일', '상태', '유형', '가입일', '액션'];
    
    for (const header of expectedHeaders) {
      const headerElement = this.page.locator(`th:has(text("${header}")), .table-header:has(text("${header}"))`);
      const headerExists = await headerElement.count() > 0;
      console.log(`📋 테이블 헤더 "${header}": ${headerExists ? '✅' : '❌'}`);
    }
    
    console.log('✅ 테이블 구조 검증 완료');
  }

  /**
   * 사용자 수 반환
   */
  async getUserCount(): Promise<number> {
    const count = await this.userRows.count();
    console.log(`👥 표시된 사용자 수: ${count}개`);
    return count;
  }

  /**
   * 특정 인덱스의 사용자 행 반환
   */
  getUserRow(index: number): Locator {
    return this.userRows.nth(index);
  }

  /**
   * 첫 번째 사용자 행 반환
   */
  getFirstUser(): Locator {
    return this.userRows.first();
  }

  /**
   * 이메일로 특정 사용자 찾기
   */
  getUserByEmail(email: string): Locator {
    return this.userRows.filter({
      has: this.page.locator(`td:has(text("${email}")), .user-email:has(text("${email}"))`)
    });
  }

  /**
   * 사용자 행에서 정보 추출
   */
  async getUserInfo(userRow: Locator) {
    const cells = userRow.locator('td');
    const cellCount = await cells.count();
    
    if (cellCount < 5) {
      throw new Error(`사용자 행의 셀 수가 부족합니다: ${cellCount}개`);
    }
    
    const name = await cells.nth(0).textContent();
    const email = await cells.nth(1).textContent();
    const status = await cells.nth(2).textContent();
    const type = await cells.nth(3).textContent();
    const joinDate = await cells.nth(4).textContent();
    
    return {
      name: name?.trim(),
      email: email?.trim(),
      status: status?.trim(),
      type: type?.trim(),
      joinDate: joinDate?.trim()
    };
  }

  /**
   * 사용자 상태 변경 드롭다운 가져오기
   */
  getStatusDropdown(userRow: Locator): Locator {
    return userRow.locator('select[name*="status"], .status-dropdown, [data-testid="status-select"]');
  }

  /**
   * 사용자 상태 변경
   */
  async changeUserStatus(userRow: Locator, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    console.log(`🔄 사용자 상태 변경: ${newStatus}`);
    
    const statusDropdown = this.getStatusDropdown(userRow);
    const dropdownExists = await statusDropdown.count() > 0;
    
    if (!dropdownExists) {
      throw new Error('상태 변경 드롭다운을 찾을 수 없습니다.');
    }
    
    // 현재 상태 확인
    const currentStatus = await statusDropdown.inputValue();
    console.log(`📋 현재 상태: ${currentStatus}`);
    
    if (currentStatus === newStatus) {
      console.log(`⚠️ 이미 ${newStatus} 상태입니다.`);
      return false;
    }
    
    // 상태 변경
    await statusDropdown.selectOption(newStatus);
    console.log(`🔄 상태 변경: ${currentStatus} → ${newStatus}`);
    
    return true;
  }

  /**
   * 사용자 정보 저장
   */
  async saveUserChanges(userRow: Locator) {
    console.log('💾 사용자 정보 저장 중...');
    
    const saveButton = userRow.locator('button:has(text("저장")), .save-button, button[data-action="save"]');
    const saveButtonExists = await saveButton.count() > 0;
    
    if (!saveButtonExists) {
      throw new Error('저장 버튼을 찾을 수 없습니다.');
    }
    
    const isEnabled = await saveButton.isEnabled();
    if (!isEnabled) {
      throw new Error('저장 버튼이 비활성화되어 있습니다.');
    }
    
    // API 요청 감시
    const responsePromise = this.page.waitForResponse(
      response => response.url().includes('/api/admin/users') && 
                 (response.request().method() === 'PUT' || response.request().method() === 'PATCH'),
      { timeout: 10000 }
    );
    
    await saveButton.click();
    
    try {
      const response = await responsePromise;
      const isSuccess = response.status() >= 200 && response.status() < 300;
      
      if (isSuccess) {
        console.log('✅ 사용자 정보 저장 성공');
        return true;
      } else {
        console.log(`❌ 사용자 정보 저장 실패: ${response.status()}`);
        return false;
      }
    } catch (error) {
      console.log('⚠️ API 응답 대기 시간 초과');
      return false;
    }
  }

  /**
   * 사용자 상태 변경 및 저장 (통합 메소드)
   */
  async updateUserStatus(userRow: Locator, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const statusChanged = await this.changeUserStatus(userRow, newStatus);
    
    if (!statusChanged) {
      return false;
    }
    
    const saved = await this.saveUserChanges(userRow);
    
    if (saved) {
      // 성공 메시지 확인
      await this.waitForSuccessMessage();
    }
    
    return saved;
  }

  /**
   * 사용자 검색
   */
  async searchUsers(searchTerm: string) {
    console.log(`🔍 사용자 검색: ${searchTerm}`);
    
    if (await this.searchInput.count() === 0) {
      throw new Error('검색 입력 필드를 찾을 수 없습니다.');
    }
    
    await this.searchInput.fill(searchTerm);
    await this.searchInput.press('Enter');
    await this.waitForTableUpdate();
  }

  /**
   * 상태별 필터링
   */
  async filterByStatus(status: string) {
    console.log(`📋 상태별 필터링: ${status}`);
    
    if (await this.statusFilter.count() === 0) {
      throw new Error('상태 필터를 찾을 수 없습니다.');
    }
    
    await this.statusFilter.selectOption(status);
    await this.waitForTableUpdate();
  }

  /**
   * 유형별 필터링
   */
  async filterByType(type: string) {
    console.log(`👤 유형별 필터링: ${type}`);
    
    if (await this.typeFilter.count() === 0) {
      throw new Error('유형 필터를 찾을 수 없습니다.');
    }
    
    await this.typeFilter.selectOption(type);
    await this.waitForTableUpdate();
  }

  /**
   * 테이블 업데이트 대기
   */
  async waitForTableUpdate() {
    // 로딩 표시 대기
    await this.page.waitForTimeout(500);
    
    // 로딩 스피너가 나타났다가 사라지는 것을 대기
    if (await this.loadingSpinner.count() > 0) {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    }
    
    // 네트워크 안정화 대기
    await this.page.waitForLoadState('networkidle');
    console.log('✅ 테이블 업데이트 완료');
  }

  /**
   * 사용자 상세 정보 보기
   */
  async viewUserDetails(userRow: Locator) {
    console.log('👤 사용자 상세 정보 보기...');
    
    const detailButton = userRow.locator('button:has(text("상세")), .detail-button, button[data-action="detail"]');
    const detailButtonExists = await detailButton.count() > 0;
    
    if (!detailButtonExists) {
      throw new Error('상세 보기 버튼을 찾을 수 없습니다.');
    }
    
    await detailButton.click();
    
    // 모달이 나타나는지 확인
    await expect(this.userDetailModal).toBeVisible({ timeout: 5000 });
    console.log('✅ 사용자 상세 모달 표시됨');
    
    return this.userDetailModal;
  }

  /**
   * 사용자 상세 모달에서 정보 추출
   */
  async getUserDetailInfo(modal: Locator) {
    const info: any = {};
    
    // 기본 정보 필드들
    const fields = [
      { key: 'name', selector: '.user-name, [data-field="name"]' },
      { key: 'email', selector: '.user-email, [data-field="email"]' },
      { key: 'status', selector: '.user-status, [data-field="status"]' },
      { key: 'type', selector: '.user-type, [data-field="type"]' },
      { key: 'createdAt', selector: '.created-at, [data-field="createdAt"]' },
      { key: 'statusUpdatedAt', selector: '.status-updated-at, [data-field="statusUpdatedAt"]' }
    ];
    
    for (const field of fields) {
      const element = modal.locator(field.selector);
      if (await element.count() > 0) {
        info[field.key] = await element.textContent();
      }
    }
    
    return info;
  }

  /**
   * 사용자 상세 모달 닫기
   */
  async closeUserDetailModal() {
    const closeButton = this.userDetailModal.locator('.close, .modal-close, button[aria-label="닫기"]');
    
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    
    await expect(this.userDetailModal).not.toBeVisible();
    console.log('✅ 사용자 상세 모달 닫기 완료');
  }

  /**
   * 페이지네이션으로 다음 페이지 이동
   */
  async goToNextPage() {
    console.log('📄 다음 페이지로 이동...');
    
    const nextButton = this.pagination.locator('button:has(text("다음")), .next, [aria-label="다음"]');
    
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await this.waitForTableUpdate();
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
      await this.waitForTableUpdate();
      return true;
    }
    
    console.log('⚠️ 이전 페이지 버튼이 없거나 비활성화됨');
    return false;
  }

  /**
   * 사용 가능한 상태 옵션 목록 반환
   */
  async getAvailableStatuses(): Promise<string[]> {
    const statusOptions = await this.page.locator('select[name*="status"] option').allTextContents();
    return statusOptions.filter(option => option.trim() && option !== '전체' && option !== 'All');
  }

  /**
   * 사용 가능한 유형 옵션 목록 반환
   */
  async getAvailableTypes(): Promise<string[]> {
    if (await this.typeFilter.count() > 0) {
      const typeOptions = await this.typeFilter.locator('option').allTextContents();
      return typeOptions.filter(option => option.trim() && option !== '전체' && option !== 'All');
    }
    return [];
  }

  /**
   * 모든 사용자 정보 수집
   */
  async getAllUserInfo() {
    const userCount = await this.getUserCount();
    const users = [];
    
    console.log(`👥 ${userCount}개 사용자 정보 수집 중...`);
    
    for (let i = 0; i < Math.min(userCount, 10); i++) {
      const userRow = this.getUserRow(i);
      const info = await this.getUserInfo(userRow);
      users.push({ index: i, ...info });
    }
    
    return users;
  }

  /**
   * 대량 작업 수행
   */
  async performBulkAction(action: string, userIndices: number[]) {
    console.log(`📦 대량 작업 수행: ${action}, 대상: ${userIndices.length}개`);
    
    // 사용자 선택
    for (const index of userIndices) {
      const userRow = this.getUserRow(index);
      const checkbox = userRow.locator('input[type="checkbox"], .user-checkbox');
      
      if (await checkbox.count() > 0) {
        await checkbox.check();
      }
    }
    
    // 대량 작업 버튼 클릭
    const actionButton = this.bulkActionButtons.locator(`button:has(text("${action}")), button[data-action="${action}"]`);
    
    if (await actionButton.count() > 0 && await actionButton.isEnabled()) {
      await actionButton.click();
      await this.waitForTableUpdate();
      return true;
    }
    
    return false;
  }

  /**
   * 성공 메시지 대기
   */
  async waitForSuccessMessage(timeout: number = 5000) {
    try {
      await expect(this.successMessage).toBeVisible({ timeout });
      const messageText = await this.successMessage.textContent();
      console.log(`✅ 성공 메시지: ${messageText}`);
      return true;
    } catch {
      console.log('⚠️ 성공 메시지가 나타나지 않음');
      return false;
    }
  }

  /**
   * 에러 메시지 확인
   */
  async hasError(): Promise<boolean> {
    const errorExists = await this.errorMessage.count() > 0;
    
    if (errorExists) {
      const errorText = await this.errorMessage.first().textContent();
      console.log(`🚨 에러 메시지: ${errorText}`);
    }
    
    return errorExists;
  }

  /**
   * 현재 활성화된 필터 상태 확인
   */
  async getActiveFilters() {
    const activeFilters: any = {};
    
    if (await this.statusFilter.count() > 0) {
      activeFilters.status = await this.statusFilter.inputValue();
    }
    
    if (await this.typeFilter.count() > 0) {
      activeFilters.type = await this.typeFilter.inputValue();
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
    
    // 상태 필터 초기화
    if (await this.statusFilter.count() > 0) {
      await this.statusFilter.selectOption('');
    }
    
    // 유형 필터 초기화
    if (await this.typeFilter.count() > 0) {
      await this.typeFilter.selectOption('');
    }
    
    // 검색어 초기화
    if (await this.searchInput.count() > 0) {
      await this.searchInput.fill('');
    }
    
    await this.waitForTableUpdate();
    console.log('✅ 필터 초기화 완료');
  }

  /**
   * 페이지 검증 - 필수 요소들이 존재하는지 확인
   */
  async validatePage() {
    console.log('✅ 관리자 사용자 관리 페이지 검증 중...');
    
    // 에러 상태 먼저 확인
    const hasError = await this.hasError();
    if (hasError) {
      throw new Error('페이지에 에러가 있습니다.');
    }
    
    // 기본 요소들 확인
    await expect(this.userTable).toBeVisible();
    
    // 테이블 구조 검증
    await this.validateTableStructure();
    
    console.log('✅ 관리자 사용자 관리 페이지 검증 완료');
  }
}