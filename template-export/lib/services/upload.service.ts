import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

export interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

export interface ImageResizeOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export class UploadService {
  private uploadDir = join(process.cwd(), 'public', 'uploads')

  constructor() {
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true })
    } catch (error) {
      console.error('Upload directory creation failed:', error)
    }
  }

  /**
   * 파일 업로드 처리
   */
  async uploadFile(
    file: File,
    subfolder: string = '',
    options?: ImageResizeOptions
  ): Promise<UploadResult> {
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 파일명 생성 (timestamp + random)
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const extension = file.name.split('.').pop()?.toLowerCase()
      const filename = `${timestamp}_${randomString}.${extension}`

      // 업로드 경로 설정
      const uploadPath = subfolder 
        ? join(this.uploadDir, subfolder)
        : this.uploadDir

      await mkdir(uploadPath, { recursive: true })

      let processedBuffer: Buffer = buffer

      // 이미지 파일인 경우 리사이징 처리
      if (this.isImageFile(file.type)) {
        processedBuffer = await this.resizeImage(buffer, options) as Buffer
      }

      // 파일 저장
      const filePath = join(uploadPath, filename)
      await writeFile(filePath, processedBuffer)

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`

      return {
        url,
        filename,
        size: processedBuffer.length,
        type: file.type
      }
    } catch (error) {
      console.error('File upload failed:', error)
      throw new Error('파일 업로드에 실패했습니다.')
    }
  }

  /**
   * Base64 이미지 업로드 처리
   */
  async uploadBase64Image(
    base64Data: string,
    subfolder: string = '',
    options?: ImageResizeOptions
  ): Promise<UploadResult> {
    try {
      // Base64 데이터 파싱
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches) {
        throw new Error('Invalid base64 data')
      }

      const mimeType = matches[1]
      const buffer = Buffer.from(matches[2], 'base64')

      // 파일명 생성
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const extension = mimeType.split('/')[1] || 'jpg'
      const filename = `${timestamp}_${randomString}.${extension}`

      // 업로드 경로 설정
      const uploadPath = subfolder 
        ? join(this.uploadDir, subfolder)
        : this.uploadDir

      await mkdir(uploadPath, { recursive: true })

      let processedBuffer: Buffer = buffer

      // 이미지 리사이징 처리
      if (this.isImageMimeType(mimeType)) {
        processedBuffer = await this.resizeImage(buffer, options) as Buffer
      }

      // 파일 저장
      const filePath = join(uploadPath, filename)
      await writeFile(filePath, processedBuffer)

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`

      return {
        url,
        filename,
        size: processedBuffer.length,
        type: mimeType
      }
    } catch (error) {
      console.error('Base64 upload failed:', error)
      throw new Error('이미지 업로드에 실패했습니다.')
    }
  }

  /**
   * 이미지 리사이징
   */
  private async resizeImage(
    buffer: Buffer,
    options?: ImageResizeOptions
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer)

      // 리사이징 옵션 적용
      if (options?.width || options?.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: 'cover',
          position: 'center'
        })
      }

      // 포맷 변환
      if (options?.format) {
        switch (options.format) {
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg({ 
              quality: options.quality || 80 
            })
            break
          case 'png':
            sharpInstance = sharpInstance.png({ 
              quality: options.quality || 80 
            })
            break
          case 'webp':
            sharpInstance = sharpInstance.webp({ 
              quality: options.quality || 80 
            })
            break
        }
      }

      return await sharpInstance.toBuffer()
    } catch (error) {
      console.error('Image resize failed:', error)
      return buffer // 리사이징 실패 시 원본 반환
    }
  }

  /**
   * 이미지 파일 타입 체크
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * 이미지 MIME 타입 체크
   */
  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * FormData에서 파일 추출
   */
  async extractFileFromFormData(request: NextRequest): Promise<File | null> {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file || !file.size) {
        return null
      }

      return file
    } catch (error) {
      console.error('FormData extraction failed:', error)
      return null
    }
  }

  /**
   * 다중 파일 업로드
   */
  async uploadMultipleFiles(
    files: File[],
    subfolder: string = '',
    options?: ImageResizeOptions
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, subfolder, options)
        results.push(result)
      } catch (error) {
        console.error(`File upload failed for ${file.name}:`, error)
        // 개별 파일 실패는 무시하고 계속 진행
      }
    }

    return results
  }

  /**
   * 파일 크기 제한 체크
   */
  validateFileSize(file: File, maxSizeInMB: number = 15): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  /**
   * 허용된 파일 타입 체크
   */
  validateFileType(file: File, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean {
    return allowedTypes.includes(file.type)
  }
}

// 싱글톤 인스턴스
export const uploadService = new UploadService()