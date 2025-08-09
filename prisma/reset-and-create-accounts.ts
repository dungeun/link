import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  기존 계정 삭제 중...')
  
  // 모든 데이터 삭제 (CASCADE로 연관 데이터도 삭제됨)
  await prisma.campaignApplication.deleteMany({})
  await prisma.campaign.deleteMany({})
  await prisma.profile.deleteMany({})
  await prisma.businessProfile.deleteMany({})
  await prisma.user.deleteMany({})
  
  console.log('✅ 기존 데이터 삭제 완료')
  
  console.log('👤 새 계정 생성 중...')
  
  // 새로운 안전한 비밀번호
  const influencerPassword = await bcrypt.hash('influencer@2024', 10)
  const businessPassword = await bcrypt.hash('business@2024', 10)
  const adminPassword = await bcrypt.hash('admin@2024!', 10)
  
  // 인플루언서 계정 5개 생성
  const influencers = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `influencer${i}@revu.com`,
        password: influencerPassword,
        name: `인플루언서 ${i}`,
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true
      }
    })
    
    // 프로필 생성
    await prisma.profile.create({
      data: {
        userId: user.id,
        bio: `안녕하세요! 열정적인 인플루언서 ${i}입니다. 다양한 분야의 콘텐츠를 제작하고 있습니다.`,
        instagram: `@influencer_${i}`,
        instagramFollowers: 10000 + (i * 5000),
        youtube: `influencer${i}_channel`,
        youtubeSubscribers: 5000 + (i * 2000),
        tiktok: `@influencer_${i}_tiktok`,
        tiktokFollowers: 8000 + (i * 3000),
        facebook: i <= 3 ? `influencer${i}_fb` : null,
        facebookFollowers: i <= 3 ? 3000 + (i * 1000) : null,
        twitter: i >= 3 ? `@influencer_${i}_tw` : null,
        twitterFollowers: i >= 3 ? 2000 + (i * 500) : null,
        naverBlog: `blog.naver.com/influencer${i}`,
        categories: ['라이프스타일', '뷰티', '패션', '음식'].slice(0, i % 4 + 1).join(','),
        address: ['서울시 강남구', '서울시 마포구', '서울시 성동구', '서울시 강서구', '서울시 송파구'][i - 1],
        birthYear: 2000 - (i * 2),
        gender: i % 2 === 0 ? 'F' : 'M',
        phone: `010-1234-${String(5000 + i).padStart(4, '0')}`,
        isVerified: true,
        averageEngagementRate: 3.5 + (i * 0.3),
        followerCount: 10000 + (i * 5000) + 5000 + (i * 2000) + 8000 + (i * 3000)
      }
    })
    
    influencers.push(user)
    console.log(`✅ 인플루언서 ${i} 생성: ${user.email}`)
  }
  
  // 비즈니스(클라이언트) 계정 5개 생성
  const businesses = []
  const businessNames = [
    { name: '삼성전자', company: 'Samsung Electronics' },
    { name: 'LG생활건강', company: 'LG H&H' },
    { name: '아모레퍼시픽', company: 'Amore Pacific' },
    { name: '네이버', company: 'NAVER' },
    { name: '카카오', company: 'Kakao' }
  ]
  
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `business${i}@company.com`,
        password: businessPassword,
        name: businessNames[i - 1].name,
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true
      }
    })
    
    // 비즈니스 프로필 생성
    await prisma.businessProfile.create({
      data: {
        userId: user.id,
        companyName: businessNames[i - 1].company,
        businessNumber: `123-45-${String(67890 + i).padStart(5, '0')}`,
        representativeName: `대표이사 ${i}`,
        businessAddress: `서울시 강남구 테헤란로 ${i * 100}`,
        businessCategory: ['IT/Tech', 'Beauty', 'Fashion', 'Platform', 'Platform'][i - 1],
        businessRegistration: null,
        isVerified: true,
        verifiedAt: new Date()
      }
    })
    
    businesses.push(user)
    console.log(`✅ 비즈니스 ${i} 생성: ${user.email} (${businessNames[i - 1].company})`)
  }
  
  // 관리자 계정 2개 생성
  const admins = []
  for (let i = 1; i <= 2; i++) {
    const user = await prisma.user.create({
      data: {
        email: i === 1 ? 'admin@revu.com' : 'superadmin@revu.com',
        password: adminPassword,
        name: i === 1 ? '관리자' : '최고관리자',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true
      }
    })
    
    admins.push(user)
    console.log(`✅ 관리자 ${i} 생성: ${user.email}`)
  }
  
  console.log('\n📊 계정 생성 완료!')
  console.log('=====================================')
  console.log('인플루언서 계정 (5개):')
  console.log('- 이메일: influencer1@revu.com ~ influencer5@revu.com')
  console.log('- 비밀번호: influencer@2024')
  console.log('')
  console.log('비즈니스 계정 (5개):')
  console.log('- 이메일: business1@company.com ~ business5@company.com')
  console.log('- 비밀번호: business@2024')
  console.log('')
  console.log('관리자 계정 (2개):')
  console.log('- 이메일: admin@revu.com, superadmin@revu.com')
  console.log('- 비밀번호: admin@2024!')
  console.log('=====================================')
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })