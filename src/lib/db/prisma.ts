/**
 * Prisma 데이터베이스 클라이언트
 * 싱글톤 패턴으로 구현되어 전역에서 하나의 인스턴스만 사용
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { config } from '@/lib/config';
import '@/lib/utils/memory-monitor'; // 메모리 모니터링 자동 시작

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 로그 레벨 설정
function getPrismaLogLevel(): Prisma.LogLevel[] {
  // 개발 환경에서도 query 로그는 비활성화 (무한 루프 방지)
  if (config.isDevelopment) {
    return ['info', 'warn', 'error'];
  }
  if (config.isTest) {
    return ['error', 'warn'];
  }
  return ['error'];
}

// Prisma 클라이언트 생성 함수
function createPrismaClient() {
  const client = new PrismaClient({
    log: getPrismaLogLevel().map(level => ({
      level,
      emit: 'event'
    })),
    errorFormat: config.isDevelopment ? 'pretty' : 'minimal',
    // 연결 풀 최적화로 메모리 누수 방지
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // 로그 이벤트 처리
  // query 로그는 무한 루프 방지를 위해 비활성화
  
  // @ts-ignore
  client.$on('info', (e: Prisma.LogEvent) => {
    console.log('[Prisma Info]', e.message);
  });

  // @ts-ignore
  client.$on('warn', (e: Prisma.LogEvent) => {
    console.warn('[Prisma Warning]', e.message);
  });

  // @ts-ignore
  client.$on('error', (e: Prisma.LogEvent) => {
    console.error('[Prisma Error]', e.message);
  });

  // 연결 관리
  client.$connect()
    .then(() => {
      console.log('[Database] Connected successfully');
    })
    .catch((error) => {
      console.error('[Database] Failed to connect:', error);
      process.exit(1);
    });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Database] Disconnecting...');
    await client.$disconnect();
    console.log('[Database] Disconnected');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return client;
}

// Prisma 클라이언트 인스턴스
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 개발 환경에서 Hot Reload 시 재사용
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 별칭 exports
export { prisma as db };
export default prisma;

// Prisma 타입 재내보내기
export type { Prisma } from '@prisma/client';