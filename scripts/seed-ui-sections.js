const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUISections() {
  try {
    console.log('🌱 Starting UISection seeding...');

    const sections = [
      {
        sectionId: 'hero',
        type: 'hero',
        title: null,
        subtitle: null,
        order: 1,
        visible: true,
        content: {
          slides: [
            {
              id: '1',
              title: '인플루언서와 브랜드를\n연결하는 가장 쉬운 방법',
              subtitle: '리뷰와 함께 성장의 기회를 만나보세요',
              tag: '🎯 NEW',
              bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-600',
              backgroundImage: null,
              link: '/campaigns'
            },
            {
              id: '2',
              title: '최대 30% 할인\n첫 캠페인 특별 혜택',
              subtitle: '지금 시작하고 특별한 혜택을 받아보세요',
              tag: '💎 EVENT',
              bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
              backgroundImage: null,
              link: '/business/pricing'
            }
          ]
        },
        translations: {
          en: {
            slides: [
              {
                id: '1',
                title: 'The easiest way to connect\ninfluencers and brands',
                subtitle: 'Discover growth opportunities with Revu',
                tag: '🎯 NEW',
                bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-600',
                backgroundImage: null,
                link: '/campaigns'
              },
              {
                id: '2',
                title: 'Up to 30% off\nSpecial offer for first campaign',
                subtitle: 'Start now and get special benefits',
                tag: '💎 EVENT',
                bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
                backgroundImage: null,
                link: '/business/pricing'
              }
            ]
          },
          jp: {
            slides: [
              {
                id: '1',
                title: 'インフルエンサーとブランドを\nつなぐ最も簡単な方法',
                subtitle: 'Revuと一緒に成長の機会を見つけてください',
                tag: '🎯 NEW',
                bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-600',
                backgroundImage: null,
                link: '/campaigns'
              },
              {
                id: '2',
                title: '最大30％割引\n初回キャンペーン特別特典',
                subtitle: '今すぐ始めて特別な特典を受け取りましょう',
                tag: '💎 EVENT',
                bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-600',
                backgroundImage: null,
                link: '/business/pricing'
              }
            ]
          }
        }
      },
      {
        sectionId: 'category',
        type: 'category',
        title: '카테고리별 캠페인',
        subtitle: '관심 분야의 캠페인을 찾아보세요',
        order: 2,
        visible: true,
        content: {
          categories: [
            { id: 'beauty', name: '뷰티', categoryId: 'beauty', icon: null, badge: 'HOT', visible: true },
            { id: 'fashion', name: '패션', categoryId: 'fashion', icon: null, badge: null, visible: true },
            { id: 'food', name: '맛집', categoryId: 'food', icon: null, badge: null, visible: true },
            { id: 'travel', name: '여행', categoryId: 'travel', icon: null, badge: null, visible: true },
            { id: 'tech', name: 'IT/테크', categoryId: 'tech', icon: null, badge: '신규', visible: true },
            { id: 'fitness', name: '운동/헬스', categoryId: 'fitness', icon: null, badge: null, visible: true },
            { id: 'lifestyle', name: '라이프', categoryId: 'lifestyle', icon: null, badge: null, visible: true },
            { id: 'pet', name: '반려동물', categoryId: 'pet', icon: null, badge: null, visible: true },
            { id: 'parenting', name: '육아', categoryId: 'parenting', icon: null, badge: null, visible: true },
            { id: 'game', name: '게임', categoryId: 'game', icon: null, badge: null, visible: true },
            { id: 'education', name: '교육', categoryId: 'education', icon: null, badge: null, visible: true }
          ]
        },
        translations: {
          en: {
            title: 'Campaigns by Category',
            subtitle: 'Find campaigns in your area of interest',
            categories: [
              { id: 'beauty', name: 'Beauty', categoryId: 'beauty', icon: null, badge: 'HOT', visible: true },
              { id: 'fashion', name: 'Fashion', categoryId: 'fashion', icon: null, badge: null, visible: true },
              { id: 'food', name: 'Food', categoryId: 'food', icon: null, badge: null, visible: true },
              { id: 'travel', name: 'Travel', categoryId: 'travel', icon: null, badge: null, visible: true },
              { id: 'tech', name: 'IT/Tech', categoryId: 'tech', icon: null, badge: 'NEW', visible: true },
              { id: 'fitness', name: 'Fitness', categoryId: 'fitness', icon: null, badge: null, visible: true },
              { id: 'lifestyle', name: 'Lifestyle', categoryId: 'lifestyle', icon: null, badge: null, visible: true },
              { id: 'pet', name: 'Pet', categoryId: 'pet', icon: null, badge: null, visible: true },
              { id: 'parenting', name: 'Parenting', categoryId: 'parenting', icon: null, badge: null, visible: true },
              { id: 'game', name: 'Gaming', categoryId: 'game', icon: null, badge: null, visible: true },
              { id: 'education', name: 'Education', categoryId: 'education', icon: null, badge: null, visible: true }
            ]
          },
          jp: {
            title: 'カテゴリー別キャンペーン',
            subtitle: '興味のある分野のキャンペーンを見つけてください',
            categories: [
              { id: 'beauty', name: 'ビューティー', categoryId: 'beauty', icon: null, badge: 'HOT', visible: true },
              { id: 'fashion', name: 'ファッション', categoryId: 'fashion', icon: null, badge: null, visible: true },
              { id: 'food', name: 'グルメ', categoryId: 'food', icon: null, badge: null, visible: true },
              { id: 'travel', name: '旅行', categoryId: 'travel', icon: null, badge: null, visible: true },
              { id: 'tech', name: 'IT/テック', categoryId: 'tech', icon: null, badge: '新規', visible: true },
              { id: 'fitness', name: 'フィットネス', categoryId: 'fitness', icon: null, badge: null, visible: true },
              { id: 'lifestyle', name: 'ライフスタイル', categoryId: 'lifestyle', icon: null, badge: null, visible: true },
              { id: 'pet', name: 'ペット', categoryId: 'pet', icon: null, badge: null, visible: true },
              { id: 'parenting', name: '育児', categoryId: 'parenting', icon: null, badge: null, visible: true },
              { id: 'game', name: 'ゲーム', categoryId: 'game', icon: null, badge: null, visible: true },
              { id: 'education', name: '教育', categoryId: 'education', icon: null, badge: null, visible: true }
            ]
          }
        }
      },
      {
        sectionId: 'quicklinks',
        type: 'quicklinks',
        title: null,
        subtitle: null,
        order: 3,
        visible: true,
        content: {
          links: [
            { id: '1', title: '🎁 첫 캠페인 30% 할인', link: '/business/pricing', icon: '🎁', visible: true },
            { id: '2', title: '📚 캠페인 가이드', link: '/guide', icon: '📚', visible: true },
            { id: '3', title: '💬 실시간 상담', link: '/support', icon: '💬', visible: true }
          ]
        },
        translations: {
          en: {
            links: [
              { id: '1', title: '🎁 30% off first campaign', link: '/business/pricing', icon: '🎁', visible: true },
              { id: '2', title: '📚 Campaign Guide', link: '/guide', icon: '📚', visible: true },
              { id: '3', title: '💬 Live Chat', link: '/support', icon: '💬', visible: true }
            ]
          },
          jp: {
            links: [
              { id: '1', title: '🎁 初回キャンペーン30％オフ', link: '/business/pricing', icon: '🎁', visible: true },
              { id: '2', title: '📚 キャンペーンガイド', link: '/guide', icon: '📚', visible: true },
              { id: '3', title: '💬 リアルタイム相談', link: '/support', icon: '💬', visible: true }
            ]
          }
        }
      },
      {
        sectionId: 'promo',
        type: 'promo',
        title: '🚀 지금 시작하세요!',
        subtitle: '첫 캠페인은 수수료 50% 할인',
        order: 4,
        visible: true,
        content: {
          banner: {
            title: '🚀 지금 시작하세요!',
            subtitle: '첫 캠페인은 수수료 50% 할인',
            backgroundColor: '#FEF3C7',
            backgroundImage: null,
            link: '/business/register',
            icon: '🎯'
          }
        },
        translations: {
          en: {
            title: '🚀 Start Now!',
            subtitle: '50% off commission for your first campaign',
            banner: {
              title: '🚀 Start Now!',
              subtitle: '50% off commission for your first campaign'
            }
          },
          jp: {
            title: '🚀 今すぐ始めましょう！',
            subtitle: '初回キャンペーンは手数料50％割引',
            banner: {
              title: '🚀 今すぐ始めましょう！',
              subtitle: '初回キャンペーンは手数料50％割引'
            }
          }
        }
      },
      {
        sectionId: 'ranking',
        type: 'ranking',
        title: '인기 랭킹',
        subtitle: '실시간 인기 캠페인',
        order: 5,
        visible: true,
        settings: {
          count: 5,
          criteria: 'popular', // popular, deadline, reward, participants
          showBadge: true
        },
        translations: {
          en: {
            title: 'Popular Rankings',
            subtitle: 'Real-time popular campaigns'
          },
          jp: {
            title: '人気ランキング',
            subtitle: 'リアルタイム人気キャンペーン'
          }
        }
      },
      {
        sectionId: 'recommended',
        type: 'recommended',
        title: '추천 캠페인',
        subtitle: '당신을 위한 맞춤 추천',
        order: 6,
        visible: true,
        settings: {
          count: 4,
          algorithm: 'personalized' // personalized, trending, new
        },
        translations: {
          en: {
            title: 'Recommended Campaigns',
            subtitle: 'Personalized recommendations for you'
          },
          jp: {
            title: 'おすすめキャンペーン',
            subtitle: 'あなたのための厳選おすすめ'
          }
        }
      },
      {
        sectionId: 'bottom_cta',
        type: 'cta',
        title: '지금 바로 시작하세요',
        subtitle: '5분이면 충분합니다. 복잡한 절차 없이 바로 시작할 수 있어요.',
        order: 7,
        visible: true,
        content: {
          buttons: [
            { text: '브랜드로 시작하기', link: '/register?type=business', style: 'primary' },
            { text: '인플루언서로 시작하기', link: '/register?type=influencer', style: 'secondary' }
          ]
        },
        translations: {
          en: {
            title: 'Start Right Now',
            subtitle: '5 minutes is enough. You can start right away without complicated procedures.',
            buttons: [
              { text: 'Start as Brand' },
              { text: 'Start as Influencer' }
            ]
          },
          jp: {
            title: '今すぐ始めましょう',
            subtitle: '5分で十分です。複雑な手続きなしですぐに始められます。',
            buttons: [
              { text: 'ブランドとして開始' },
              { text: 'インフルエンサーとして開始' }
            ]
          }
        }
      }
    ];

    // 기존 데이터 삭제
    await prisma.uISection.deleteMany({});
    console.log('✅ Cleared existing UI sections');

    // 새 데이터 삽입
    for (const section of sections) {
      await prisma.uISection.create({
        data: section
      });
      console.log(`✅ Created section: ${section.sectionId}`);
    }

    console.log('✅ UISection seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding UI sections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUISections();