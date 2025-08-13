'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerSlide {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  link?: string
  visible: boolean
}

interface AutoSlideBannerProps {
  slides: BannerSlide[]
  interval?: number // 자동 슬라이드 간격 (ms)
}

export default function AutoSlideBanner({ slides, interval = 5000 }: AutoSlideBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const visibleSlides = slides.filter(slide => slide.visible)

  // 자동 슬라이드
  useEffect(() => {
    if (isPaused || visibleSlides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % visibleSlides.length)
    }, interval)

    return () => clearInterval(timer)
  }, [currentSlide, isPaused, visibleSlides.length, interval])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % visibleSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length)
  }

  if (visibleSlides.length === 0) {
    return null
  }

  const currentSlideData = visibleSlides[currentSlide]

  return (
    <div 
      className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden rounded-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 배너 이미지 */}
      <div className="relative h-full w-full">
        {visibleSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide.link ? (
              <Link href={slide.link} className="block h-full w-full">
                <BannerContent slide={slide} />
              </Link>
            ) : (
              <BannerContent slide={slide} />
            )}
          </div>
        ))}
      </div>

      {/* 좌우 네비게이션 버튼 */}
      {visibleSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {visibleSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {visibleSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* 자동 슬라이드 프로그레스 바 */}
      {!isPaused && visibleSlides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-white/70 animate-slide-progress"
            style={{
              animationDuration: `${interval}ms`,
            }}
          />
        </div>
      )}
    </div>
  )
}

function BannerContent({ slide }: { slide: BannerSlide }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={slide.imageUrl || '/images/banner-placeholder.jpg'}
        alt={slide.title}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-lg sm:text-xl lg:text-2xl opacity-90">
            {slide.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}