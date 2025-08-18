import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function createNewDemoAccounts() {
  console.log('Creating new demo accounts (3 admin, 5 client, 5 user)...')
  
  try {
    // 공통 비밀번호 해시 생성
    const adminPassword = await bcrypt.hash('admin2024', 10)
    const businessPassword = await bcrypt.hash('business2024', 10)
    const influencerPassword = await bcrypt.hash('influencer2024', 10)
    
    // 관리자 계정 3개 생성
    const adminAccounts = [
      {
        email: 'admin@linkpick.co.kr',
        name: 'Demo Admin',
        password: adminPassword
      },
      {
        email: 'manager@linkpick.co.kr', 
        name: 'Content Manager',
        password: adminPassword
      },
      {
        email: 'support@linkpick.co.kr',
        name: 'Customer Support',
        password: adminPassword
      }
    ]
    
    for (const admin of adminAccounts) {
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          password: admin.password,
          name: admin.name,
          type: 'ADMIN',
          status: 'ACTIVE',
          verified: true
        }
      })
      console.log(`✅ Admin created: ${user.email}`)
    }
    
    // 비즈니스 계정 5개 생성
    const businessAccounts = [
      {
        email: 'business@company.com',
        name: '테스트 비즈니스',
        companyName: '(주)테스트기업',
        businessNumber: '123-45-67890',
        representativeName: '홍길동',
        businessAddress: '서울시 강남구 테헤란로 123',
        businessCategory: '마케팅'
      },
      {
        email: 'beauty@cosmetics.co.kr',
        name: '뷰티 코스메틱',
        companyName: '(주)뷰티코스메틱',
        businessNumber: '234-56-78901',
        representativeName: '김미영',
        businessAddress: '서울시 강남구 압구정로 456',
        businessCategory: '화장품'
      },
      {
        email: 'fashion@style.com',
        name: '패션 스타일',
        companyName: '패션스타일(주)',
        businessNumber: '345-67-89012',
        representativeName: '이수진',
        businessAddress: '서울시 강남구 신사동 789',
        businessCategory: '패션'
      },
      {
        email: 'food@restaurant.kr',
        name: '맛집 레스토랑',
        companyName: '(주)맛집레스토랑',
        businessNumber: '456-78-90123',
        representativeName: '박요리',
        businessAddress: '서울시 강남구 역삼동 321',
        businessCategory: '음식점'
      },
      {
        email: 'tech@startup.io',
        name: '테크 스타트업',
        companyName: '테크스타트업(주)',
        businessNumber: '567-89-01234',
        representativeName: '최개발',
        businessAddress: '서울시 강남구 삼성동 654',
        businessCategory: 'IT'
      }
    ]
    
    for (const business of businessAccounts) {
      const user = await prisma.user.create({
        data: {
          email: business.email,
          password: businessPassword,
          name: business.name,
          type: 'BUSINESS',
          status: 'ACTIVE',
          verified: true,
          businessProfile: {
            create: {
              companyName: business.companyName,
              businessNumber: business.businessNumber,
              representativeName: business.representativeName,
              businessAddress: business.businessAddress,
              businessCategory: business.businessCategory,
              isVerified: true
            }
          }
        },
        include: {
          businessProfile: true
        }
      })
      console.log(`✅ Business created: ${user.email}`)
    }
    
    // 인플루언서 계정 5개 생성
    const influencerAccounts = [
      {
        email: 'influencer@example.com',
        name: 'Myron Legros-O\'Kon',
        bio: '뷰티 & 라이프스타일 인플루언서',
        instagram: '@myron_beauty',
        instagramFollowers: 85000,
        categories: ['뷰티', '라이프스타일']
      },
      {
        email: 'beauty@guru.com',
        name: '뷰티구루민지',
        bio: 'K-뷰티 전문 인플루언서',
        instagram: '@beauty_guru_minji',
        instagramFollowers: 120000,
        categories: ['뷰티', 'K-뷰티']
      },
      {
        email: 'fashion@blogger.kr',
        name: '패션블로거수연',
        bio: '패션 & 스타일링 전문가',
        instagram: '@fashion_suyeon',
        instagramFollowers: 95000,
        categories: ['패션', '스타일링']
      },
      {
        email: 'lifestyle@vlogger.com',
        name: '라이프스타일지현',
        bio: '일상과 여행을 기록하는 브이로거',
        instagram: '@lifestyle_jihyun',
        instagramFollowers: 75000,
        categories: ['라이프스타일', '여행']
      },
      {
        email: 'food@reviewer.kr',
        name: '푸드리뷰어준호',
        bio: '맛집 탐방 전문 인플루언서',
        instagram: '@food_junho',
        instagramFollowers: 110000,
        categories: ['음식', '맛집']
      }
    ]
    
    for (const influencer of influencerAccounts) {
      const user = await prisma.user.create({
        data: {
          email: influencer.email,
          password: influencerPassword,
          name: influencer.name,
          type: 'INFLUENCER',
          status: 'ACTIVE',
          verified: true,
          profile: {
            create: {
              bio: influencer.bio,
              instagram: influencer.instagram,
              instagramFollowers: influencer.instagramFollowers,
              categories: JSON.stringify(influencer.categories),
              isVerified: true
            }
          }
        },
        include: {
          profile: true
        }
      })
      console.log(`✅ Influencer created: ${user.email}`)
    }
    
    console.log('\n🎉 New demo accounts created successfully!')
    console.log('\n📋 로그인 정보:')
    
    console.log('\n👨‍💼 관리자 계정 (admin2024):')
    adminAccounts.forEach(admin => {
      console.log(`- ${admin.name}: ${admin.email}`)
    })
    
    console.log('\n🏢 비즈니스 계정 (business2024):')
    businessAccounts.forEach(business => {
      console.log(`- ${business.name}: ${business.email}`)
    })
    
    console.log('\n👤 인플루언서 계정 (influencer2024):')
    influencerAccounts.forEach(influencer => {
      console.log(`- ${influencer.name}: ${influencer.email}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating new demo accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createNewDemoAccounts()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { createNewDemoAccounts }