'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  label: string
  accept?: string
  maxSize?: number // MB
  dimensions?: {
    width?: number
    height?: number
    aspectRatio?: string
  }
  preview?: boolean
}

export default function ImageUpload({
  value,
  onChange,
  label,
  accept = 'image/*',
  maxSize = 5,
  dimensions,
  preview = true
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }

    // 파일 크기 검증
    if (file.size > maxSize * 1024 * 1024) {
      setError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`)
      return
    }

    setUploading(true)

    try {
      // 이미지 리사이즈 및 최적화
      const optimizedImage = await processImage(file, dimensions)
      onChange(optimizedImage)
    } catch (err) {
      setError('이미지 업로드에 실패했습니다.')
      console.error('Image upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const processImage = (file: File, dimensions?: ImageUploadProps['dimensions']): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          let { width, height } = img

          // 크기 조정 로직
          if (dimensions?.width && dimensions?.height) {
            // 정확한 크기 지정
            width = dimensions.width
            height = dimensions.height
          } else if (dimensions?.width) {
            // 너비 기준으로 비율 유지
            const ratio = dimensions.width / width
            width = dimensions.width
            height = height * ratio
          } else if (dimensions?.height) {
            // 높이 기준으로 비율 유지
            const ratio = dimensions.height / height
            height = dimensions.height
            width = width * ratio
          } else {
            // 최대 크기 제한 (1024px)
            const maxDimension = 1024
            if (width > maxDimension || height > maxDimension) {
              const ratio = Math.min(maxDimension / width, maxDimension / height)
              width = width * ratio
              height = height * ratio
            }
          }

          canvas.width = width
          canvas.height = height

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height)
          
          // Base64로 변환
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(dataUrl)
        }
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsDataURL(file)
    })
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError('')
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="space-y-2">
        {/* 업로드 영역 */}
        <div 
          onClick={handleClick}
          className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {value && preview ? (
            <div className="relative">
              <img 
                src={value} 
                alt={label}
                className="max-w-full max-h-32 mx-auto rounded"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    클릭하여 이미지 업로드
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {accept === 'image/*' ? 'JPG, PNG, GIF' : accept} (최대 {maxSize}MB)
                  </p>
                  {dimensions && (
                    <p className="text-xs text-gray-500">
                      {dimensions.width && dimensions.height 
                        ? `권장 크기: ${dimensions.width}x${dimensions.height}px`
                        : dimensions.aspectRatio 
                        ? `권장 비율: ${dimensions.aspectRatio}`
                        : ''
                      }
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {/* 현재 이미지가 있고 미리보기가 비활성화된 경우 */}
        {value && !preview && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">이미지 업로드됨</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              제거
            </button>
          </div>
        )}
      </div>
    </div>
  )
}