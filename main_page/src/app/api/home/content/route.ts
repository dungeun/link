import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'faq' 또는 'testimonials'

    if (type === 'faq') {
      // FAQ 데이터 조회
      const faqs = await prisma.siteConfig.findMany({
        where: {
          key: {
            startsWith: 'faq_'
          }
        },
        orderBy: {
          key: 'asc'
        }
      });

      const faqItems = faqs.map(faq => {
        try {
          const data = JSON.parse(faq.value);
          return {
            question: data.question,
            answer: data.answer,
            order: data.order || 0
          };
        } catch {
          return null;
        }
      }).filter(Boolean).sort((a, b) => a.order - b.order);

      // FAQ가 없으면 기본 FAQ 반환
      if (faqItems.length === 0) {
        const defaultFaq = [
          {
            question: "LinkPick는 어떤 서비스인가요?",
            answer: "LinkPick는 브랜드와 인플루언서를 연결하는 AI 기반 마케팅 플랫폼입니다. 정밀한 매칭 알고리즘으로 최적의 파트너를 찾아드립니다.",
            order: 1
          },
          {
            question: "수수료는 얼마인가요?",
            answer: "캠페인 성공 시에만 거래액의 10%를 수수료로 받습니다. 회원가입과 플랫폼 이용은 무료입니다.",
            order: 2
          },
          {
            question: "어떤 카테고리의 인플루언서가 있나요?",
            answer: "패션, 뷰티, 푸드, 여행, 테크, 게임 등 20개 이상의 카테고리에서 다양한 인플루언서가 활동하고 있습니다.",
            order: 3
          },
          {
            question: "캠페인 진행 과정은 어떻게 되나요?",
            answer: "캠페인 등록 → 인플루언서 매칭 → 협의 및 계약 → 콘텐츠 제작 → 성과 측정의 5단계로 진행됩니다.",
            order: 4
          }
        ];
        
        return NextResponse.json({
          success: true,
          faq: defaultFaq
        });
      }

      return NextResponse.json({
        success: true,
        faq: faqItems
      });
    }

    if (type === 'testimonials') {
      // 성공 사례 데이터 조회 (실제 사용자 리뷰 기반)
      const testimonials = await prisma.siteConfig.findMany({
        where: {
          key: {
            startsWith: 'testimonial_'
          }
        },
        orderBy: {
          key: 'asc'
        }
      });

      const testimonialItems = testimonials.map(testimonial => {
        try {
          const data = JSON.parse(testimonial.value);
          return {
            name: data.name,
            role: data.role,
            content: data.content,
            rating: data.rating || 5,
            avatar: data.avatar,
            order: data.order || 0
          };
        } catch {
          return null;
        }
      }).filter(Boolean).sort((a, b) => a.order - b.order);

      // 기본 성공 사례가 없으면 기본값 반환
      if (testimonialItems.length === 0) {
        const defaultTestimonials = [
          {
            name: "뷰티브랜드 A",
            role: "코스메틱 브랜드",
            content: "LinkPick를 통해 우리 브랜드와 완벽하게 맞는 인플루언서를 찾았습니다. 캠페인 ROI가 320% 향상되었어요!",
            rating: 5,
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
            order: 1
          },
          {
            name: "@lifestyle_kim",
            role: "라이프스타일 인플루언서",
            content: "다양한 브랜드와 협업하면서 월 수익이 3배 늘었습니다. 투명한 정산 시스템이 정말 만족스러워요.",
            rating: 5,
            avatar: "https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=60&h=60&fit=crop&crop=face",
            order: 2
          },
          {
            name: "테크기업 B",
            role: "IT 스타트업",
            content: "신제품 런칭 캠페인에서 목표 대비 150% 달성! AI 매칭으로 정확한 타겟팅이 가능했습니다.",
            rating: 5,
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
            order: 3
          }
        ];

        return NextResponse.json({
          success: true,
          testimonials: defaultTestimonials
        });
      }

      return NextResponse.json({
        success: true,
        testimonials: testimonialItems
      });
    }

    // 모든 콘텐츠 반환
    const [faqResult, testimonialResult] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/home/content?type=faq`).then(r => r.json()),
      fetch(`${request.nextUrl.origin}/api/home/content?type=testimonials`).then(r => r.json())
    ]);

    return NextResponse.json({
      success: true,
      faq: faqResult.faq || [],
      testimonials: testimonialResult.testimonials || []
    });

  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}