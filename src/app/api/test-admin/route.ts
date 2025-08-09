// 관리자 계정 확인 API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // 모든 관리자 계정 조회
    const admins = await prisma.user.findMany({
      where: {
        type: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true,
        createdAt: true
      }
    });

    // 관리자 계정이 없으면 생성
    if (admins.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123!@#', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@revu.com',
          password: hashedPassword,
          name: '관리자',
          type: 'ADMIN',
          status: 'ACTIVE',
          verified: true
        }
      });

      return NextResponse.json({
        message: '관리자 계정이 생성되었습니다.',
        admin: {
          email: newAdmin.email,
          password: 'admin123!@#',
          type: newAdmin.type
        }
      });
    }

    // 기존 관리자 계정 정보 반환 (비밀번호는 표시하지 않음)
    return NextResponse.json({
      message: '관리자 계정 목록',
      admins: admins,
      note: '비밀번호는 보안상 표시되지 않습니다. 기본 비밀번호: admin123!@#'
    });

  } catch (error) {
    console.error('관리자 계정 확인 오류:', error);
    return NextResponse.json(
      { error: '관리자 계정 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 관리자 계정 생성/업데이트
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 계정 생성 또는 업데이트
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        status: 'ACTIVE'
      },
      create: {
        email,
        password: hashedPassword,
        name: '관리자',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true
      }
    });

    return NextResponse.json({
      message: '관리자 계정이 설정되었습니다.',
      admin: {
        email: admin.email,
        type: admin.type,
        status: admin.status
      }
    });

  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
    return NextResponse.json(
      { error: '관리자 계정 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}