import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 데모 계정 확인 및 생성 중...')
  
  try {
    // 관리자 계정 확인/생성
    const adminEmail = 'admin@demo.com'
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (!admin) {
      const adminPassword = await bcrypt.hash('admin123!', 10)
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'LinkPick 관리자',
          type: 'ADMIN',
          status: 'ACTIVE',
          verified: true
        }
      })
      console.log('✅ 관리자 계정 생성 완료:', adminEmail)
    } else {
      console.log('ℹ️ 관리자 계정 이미 존재:', adminEmail)
    }
    
    // 인플루언서 계정 확인/생성
    const influencerEmail = '뷰티구루민지@demo.com'
    let influencer = await prisma.user.findUnique({
      where: { email: influencerEmail }
    })
    
    if (!influencer) {
      const influencerPassword = await bcrypt.hash('password123', 10)
      influencer = await prisma.user.create({
        data: {
          email: influencerEmail,
          password: influencerPassword,
          name: '뷰티구루민지',
          type: 'INFLUENCER',
          status: 'ACTIVE',
          verified: true
        }
      })
      
      // 프로필 생성
      await prisma.profile.create({
        data: {
          userId: influencer.id,
          bio: '뷰티와 라이프스타일 전문 인플루언서입니다.',
          instagram: '@beauty_minji',
          instagramFollowers: 50000,
          youtube: 'BeautyMinji',
          youtubeSubscribers: 30000
        }
      })
      console.log('✅ 인플루언서 계정 생성 완료:', influencerEmail)
    } else {
      console.log('ℹ️ 인플루언서 계정 이미 존재:', influencerEmail)
    }
    
    // 비즈니스 계정 확인/생성
    const businessEmail = 'CJ제일제당@demo.com'
    let business = await prisma.user.findUnique({
      where: { email: businessEmail }
    })
    
    if (!business) {
      const businessPassword = await bcrypt.hash('password123', 10)
      business = await prisma.user.create({
        data: {
          email: businessEmail,
          password: businessPassword,
          name: 'CJ제일제당',
          type: 'BUSINESS',
          status: 'ACTIVE',
          verified: true
        }
      })
      
      // 비즈니스 프로필 생성
      await prisma.businessProfile.create({
        data: {
          userId: business.id,
          companyName: 'CJ제일제당',
          businessCategory: '식품',
          businessNumber: '123-45-67890',
          representativeName: 'CJ 대표',
          businessAddress: '서울특별시 중구'
        }
      })
      console.log('✅ 비즈니스 계정 생성 완료:', businessEmail)
    } else {
      console.log('ℹ️ 비즈니스 계정 이미 존재:', businessEmail)
    }
    
    // 추가 데모 계정들 (영어 이메일)
    const demoAccounts = [
      { 
        email: 'influencer@demo.com', 
        password: 'password123', 
        name: 'Demo Influencer', 
        type: 'INFLUENCER' as const
      },
      { 
        email: 'business@demo.com', 
        password: 'password123', 
        name: 'Demo Business', 
        type: 'BUSINESS' as const
      }
    ]
    
    for (const account of demoAccounts) {
      let user = await prisma.user.findUnique({
        where: { email: account.email }
      })
      
      if (!user) {
        const hashedPassword = await bcrypt.hash(account.password, 10)
        user = await prisma.user.create({
          data: {
            email: account.email,
            password: hashedPassword,
            name: account.name,
            type: account.type,
            status: 'ACTIVE',
            verified: true
          }
        })
        
        // 프로필 생성
        if (account.type === 'INFLUENCER') {
          await prisma.profile.create({
            data: {
              userId: user.id,
              bio: 'Demo influencer account for testing',
              instagram: '@demo_influencer',
              instagramFollowers: 10000
            }
          })
        } else if (account.type === 'BUSINESS') {
          await prisma.businessProfile.create({
            data: {
              userId: user.id,
              companyName: account.name,
              businessCategory: 'Demo',
              businessNumber: '999-99-99999',
              representativeName: 'Demo Representative',
              businessAddress: 'Demo Address'
            }
          })
        }
        
        console.log('✅ 데모 계정 생성 완료:', account.email)
      } else {
        console.log('ℹ️ 데모 계정 이미 존재:', account.email)
      }
    }
    
    console.log('\n📋 데모 계정 정보:')
    console.log('=====================================')
    console.log('관리자: admin@demo.com / admin123!')
    console.log('인플루언서: 뷰티구루민지@demo.com / password123')
    console.log('비즈니스: CJ제일제당@demo.com / password123')
    console.log('추가 인플루언서: influencer@demo.com / password123')
    console.log('추가 비즈니스: business@demo.com / password123')
    console.log('=====================================')
    
  } catch (error) {
    console.error('❌ 데모 계정 생성 중 오류:', error)
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