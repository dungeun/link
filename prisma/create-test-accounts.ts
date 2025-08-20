import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 E2E 테스트 계정 생성 중...')
  
  try {
    // 비즈니스 테스트 계정
    const businessEmail = 'business@test.com'
    let business = await prisma.user.findUnique({
      where: { email: businessEmail }
    })
    
    if (!business) {
      const businessPassword = await bcrypt.hash('password123', 10)
      business = await prisma.user.create({
        data: {
          email: businessEmail,
          password: businessPassword,
          name: 'Test Business',
          type: 'BUSINESS',
          status: 'ACTIVE',
          verified: true
        }
      })
      
      // 비즈니스 프로필 생성
      await prisma.businessProfile.create({
        data: {
          userId: business.id,
          companyName: 'Test Business Company',
          businessCategory: '테스트',
          businessNumber: '111-11-11111',
          representativeName: 'Test Representative',
          businessAddress: '서울특별시 강남구 테스트로 123'
        }
      })
      console.log('✅ 비즈니스 테스트 계정 생성 완료:', businessEmail)
    } else {
      console.log('ℹ️ 비즈니스 테스트 계정 이미 존재:', businessEmail)
    }
    
    // 인플루언서 테스트 계정
    const influencerEmail = 'influencer@test.com'
    let influencer = await prisma.user.findUnique({
      where: { email: influencerEmail }
    })
    
    if (!influencer) {
      const influencerPassword = await bcrypt.hash('password123', 10)
      influencer = await prisma.user.create({
        data: {
          email: influencerEmail,
          password: influencerPassword,
          name: 'Test Influencer',
          type: 'INFLUENCER',
          status: 'ACTIVE',
          verified: true
        }
      })
      
      // 인플루언서 프로필 생성
      await prisma.profile.create({
        data: {
          userId: influencer.id,
          bio: 'E2E 테스트용 인플루언서 계정입니다.',
          instagram: '@test_influencer',
          instagramFollowers: 10000,
          youtube: 'TestInfluencer',
          youtubeSubscribers: 5000,
          naverBlog: 'test_blog',
          naverBlogFollowers: 3000,
          naverBlogTodayVisitors: 100
        }
      })
      console.log('✅ 인플루언서 테스트 계정 생성 완료:', influencerEmail)
    } else {
      console.log('ℹ️ 인플루언서 테스트 계정 이미 존재:', influencerEmail)
    }
    
    // 관리자 테스트 계정
    const adminEmail = 'admin@test.com'
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (!admin) {
      const adminPassword = await bcrypt.hash('password123', 10)
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Test Admin',
          type: 'ADMIN',
          status: 'ACTIVE',
          verified: true
        }
      })
      console.log('✅ 관리자 테스트 계정 생성 완료:', adminEmail)
    } else {
      console.log('ℹ️ 관리자 테스트 계정 이미 존재:', adminEmail)
    }
    
    console.log('\n📋 E2E 테스트 계정 정보:')
    console.log('=====================================')
    console.log('비즈니스: business@test.com / password123')
    console.log('인플루언서: influencer@test.com / password123')
    console.log('관리자: admin@test.com / password123')
    console.log('=====================================')
    console.log('\n✅ 모든 테스트 계정이 준비되었습니다!')
    console.log('이제 E2E 테스트를 실행할 수 있습니다: npx playwright test tests/e2e')
    
  } catch (error) {
    console.error('❌ 테스트 계정 생성 중 오류:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })