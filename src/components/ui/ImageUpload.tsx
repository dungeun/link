'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from './Button'
import { Upload, X, ImageIcon } from 'lucide-react'

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
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentImages = Array.isArray(value) ? value : value ? [value] : []

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // 파일 개수 검증
    if (multiple && currentImages.length + files.length > maxFiles) {
      alert(`최대 ${maxFiles}개의 이미지만 업로드할 수 있습니다.`)
      return
    }

    if (!multiple && files.length > 1) {
      alert('하나의 이미지만 업로드할 수 있습니다.')
      return
    }

    // 파일 타입 및 크기 검증
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}`)
        return
      }

      if (file.size > maxSize * 1024 * 1024) {
        alert(`파일 크기가 너무 큽니다: ${file.name} (최대 ${maxSize}MB)`)
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', category)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          },
          body: formData
        })

        const result: UploadResponse = await response.json()

        if (result.success && result.imageUrl) {
          uploadedUrls.push(result.imageUrl)
        } else {
          throw new Error(result.error || '업로드 실패')
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
      alert(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 업로드 버튼 */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          disabled={disabled || isUploading || (multiple && currentImages.length >= maxFiles)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? '업로드 중...' : '이미지 선택'}
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
        <div className={`grid gap-4 ${multiple ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {currentImages.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`업로드된 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
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
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 도움말 텍스트 */}
      <div className="text-sm text-gray-500">
        <p>
          {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} 파일만 지원 
          (최대 {maxSize}MB)
        </p>
        {multiple && (
          <p>최대 {maxFiles}개까지 업로드 가능</p>
        )}
      </div>
    </div>
  )
}