import { useState } from 'react'
import Image from 'next/image'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Youtube } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StepMediaProps {
  formData: {
    headerImageUrl: string
    thumbnailImageUrl: string
    youtubeUrl: string
  }
  setFormData: (data: any) => void
  productImages: string[]
  setProductImages: (images: string[]) => void
}

// YouTube 동영상 ID 추출 함수
function extractYoutubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default function StepMedia({ formData, setFormData, productImages, setProductImages }: StepMediaProps) {
  const { toast } = useToast()

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지 및 미디어</h2>
      <div className="space-y-8">
        {/* 헤더 배경 이미지 */}
        <div>
          <Label htmlFor="headerImage">상세페이지 헤더 배경 이미지</Label>
          <div className="mt-2">
            <ImageUpload
              value={formData.headerImageUrl}
              onChange={(url) => {
                setFormData({...formData, headerImageUrl: url as string})
                toast({
                  title: '성공',
                  description: '헤더 배경 이미지가 업로드되었습니다.'
                })
              }}
              category="campaigns"
              maxSize={15}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              className="w-full"
              enableDragDrop={true}
              previewClassName="aspect-[3/1] max-h-48"
            />
            <p className="text-sm text-gray-500 mt-2">
              캠페인 상세 페이지 상단에 표시되는 대형 배경 이미지입니다. (권장: 1920x600px, 최대 15MB)
            </p>
          </div>
        </div>

        {/* 썸네일 이미지 */}
        <div>
          <Label htmlFor="thumbnailImage">썸네일 이미지</Label>
          <div className="mt-2 max-w-sm">
            <ImageUpload
              value={formData.thumbnailImageUrl}
              onChange={(url) => {
                setFormData({...formData, thumbnailImageUrl: url as string})
                toast({
                  title: '성공',
                  description: '썸네일 이미지가 업로드되었습니다.'
                })
              }}
              category="campaigns"
              maxSize={15}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              className="w-full aspect-[3/2]"
              enableDragDrop={true}
            />
            <p className="text-sm text-gray-500 mt-2">
              목록에서 표시되는 대표 이미지입니다. (권장: 600x400px, 최대 15MB)
            </p>
          </div>
        </div>

        {/* 상품소개 이미지 */}
        <div>
          <Label>상품소개 이미지 (3장)</Label>
          <div className="mt-2">
            <ImageUpload
              value={productImages.filter(img => img !== '')}
              onChange={(images) => {
                setProductImages(images as string[])
                // 새로 추가된 이미지만 토스트 표시
                const newImageCount = (images as string[]).filter(img => img).length
                const oldImageCount = productImages.filter(img => img).length
                if (newImageCount > oldImageCount) {
                  toast({
                    title: '성공',
                    description: `상품 이미지가 업로드되었습니다.`
                  })
                }
              }}
              multiple={true}
              maxFiles={3}
              category="campaigns"
              maxSize={15}
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              className="w-full"
              enableDragDrop={true}
              previewClassName="w-full aspect-auto"
            />
            <p className="text-sm text-gray-500 mt-2">
              상품을 소개하는 이미지 3장을 업로드해주세요. (권장: 800x800px, 최대 15MB)
            </p>
          </div>
        </div>

        {/* 유튜브 URL */}
        <div>
          <Label htmlFor="youtubeUrl">유튜브 영상 URL (선택)</Label>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Youtube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="youtubeUrl"
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({...formData, youtubeUrl: e.target.value})}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10"
              />
            </div>
            
            {/* 유튜브 미리보기 */}
            {formData.youtubeUrl && extractYoutubeVideoId(formData.youtubeUrl) && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeVideoId(formData.youtubeUrl)}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1`}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}