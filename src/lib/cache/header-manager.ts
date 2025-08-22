/**
 * 헤더 JSON 관리 시스템
 * - JSON-first 헤더 메뉴 관리
 * - 다국어 지원
 * - 순서 및 가시성 관리
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";
import { LanguageCode } from "@/types/global";

export interface HeaderMenuItem {
  id: string;
  label: {
    ko: string;
    en: string;
    jp: string;
  };
  href: string;
  order: number;
  visible: boolean;
}

export interface HeaderCTAButton {
  text: {
    ko: string;
    en: string;
    jp: string;
  };
  href: string;
  visible: boolean;
}

export interface HeaderLogo {
  text: string;
  imageUrl?: string | null;
}

export interface HeaderData {
  metadata: {
    version: string;
    lastUpdated: string;
  };
  header: {
    logo: HeaderLogo;
    menus: HeaderMenuItem[];
    ctaButton: HeaderCTAButton;
  };
}

export interface MenuUpdateData {
  menuId: string;
  label?: {
    ko: string;
    en: string;
    jp: string;
  };
  href?: string;
  visible?: boolean;
  order?: number;
}

const HEADER_JSON_PATH = path.join(process.cwd(), "public/cache/header.json");
const BACKUP_PATH = path.join(process.cwd(), "public/cache/backups/header");

export class HeaderManager {
  /**
   * 헤더 데이터 로드
   */
  async loadHeader(): Promise<HeaderData | null> {
    try {
      const content = await fs.readFile(HEADER_JSON_PATH, "utf-8");
      const data = JSON.parse(content);

      logger.info("Header data loaded successfully");
      return data;
    } catch (error) {
      logger.error(
        `Failed to load header data: ${error instanceof Error ? error.message : String(error)}`,
      );

      // 백업에서 복구 시도
      return await this.restoreFromBackup();
    }
  }

  /**
   * 메뉴 데이터 업데이트
   */
  async updateMenu(updateData: MenuUpdateData): Promise<boolean> {
    try {
      const header = await this.loadHeader();
      if (!header) {
        logger.error("Header data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(header);

      // 메뉴 찾기 및 업데이트
      const menuIndex = header.header.menus.findIndex(
        (menu) => menu.id === updateData.menuId,
      );
      if (menuIndex === -1) {
        logger.error(`Menu not found: ${updateData.menuId}`);
        return false;
      }

      // 메뉴 업데이트
      if (updateData.label) {
        header.header.menus[menuIndex].label = updateData.label;
      }
      if (updateData.href) {
        header.header.menus[menuIndex].href = updateData.href;
      }
      if (updateData.visible !== undefined) {
        header.header.menus[menuIndex].visible = updateData.visible;
      }
      if (updateData.order !== undefined) {
        header.header.menus[menuIndex].order = updateData.order;
      }

      // 메타데이터 업데이트
      header.metadata.lastUpdated = new Date().toISOString();
      header.metadata.version = this.generateVersion();

      // JSON 파일 저장
      await this.saveHeader(header);

      logger.info(`Header menu updated: ${updateData.menuId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to update menu: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 메뉴 순서 업데이트
   */
  async updateMenuOrder(newOrder: string[]): Promise<boolean> {
    try {
      const header = await this.loadHeader();
      if (!header) {
        logger.error("Header data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(header);

      // 순서 업데이트
      header.header.menus = header.header.menus.sort((a, b) => {
        const aIndex = newOrder.indexOf(a.id);
        const bIndex = newOrder.indexOf(b.id);
        return aIndex - bIndex;
      });

      // order 필드 업데이트
      header.header.menus.forEach((menu, index) => {
        menu.order = index + 1;
      });

      header.metadata.lastUpdated = new Date().toISOString();

      await this.saveHeader(header);

      logger.info("Header menu order updated successfully");
      return true;
    } catch (error) {
      logger.error(
        `Failed to update menu order: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 메뉴 가시성 토글
   */
  async toggleMenuVisibility(menuId: string): Promise<boolean> {
    try {
      const header = await this.loadHeader();
      if (!header) {
        logger.error("Header data not found");
        return false;
      }

      const menuIndex = header.header.menus.findIndex(
        (menu) => menu.id === menuId,
      );
      if (menuIndex === -1) {
        logger.error(`Menu not found: ${menuId}`);
        return false;
      }

      // 백업 생성
      await this.createBackup(header);

      // 가시성 토글
      header.header.menus[menuIndex].visible =
        !header.header.menus[menuIndex].visible;
      header.metadata.lastUpdated = new Date().toISOString();

      await this.saveHeader(header);

      logger.info(`Header menu visibility toggled: ${menuId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to toggle menu visibility: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 언어별 헤더 데이터 가져오기 (클라이언트용 - 원본 다국어 객체 유지)
   */
  async getHeaderData(): Promise<HeaderData | null> {
    try {
      const header = await this.loadHeader();
      if (!header) return null;

      // 원본 다국어 데이터를 그대로 반환하여 클라이언트에서 언어 변경 가능
      return JSON.parse(JSON.stringify(header));
    } catch (error) {
      logger.error(
        `Failed to get header data: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 로고 업데이트
   */
  async updateLogo(logoData: HeaderLogo): Promise<boolean> {
    try {
      const header = await this.loadHeader();
      if (!header) {
        logger.error("Header data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(header);

      // 로고 업데이트
      header.header.logo = logoData;
      header.metadata.lastUpdated = new Date().toISOString();
      header.metadata.version = this.generateVersion();

      await this.saveHeader(header);

      logger.info("Header logo updated successfully");
      return true;
    } catch (error) {
      logger.error(
        `Failed to update logo: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * CTA 버튼 업데이트
   */
  async updateCTAButton(ctaData: HeaderCTAButton): Promise<boolean> {
    try {
      const header = await this.loadHeader();
      if (!header) {
        logger.error("Header data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(header);

      // CTA 버튼 업데이트
      header.header.ctaButton = ctaData;
      header.metadata.lastUpdated = new Date().toISOString();
      header.metadata.version = this.generateVersion();

      await this.saveHeader(header);

      logger.info("Header CTA button updated successfully");
      return true;
    } catch (error) {
      logger.error(
        `Failed to update CTA button: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * JSON 파일 저장
   */
  private async saveHeader(data: HeaderData): Promise<void> {
    await fs.writeFile(HEADER_JSON_PATH, JSON.stringify(data, null, 2));
  }

  /**
   * 백업 생성
   */
  private async createBackup(data: HeaderData): Promise<void> {
    try {
      await fs.mkdir(BACKUP_PATH, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `header-${timestamp}.json`;
      const backupFilePath = path.join(BACKUP_PATH, backupFileName);

      await fs.writeFile(backupFilePath, JSON.stringify(data, null, 2));

      // 오래된 백업 정리 (최근 5개만 유지)
      await this.cleanupOldBackups();

      logger.info(`Header backup created: ${backupFileName}`);
    } catch (error) {
      logger.error(
        `Failed to create header backup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 백업에서 복구
   */
  private async restoreFromBackup(): Promise<HeaderData | null> {
    try {
      const files = await fs.readdir(BACKUP_PATH);
      const backupFiles = files
        .filter((file) => file.startsWith("header-") && file.endsWith(".json"))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        logger.error("No header backup files found");
        return null;
      }

      const latestBackup = backupFiles[0];
      const backupPath = path.join(BACKUP_PATH, latestBackup);
      const content = await fs.readFile(backupPath, "utf-8");
      const data = JSON.parse(content);

      logger.info(`Header restored from backup: ${latestBackup}`);
      return data;
    } catch (error) {
      logger.error(
        `Failed to restore header from backup: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 오래된 백업 정리
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(BACKUP_PATH);
      const backupFiles = files
        .filter((file) => file.startsWith("header-") && file.endsWith(".json"))
        .sort();

      if (backupFiles.length > 5) {
        const filesToDelete = backupFiles.slice(0, backupFiles.length - 5);

        for (const file of filesToDelete) {
          await fs.unlink(path.join(BACKUP_PATH, file));
          logger.info(`Old header backup deleted: ${file}`);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to cleanup old header backups: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 버전 생성
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getDate().toString().padStart(2, "0")}.${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  }
}

// 전역 인스턴스
export const headerManager = new HeaderManager();
