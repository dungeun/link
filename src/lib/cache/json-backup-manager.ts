/**
 * JSON 백업 관리 시스템
 * - 기본 + 4단계 롤링 백업
 * - 어드민 변경 시 자동 백업 생성
 * - 데이터 손실 방지
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

export interface BackupMetadata {
  timestamp: string;
  version: string;
  dataType: string;
  size: number;
  checksum?: string;
}

export interface BackupOptions {
  maxBackups: number; // 기본 4개
  enableChecksum: boolean;
  compressionEnabled: boolean;
}

const DEFAULT_OPTIONS: BackupOptions = {
  maxBackups: 4,
  enableChecksum: false,
  compressionEnabled: false,
};

export class JsonBackupManager {
  private basePath: string;
  private options: BackupOptions;

  constructor(basePath: string, options: Partial<BackupOptions> = {}) {
    this.basePath = basePath;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 새 데이터를 저장하고 백업 생성
   */
  async saveWithBackup(
    fileName: string,
    data: any,
    dataType: string = "json",
  ): Promise<boolean> {
    try {
      // 디렉토리 생성
      await fs.mkdir(this.basePath, { recursive: true });

      const filePath = path.join(this.basePath, fileName);
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;

      // 1. 기존 백업들을 한 단계씩 뒤로 이동
      await this.rotateBackups(fileNameWithoutExt, fileExt);

      // 2. 현재 default 파일이 있으면 backup-1로 이동
      const defaultExists = await this.fileExists(filePath);
      if (defaultExists) {
        const backup1Path = path.join(
          this.basePath,
          `${fileNameWithoutExt}-backup-1${fileExt}`,
        );
        await fs.copyFile(filePath, backup1Path);
        logger.info(`Moved default to backup-1: ${fileName}`);
      }

      // 3. 새 데이터를 default로 저장
      const jsonData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          dataType,
          size: JSON.stringify(data).length,
        },
        data,
      };

      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
      logger.info(
        `Saved new data with backup: ${fileName} (${jsonData.metadata.size} bytes)`,
      );

      return true;
    } catch (error) {
      logger.error(
        `Failed to save with backup: ${fileName} - ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 백업 파일들을 한 단계씩 뒤로 회전
   */
  private async rotateBackups(
    fileNameWithoutExt: string,
    fileExt: string,
  ): Promise<void> {
    // backup-4 삭제 (가장 오래된 백업)
    const backup4Path = path.join(
      this.basePath,
      `${fileNameWithoutExt}-backup-4${fileExt}`,
    );
    if (await this.fileExists(backup4Path)) {
      await fs.unlink(backup4Path);
      logger.info(
        `Deleted oldest backup: ${fileNameWithoutExt}-backup-4${fileExt}`,
      );
    }

    // backup-3 → backup-4, backup-2 → backup-3, backup-1 → backup-2
    for (let i = 3; i >= 1; i--) {
      const currentPath = path.join(
        this.basePath,
        `${fileNameWithoutExt}-backup-${i}${fileExt}`,
      );
      const nextPath = path.join(
        this.basePath,
        `${fileNameWithoutExt}-backup-${i + 1}${fileExt}`,
      );

      if (await this.fileExists(currentPath)) {
        await fs.rename(currentPath, nextPath);
        logger.info(`Rotated backup: backup-${i} → backup-${i + 1}`);
      }
    }
  }

  /**
   * 백업에서 데이터 복구
   */
  async restoreFromBackup(
    fileName: string,
    backupLevel: number = 1,
  ): Promise<any | null> {
    try {
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;
      const backupPath = path.join(
        this.basePath,
        `${fileNameWithoutExt}-backup-${backupLevel}${fileExt}`,
      );

      if (!(await this.fileExists(backupPath))) {
        logger.warn(`Backup level ${backupLevel} not found: ${fileName}`);
        return null;
      }

      const backupContent = await fs.readFile(backupPath, "utf-8");
      const backupData = JSON.parse(backupContent);

      logger.info(`Restored from backup level ${backupLevel}: ${fileName}`);
      return backupData.data || backupData;
    } catch (error) {
      logger.error(
        `Failed to restore from backup: ${fileName} level ${backupLevel} - ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 백업 목록 조회
   */
  async listBackups(fileName: string): Promise<BackupMetadata[]> {
    try {
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;
      const backups: BackupMetadata[] = [];

      // default 파일 확인
      const defaultPath = path.join(this.basePath, fileName);
      if (await this.fileExists(defaultPath)) {
        const stats = await fs.stat(defaultPath);
        const content = await fs.readFile(defaultPath, "utf-8");
        const data = JSON.parse(content);

        backups.push({
          timestamp: data.metadata?.timestamp || stats.mtime.toISOString(),
          version: data.metadata?.version || "1.0.0",
          dataType: data.metadata?.dataType || "json",
          size: stats.size,
        });
      }

      // 백업 파일들 확인
      for (let i = 1; i <= this.options.maxBackups; i++) {
        const backupPath = path.join(
          this.basePath,
          `${fileNameWithoutExt}-backup-${i}${fileExt}`,
        );
        if (await this.fileExists(backupPath)) {
          const stats = await fs.stat(backupPath);
          const content = await fs.readFile(backupPath, "utf-8");
          const data = JSON.parse(content);

          backups.push({
            timestamp: data.metadata?.timestamp || stats.mtime.toISOString(),
            version: data.metadata?.version || "1.0.0",
            dataType: data.metadata?.dataType || "json",
            size: stats.size,
          });
        }
      }

      return backups;
    } catch (error) {
      logger.error(
        `Failed to list backups: ${fileName} - ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * 데이터 읽기 (default 파일 우선)
   */
  async loadData(fileName: string): Promise<any | null> {
    try {
      const filePath = path.join(this.basePath, fileName);

      if (!(await this.fileExists(filePath))) {
        logger.warn(`File not found: ${fileName}`);
        return null;
      }

      const content = await fs.readFile(filePath, "utf-8");
      const jsonData = JSON.parse(content);

      // metadata가 있으면 data 부분만 반환, 없으면 전체 반환
      return jsonData.data || jsonData;
    } catch (error) {
      logger.error(
        `Failed to load data: ${fileName} - ${error instanceof Error ? error.message : String(error)}`,
      );

      // 백업에서 복구 시도
      logger.info(`Attempting recovery from backup: ${fileName}`);
      return await this.restoreFromBackup(fileName, 1);
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 백업 무결성 검증
   */
  async verifyBackup(
    fileName: string,
    backupLevel: number = 0,
  ): Promise<boolean> {
    try {
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;

      const targetPath =
        backupLevel === 0
          ? path.join(this.basePath, fileName)
          : path.join(
              this.basePath,
              `${fileNameWithoutExt}-backup-${backupLevel}${fileExt}`,
            );

      if (!(await this.fileExists(targetPath))) {
        return false;
      }

      const content = await fs.readFile(targetPath, "utf-8");
      JSON.parse(content); // JSON 파싱 검증

      return true;
    } catch (error) {
      logger.error(
        `Backup verification failed: ${fileName} level ${backupLevel} - ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 백업 디렉토리 정리
   */
  async cleanupOldBackups(maxAge: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.basePath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      let deletedCount = 0;

      for (const file of files) {
        if (file.includes("-backup-")) {
          const filePath = path.join(this.basePath, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            logger.info(`Cleaned up old backup: ${file}`);
          }
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error(
        `Failed to cleanup old backups - ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}

// 전역 백업 매니저 인스턴스들
export const staticBackupManager = new JsonBackupManager(
  path.join(process.cwd(), "public/cache/static"),
  { maxBackups: 4, enableChecksum: false },
);

export const dynamicBackupManager = new JsonBackupManager(
  path.join(process.cwd(), "public/cache/dynamic"),
  { maxBackups: 4, enableChecksum: false },
);

export const i18nBackupManager = new JsonBackupManager(
  path.join(process.cwd(), "public/cache/static/i18n"),
  { maxBackups: 4, enableChecksum: false },
);
