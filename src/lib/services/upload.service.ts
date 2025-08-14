import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'
import sharp from 'sharp'
import { put } from '@vercel/blob'

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
      console.log('Upload directory ensured:', this.uploadDir)
    } catch (error) {
      console.error('Upload directory creation failed:', {
        uploadDir: this.uploadDir,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cwd: process.cwd()
      })
      // Vercel 환경에서는 임시 디렉토리 사용
      if (process.env.VERCEL) {
        console.log('Vercel environment detected, files will be processed in memory only')
      }
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
    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      subfolder: subfolder,
      options: options
    })

    try {
      if (!file || !file.size) {
        throw new Error('유효하지 않은 파일입니다.')
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 파일명 생성 (timestamp + random)
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const extension = file.name.split('.').pop()?.toLowerCase()
      
      if (!extension) {
        throw new Error('파일 확장자를 찾을 수 없습니다.')
      }
      
      const filename = `${timestamp}_${randomString}.${extension}`

      console.log('Generated filename:', filename)

      // 업로드 경로 설정
      const uploadPath = subfolder 
        ? join(this.uploadDir, subfolder)
        : this.uploadDir

      console.log('Upload path:', uploadPath)

      // Vercel 환경에서는 디렉토리 생성 시도하지 않음
      if (!process.env.VERCEL) {
        try {
          await mkdir(uploadPath, { recursive: true })
        } catch (mkdirError) {
          console.error('Directory creation failed:', {
            uploadPath,
            error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
          })
        }
      }

      let processedBuffer: Buffer = buffer

      // 이미지 파일인 경우 리사이징 처리
      if (this.isImageFile(file.type)) {
        console.log('Processing image file...')
        processedBuffer = await this.resizeImage(buffer, options) as Buffer
        console.log('Image processed, size:', processedBuffer.length)
      }

      // Vercel 환경에서는 Vercel Blob Storage 사용
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.log('Production environment: using Vercel Blob Storage')
        
        try {
          // Vercel Blob Storage에 업로드
          const blobPath = subfolder ? `${subfolder}/${filename}` : filename
          
          console.log('Uploading to Vercel Blob:', {
            path: blobPath,
            contentType: file.type,
            size: processedBuffer.length
          })

          const blob = await put(blobPath, processedBuffer, {
            access: 'public',
            contentType: file.type,
            token: process.env.BLOB_READ_WRITE_TOKEN
          })

          console.log('Vercel Blob upload successful:', {
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType,
            size: blob.size
          })

          return {
            url: blob.url,
            filename,
            size: processedBuffer.length,
            type: file.type
          }
        } catch (blobError) {
          console.error('Vercel Blob Storage error:', {
            error: blobError instanceof Error ? blobError.message : String(blobError),
            stack: blobError instanceof Error ? blobError.stack : undefined
          })
          
          // 최종 폴백: Base64 데이터 URL (이미지만)
          if (this.isImageFile(file.type)) {
            console.log('Final fallback: using Base64 data URL')
            const base64 = processedBuffer.toString('base64')
            const dataUrl = `data:${file.type};base64,${base64}`
            
            return {
              url: dataUrl,
              filename,
              size: processedBuffer.length,
              type: file.type
            }
          }
          
          throw new Error(`Vercel Blob Storage 업로드 실패: ${blobError instanceof Error ? blobError.message : '알 수 없는 오류'}`)
        }
      }

      // 로컬 환경에서는 파일 저장
      const filePath = join(uploadPath, filename)
      await writeFile(filePath, processedBuffer)

      console.log('File saved successfully:', filePath)

      // URL 생성
      const url = subfolder 
        ? `/uploads/${subfolder}/${filename}`
        : `/uploads/${filename}`

      const result = {
        url,
        filename,
        size: processedBuffer.length,
        type: file.type
      }

      console.log('Upload completed:', result)

      return result
    } catch (error) {
      console.error('File upload failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        subfolder: subfolder
      })
      throw new Error(`파일 업로드에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`)
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