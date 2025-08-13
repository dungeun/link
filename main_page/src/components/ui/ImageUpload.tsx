'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Button } from './Button'
import { Upload, X, ImageIcon, FileImage, AlertCircle } from 'lucide-react'

interface ImageUploadProps {
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  category?: 'campaigns' | 'users' | 'profiles' | 'temp'
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number // MB
  className?: string
  disabled?: boolean
  enableDragDrop?: boolean
  previewClassName?: string
}

interface UploadResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  category = 'temp',
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 5, // 5MB
  className = '',
  disabled = false,
  enableDragDrop = true,
  previewClassName = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragError, setDragError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentImages = Array.isArray(value) ? value : value ? [value] : []

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const processFiles = async (files: File[]) => {
    setDragError(null)
    console.log('Processing files:', files.length, 'files')
    
    // 파일 개수 검증
    if (multiple && currentImages.length + files.length > maxFiles) {
      setDragError(`최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`)
      return
    }

    if (!multiple && files.length > 1) {
      setDragError('하나의 이미지만 업로드할 수 있습니다.')
      return
    }

    // 파일 타입 및 크기 검증
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        setDragError(`지원하지 않는 파일 형식입니다: ${file.name}`)
        return
      }

      if (file.size > maxSize * 1024 * 1024) {
        setDragError(`파일 크기가 너무 큽니다: ${file.name} (최대 ${maxSize}MB)`)
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)
    console.log('Starting upload process...')

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', category === 'campaigns' ? 'campaign' : category)

        // 토큰 가져오기 (여러 가능성 확인)
        const token = localStorage.getItem('accessToken') || 
                     localStorage.getItem('auth-token') || 
                     localStorage.getItem('token') || ''

        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Upload API error:', { status: response.status, errorText })
          throw new Error(`업로드 실패 (${response.status}): ${errorText}`)
        }

        const result = await response.json()
        console.log('Upload API response:', result)

        // 다양한 응답 형식 처리
        let imageUrl: string | null = null
        
        if (result.success && result.data && result.data.url) {
          // 새로운 API 형식
          imageUrl = result.data.url
        } else if (result.url) {
          // 기존 API 형식
          imageUrl = result.url
        } else if (result.imageUrl) {
          // 또 다른 가능한 형식
          imageUrl = result.imageUrl
        }

        if (imageUrl) {
          uploadedUrls.push(imageUrl)
        } else {
          console.error('Invalid upload response:', result)
          throw new Error(result.error || result.message || '업로드 응답 형식이 올바르지 않습니다.')
        }

        setUploadProgress(((i + 1) / files.length) * 100)
      }

      // 결과 업데이트
      if (multiple) {
        const newImages = [...currentImages, ...uploadedUrls]
        onChange(newImages)
      } else {
        onChange(uploadedUrls[0])
      }

    } catch (error) {
      console.error('Upload error:', error)
      setDragError(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    await processFiles(files)
  }

  // Drag and drop functionality
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setDragError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`)
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setDragError('지원하지 않는 파일 형식입니다.')
      } else {
        setDragError('파일을 업로드할 수 없습니다.')
      }
      return
    }

    await processFiles(acceptedFiles)
  }, [acceptedTypes, maxSize, processFiles])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: multiple ? maxFiles - currentImages.length : 1,
    maxSize: maxSize * 1024 * 1024,
    disabled: disabled || isUploading || (multiple && currentImages.length >= maxFiles),
    onDragEnter: () => setDragError(null),
    noClick: !enableDragDrop
  })

  const handleRemoveImage = (indexOrUrl: number | string) => {
    if (multiple) {
      const newImages = currentImages.filter((_, index) => 
        typeof indexOrUrl === 'number' ? index !== indexOrUrl : _ !== indexOrUrl
      )
      onChange(newImages)
    } else {
      onChange('')
    }
  }

  const dropzoneProps = enableDragDrop ? getRootProps() : {}
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Area */}
      {enableDragDrop && currentImages.length === 0 && (
        <div
          {...dropzoneProps}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center space-y-3">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">업로드 중... {Math.round(uploadProgress)}%</p>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                {isDragActive ? (
                  <FileImage className="w-12 h-12 text-blue-500" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                )}
                
                <div className="space-y-1">
                  <p className="text-base font-medium text-gray-700">
                    {isDragActive ? "파일을 놓아주세요" : "이미지를 드래그하거나 클릭하세요"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} 파일 (최대 {maxSize}MB)
                  </p>
                  {multiple && (
                    <p className="text-sm text-gray-500">최대 {maxFiles}개까지 선택 가능</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Upload className="w-4 h-4" />
                  <span>클릭하여 파일 선택</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 기존 버튼 방식 (이미지가 있거나 드래그앤드롭이 비활성화된 경우) */}
      {(!enableDragDrop || currentImages.length > 0) && (
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleFileSelect}
            disabled={disabled || isUploading || (multiple && currentImages.length >= maxFiles)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? '업로드 중...' : multiple ? '이미지 추가' : '이미지 선택'}
          </Button>

          {isUploading && (
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 mt-1">{Math.round(uploadProgress)}%</span>
            </div>
          )}
        </div>
      )}

      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 이미지 미리보기 */}
      {currentImages.length > 0 && (
        <div className={`${multiple && !previewClassName ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}`}>
          {currentImages.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="relative group">
              <div className={`relative ${previewClassName || 'aspect-square'} rounded-lg overflow-hidden border-2 border-gray-200`}>
                {imageUrl ? (
                  previewClassName?.includes('aspect-auto') ? (
                    <img
                      src={imageUrl}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={`업로드된 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                {/* 삭제 버튼 */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className={`absolute ${previewClassName?.includes('aspect-auto') ? 'top-4 right-4' : 'top-2 right-2'} p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-lg`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {dragError && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4" />
          <span>{dragError}</span>
        </div>
      )}

      {/* 도움말 텍스트 */}
      {!enableDragDrop || currentImages.length > 0 ? (
        <div className="text-sm text-gray-500">
          <p>
            {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} 파일만 지원 
            (최대 {maxSize}MB)
          </p>
          {multiple && (
            <p>최대 {maxFiles}개까지 업로드 가능</p>
          )}
        </div>
      ) : null}
    </div>
  )
}