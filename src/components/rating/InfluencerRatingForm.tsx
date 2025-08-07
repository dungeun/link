'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface RatingFormProps {
  influencerId: string
  campaignId: string
  onSubmit: (rating: RatingData) => void
}

interface RatingData {
  influencerId: string
  campaignId: string
  communicationScore: number
  qualityScore: number
  timelinessScore: number
  professionalismScore: number
  creativityScore: number
  reviewText: string
}

const ratingCategories = [
  {
    key: 'communicationScore',
    label: '소통',
    description: '응답 속도와 의사소통 능력'
  },
  {
    key: 'qualityScore',
    label: '품질',
    description: '콘텐츠의 퀄리티와 완성도'
  },
  {
    key: 'timelinessScore',
    label: '시간 준수',
    description: '마감일 준수 및 일정 관리'
  },
  {
    key: 'professionalismScore',
    label: '전문성',
    description: '프로페셔널한 업무 태도'
  },
  {
    key: 'creativityScore',
    label: '창의성',
    description: '독창적이고 창의적인 콘텐츠'
  }
]

export default function InfluencerRatingForm({
  influencerId,
  campaignId,
  onSubmit
}: RatingFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    communicationScore: 0,
    qualityScore: 0,
    timelinessScore: 0,
    professionalismScore: 0,
    creativityScore: 0
  })
  const [reviewText, setReviewText] = useState('')
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({})

  const handleRatingChange = (category: string, score: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: score
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 모든 항목이 평가되었는지 확인
    const allRated = Object.values(ratings).every(score => score > 0)
    if (!allRated) {
      alert('모든 평가 항목을 선택해주세요.')
      return
    }

    onSubmit({
      influencerId,
      campaignId,
      ...ratings,
      reviewText
    } as RatingData)
  }

  const calculateOverallScore = () => {
    const scores = Object.values(ratings)
    const validScores = scores.filter(s => s > 0)
    if (validScores.length === 0) return 0
    return (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          인플루언서 평가
        </h3>

        {/* 평가 항목들 */}
        <div className="space-y-4">
          {ratingCategories.map((category) => (
            <div key={category.key} className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {category.label}
                  </label>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleRatingChange(category.key, score)}
                      onMouseEnter={() => setHoveredRating({ ...hoveredRating, [category.key]: score })}
                      onMouseLeave={() => setHoveredRating({ ...hoveredRating, [category.key]: 0 })}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          score <= (hoveredRating[category.key] || ratings[category.key])
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600 min-w-[2rem]">
                    {ratings[category.key] || '-'}/5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 종합 평점 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">종합 평점</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    className={`w-6 h-6 ${
                      score <= Math.round(Number(calculateOverallScore()))
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xl font-bold text-gray-900">
                {calculateOverallScore()}
              </span>
            </div>
          </div>
        </div>

        {/* 텍스트 리뷰 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상세 리뷰
            <span className="text-xs text-gray-500 ml-2">(선택사항)</span>
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="인플루언서와의 협업 경험을 자세히 작성해주세요..."
          />
        </div>

        {/* 제출 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            평가 제출
          </button>
        </div>
      </div>
    </form>
  )
}