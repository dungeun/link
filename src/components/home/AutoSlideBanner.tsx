"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  visible: boolean;
}

interface AutoSlideBannerProps {
  slides: BannerSlide[];
  interval?: number; // 자동 슬라이드 간격 (ms)
}

function AutoSlideBanner({ slides, interval = 5000 }: AutoSlideBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 표시할 슬라이드 필터링 - 메모이제이션
  const visibleSlides = useMemo(
    () => slides.filter((slide) => slide.visible),
    [slides],
  );

  // 자동 슬라이드 - currentSlide 제거하여 무한 재생성 방지
  useEffect(() => {
    if (isPaused || visibleSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % visibleSlides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, visibleSlides.length, interval]);

  // 슬라이드 이동 함수들 - 메모이제이션
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % visibleSlides.length);
  }, [visibleSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length,
    );
  }, [visibleSlides.length]);

  // 현재 슬라이드 데이터 - 메모이제이션
  const currentSlideData = useMemo(
    () => (visibleSlides.length > 0 ? visibleSlides[currentSlide] : null),
    [visibleSlides, currentSlide],
  );

  // 마우스 이벤트 핸들러 - 메모이제이션
  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  if (visibleSlides.length === 0) {
    return null;
  }

  return (
    <div
      className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden rounded-xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 배너 이미지 */}
      <div className="relative h-full w-full">
        {visibleSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
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
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/70"
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
  );
}

// BannerContent 컴포넌트 - 메모이제이션
const BannerContent = memo(({ slide }: { slide: BannerSlide }) => {
  return (
    <div className="relative h-full w-full">
      <Image
        src={slide.imageUrl || "/images/banner-placeholder.jpg"}
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
  );
});

BannerContent.displayName = "BannerContent";

// React.memo로 성능 최적화
export default memo(AutoSlideBanner);
