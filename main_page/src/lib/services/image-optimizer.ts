/**
 * 이미지 최적화 서비스
 * Sharp를 사용한 이미지 리사이징, 압축, 포맷 변환
 */

import sharp from 'sharp';
import { logger } from '@/lib/logger/production';
import { AppError, ErrorType } from '@/lib/error-handler';
import path from 'path';
import fs from 'fs/promises';

// 이미지 최적화 옵션
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
  progressive?: boolean;
  mozjpeg?: boolean;
}

// 프리셋 설정
export const ImagePresets = {
  thumbnail: {
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  small: {
    width: 400,
    quality: 85,
    format: 'webp' as const,
    withoutEnlargement: true,
  },
  medium: {
    width: 800,
    quality: 85,
    format: 'webp' as const,
    withoutEnlargement: true,
  },
  large: {
    width: 1200,
    quality: 90,
    format: 'webp' as const,
    withoutEnlargement: true,
  },
  full: {
    width: 1920,
    quality: 90,
    format: 'webp' as const,
    withoutEnlargement: true,
  },
  hero: {
    width: 1920,
    height: 600,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  product: {
    width: 800,
    height: 800,
    quality: 90,
    format: 'webp' as const,
    fit: 'contain' as const,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
} as const;

export type ImagePresetType = keyof typeof ImagePresets;

// 지원 형식
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'svg'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_DIMENSION = 4096; // 최대 4096px

export class ImageOptimizer {
  private static instance: ImageOptimizer;

  private constructor() {}

  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * 이미지 최적화
   */
  public async optimize(
    input: Buffer | string,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      // 기본 옵션 설정
      const opts = {
        quality: 85,
        format: 'webp' as const,
        withoutEnlargement: true,
        progressive: true,
        mozjpeg: true,
        ...options,
      };

      // Sharp 인스턴스 생성
      let pipeline = sharp(input);

      // 메타데이터 가져오기
      const metadata = await pipeline.metadata();
      
      // 파일 크기 체크
      if (metadata.size && metadata.size > MAX_FILE_SIZE) {
        throw new AppError(
          ErrorType.VALIDATION,
          `이미지 크기가 너무 큽니다 (최대 ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          400
        );
      }

      // 크기 체크
      if (metadata.width && metadata.width > MAX_DIMENSION) {
        opts.width = Math.min(opts.width || MAX_DIMENSION, MAX_DIMENSION);
      }
      if (metadata.height && metadata.height > MAX_DIMENSION) {
        opts.height = Math.min(opts.height || MAX_DIMENSION, MAX_DIMENSION);
      }

      // 자동 회전 (EXIF 데이터 기반)
      pipeline = pipeline.rotate();

      // 리사이징
      if (opts.width || opts.height) {
        pipeline = pipeline.resize({
          width: opts.width,
          height: opts.height,
          fit: opts.fit || 'inside',
          withoutEnlargement: opts.withoutEnlargement,
        });
      }

      // 포맷 변환 및 압축
      switch (opts.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: opts.quality,
            progressive: opts.progressive,
            mozjpeg: opts.mozjpeg,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: opts.quality,
            progressive: opts.progressive,
            compressionLevel: 9,
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: opts.quality,
            lossless: false,
            nearLossless: false,
            smartSubsample: true,
            effort: 4,
          });
          break;
        case 'avif':
          pipeline = pipeline.avif({
            quality: opts.quality,
            lossless: false,
            effort: 4,
          });
          break;
      }

      // 최적화 실행
      const output = await pipeline.toBuffer();

      const duration = Date.now() - startTime;
      logger.debug('Image optimized', {
        originalSize: metadata.size,
        optimizedSize: output.length,
        reduction: metadata.size ? 
          `${Math.round((1 - output.length / metadata.size) * 100)}%` : 'N/A',
        duration,
        format: opts.format,
        dimensions: `${opts.width || metadata.width}x${opts.height || metadata.height}`,
      });

      return output;
    } catch (error) {
      logger.error('Image optimization failed', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        ErrorType.INTERNAL,
        '이미지 최적화 중 오류가 발생했습니다',
        500,
        'IMAGE_OPTIMIZATION_ERROR',
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  /**
   * 프리셋 기반 최적화
   */
  public async optimizeWithPreset(
    input: Buffer | string,
    preset: ImagePresetType
  ): Promise<Buffer> {
    const options = ImagePresets[preset];
    return this.optimize(input, options);
  }

  /**
   * 다중 크기 생성 (반응형 이미지)
   */
  public async generateResponsiveImages(
    input: Buffer | string,
    sizes: number[] = [400, 800, 1200, 1920]
  ): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>();
    
    for (const width of sizes) {
      try {
        const optimized = await this.optimize(input, {
          width,
          quality: width <= 400 ? 80 : 85,
          format: 'webp',
          withoutEnlargement: true,
        });
        results.set(width, optimized);
      } catch (error) {
        logger.warn(`Failed to generate ${width}px image`, { error });
      }
    }
    
    return results;
  }

  /**
   * 이미지 메타데이터 추출
   */
  public async getMetadata(input: Buffer | string): Promise<sharp.Metadata> {
    try {
      return await sharp(input).metadata();
    } catch (error) {
      throw new AppError(
        ErrorType.VALIDATION,
        '이미지 메타데이터를 읽을 수 없습니다',
        400,
        'INVALID_IMAGE',
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  /**
   * 이미지 검증
   */
  public async validate(
    input: Buffer | string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      maxSize?: number;
      allowedFormats?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(input);
      
      // 포맷 검증
      if (options.allowedFormats && metadata.format) {
        if (!options.allowedFormats.includes(metadata.format)) {
          throw new AppError(
            ErrorType.VALIDATION,
            `지원하지 않는 이미지 형식입니다: ${metadata.format}`,
            400,
            'UNSUPPORTED_FORMAT'
          );
        }
      }
      
      // 크기 검증
      if (options.maxWidth && metadata.width && metadata.width > options.maxWidth) {
        throw new AppError(
          ErrorType.VALIDATION,
          `이미지 너비가 너무 큽니다 (최대 ${options.maxWidth}px)`,
          400,
          'IMAGE_TOO_WIDE'
        );
      }
      
      if (options.maxHeight && metadata.height && metadata.height > options.maxHeight) {
        throw new AppError(
          ErrorType.VALIDATION,
          `이미지 높이가 너무 큽니다 (최대 ${options.maxHeight}px)`,
          400,
          'IMAGE_TOO_TALL'
        );
      }
      
      if (options.maxSize && metadata.size && metadata.size > options.maxSize) {
        throw new AppError(
          ErrorType.VALIDATION,
          `파일 크기가 너무 큽니다 (최대 ${options.maxSize / 1024 / 1024}MB)`,
          400,
          'FILE_TOO_LARGE'
        );
      }
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        ErrorType.VALIDATION,
        '유효하지 않은 이미지 파일입니다',
        400,
        'INVALID_IMAGE'
      );
    }
  }

  /**
   * 워터마크 추가
   */
  public async addWatermark(
    input: Buffer | string,
    watermark: Buffer | string,
    position: 'center' | 'southeast' | 'southwest' | 'northeast' | 'northwest' = 'southeast'
  ): Promise<Buffer> {
    try {
      const gravity = position === 'center' ? 'center' : position;
      
      return await sharp(input)
        .composite([
          {
            input: watermark,
            gravity,
            blend: 'over',
          },
        ])
        .toBuffer();
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        '워터마크 추가 중 오류가 발생했습니다',
        500,
        'WATERMARK_ERROR',
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  /**
   * 썸네일 생성
   */
  public async generateThumbnail(
    input: Buffer | string,
    size: number = 200
  ): Promise<Buffer> {
    return this.optimize(input, {
      width: size,
      height: size,
      fit: 'cover',
      quality: 80,
      format: 'webp',
    });
  }
}

// 싱글톤 인스턴스 export
export const imageOptimizer = ImageOptimizer.getInstance();