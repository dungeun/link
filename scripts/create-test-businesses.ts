const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestBusinesses() {
  try {
    // 이미 업체가 있는지 확인
    const existingCount = await prisma.business.count()
    console.log(`현재 ${existingCount}개의 업체가 있습니다.`)

    // 테스트 업체 데이터
    const testBusinesses = [
      {
        email: 'company1@test.com',
        name: '테스트기업1',
        companyName: '(주)테스트원',
        businessNumber: '123-45-67890',
        representativeName: '홍길동',
        businessCategory: '마케팅'
      },
      {
        email: 'company2@test.com',
        name: '테스트기업2',
        companyName: '(주)테스트투',
        businessNumber: '234-56-78901',
        representativeName: '김철수',
        businessCategory: 'IT'
      },
      {
        email: 'company3@test.com',
        name: '테스트기업3',
        companyName: '(주)테스트쓰리',
        businessNumber: '345-67-89012',
        representativeName: '이영희',
        businessCategory: '패션'
      }
    ]

    // 업체 생성
    for (const businessData of testBusinesses) {
      // 이미 존재하는지 확인
      const existing = await prisma.business.findUnique({
        where: { email: businessData.email }
      })

      if (existing) {
        console.log(`✓ 업체 이미 존재: ${businessData.email}`)
        continue
      }

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash('password123', 10)

      // 업체 생성
      const business = await prisma.business.create({
        data: {
          email: businessData.email,
          password: hashedPassword,
          name: businessData.name,
          businessProfile: {
            create: {
              companyName: businessData.companyName,
              businessNumber: businessData.businessNumber,
              representativeName: businessData.representativeName,
              businessCategory: businessData.businessCategory,
              phone: '02-1234-5678',
              address: '서울시 강남구 테스트로 123'
            }
          }
        },
        include: {
          businessProfile: true
        }
      })

      console.log(`✅ 업체 생성 완료: ${business.name} (${business.email})`)
    }

    // 최종 확인
    const totalCount = await prisma.business.count()
    console.log(`\n총 ${totalCount}개의 업체가 데이터베이스에 있습니다.`)

    // 전체 업체 목록 출력
    const allBusinesses = await prisma.business.findMany({
      include: {
        businessProfile: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    console.log('\n=== 전체 업체 목록 ===')
    allBusinesses.forEach(b => {
      console.log(`- ${b.name} (${b.email})`)
      if (b.businessProfile) {
        console.log(`  회사명: ${b.businessProfile.companyName}`)
        console.log(`  캠페인 수: ${b._count.campaigns}개`)
      }
    })

  } catch (error) {
    console.error('오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestBusinesses()
  .catch(console.error)