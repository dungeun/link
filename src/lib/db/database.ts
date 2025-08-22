/**
 * Database Connection with Read Replica Support
 * 읽기/쓰기 분리를 위한 데이터베이스 연결 관리
 */

import { PrismaClient } from "@prisma/client";

// Write Database (Primary)
const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Read Database (Replica)
// 현재는 같은 DB를 사용하지만, 향후 Read Replica 추가 시 URL만 변경
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL!,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
});

// Connection Pool 설정
if (process.env.NODE_ENV === "production") {
  // Write DB: 적은 연결 풀
  prismaWrite.$connect();

  // Read DB: 더 많은 연결 풀
  prismaRead.$connect();
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prismaWrite.$disconnect();
  await prismaRead.$disconnect();
});

/**
 * Database Query Builder with Read/Write Separation
 */
export class DatabaseQueryBuilder {
  // 읽기 작업
  static read = {
    // 단일 조회
    async findUnique<T>(model: string, args: any): Promise<T | null> {
      return (prismaRead as any)[model].findUnique(args);
    },

    // 첫 번째 조회
    async findFirst<T>(model: string, args: any): Promise<T | null> {
      return (prismaRead as any)[model].findFirst(args);
    },

    // 다중 조회
    async findMany<T>(model: string, args: any): Promise<T[]> {
      return (prismaRead as any)[model].findMany(args);
    },

    // 카운트
    async count(model: string, args: any): Promise<number> {
      return (prismaRead as any)[model].count(args);
    },

    // 집계
    async aggregate(model: string, args: any): Promise<any> {
      return (prismaRead as any)[model].aggregate(args);
    },

    // 그룹
    async groupBy(model: string, args: any): Promise<any> {
      return (prismaRead as any)[model].groupBy(args);
    },
  };

  // 쓰기 작업
  static write = {
    // 생성
    async create<T>(model: string, args: any): Promise<T> {
      return (prismaWrite as any)[model].create(args);
    },

    // 다중 생성
    async createMany(model: string, args: any): Promise<any> {
      return (prismaWrite as any)[model].createMany(args);
    },

    // 업데이트
    async update<T>(model: string, args: any): Promise<T> {
      return (prismaWrite as any)[model].update(args);
    },

    // 다중 업데이트
    async updateMany(model: string, args: any): Promise<any> {
      return (prismaWrite as any)[model].updateMany(args);
    },

    // 삭제
    async delete<T>(model: string, args: any): Promise<T> {
      return (prismaWrite as any)[model].delete(args);
    },

    // 다중 삭제
    async deleteMany(model: string, args: any): Promise<any> {
      return (prismaWrite as any)[model].deleteMany(args);
    },

    // Upsert
    async upsert<T>(model: string, args: any): Promise<T> {
      return (prismaWrite as any)[model].upsert(args);
    },
  };

  // 트랜잭션 (쓰기 DB에서만)
  static async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return prismaWrite.$transaction(fn);
  }

  // Raw Query
  static raw = {
    // 읽기 쿼리
    async query<T = any>(sql: string, values?: any[]): Promise<T> {
      return prismaRead.$queryRawUnsafe(sql, ...(values || []));
    },

    // 쓰기 쿼리
    async execute<T = any>(sql: string, values?: any[]): Promise<T> {
      return prismaWrite.$executeRawUnsafe(sql, ...(values || []));
    },
  };
}

/**
 * Smart Database Router
 * 쿼리 타입에 따라 자동으로 Read/Write DB 선택
 */
export class SmartDatabaseRouter {
  private static readonly READ_OPERATIONS = [
    "findUnique",
    "findFirst",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
  ];

  private static readonly WRITE_OPERATIONS = [
    "create",
    "createMany",
    "update",
    "updateMany",
    "delete",
    "deleteMany",
    "upsert",
  ];

  // 자동 라우팅
  static route(operation: string): PrismaClient {
    if (this.READ_OPERATIONS.includes(operation)) {
      return prismaRead;
    }
    return prismaWrite;
  }

  // 강제 Write DB 사용 (트랜잭션 직후 읽기 등)
  static forceWrite(): PrismaClient {
    return prismaWrite;
  }

  // 강제 Read DB 사용
  static forceRead(): PrismaClient {
    return prismaRead;
  }
}

/**
 * Database Health Check
 */
export class DatabaseHealthCheck {
  static async check(): Promise<{
    write: boolean;
    read: boolean;
    latency: { write: number; read: number };
  }> {
    const results = {
      write: false,
      read: false,
      latency: { write: 0, read: 0 },
    };

    // Write DB 체크
    try {
      const writeStart = Date.now();
      await prismaWrite.$queryRaw`SELECT 1`;
      results.write = true;
      results.latency.write = Date.now() - writeStart;
    } catch (error) {
      console.error("[DB] Write database health check failed:", error);
    }

    // Read DB 체크
    try {
      const readStart = Date.now();
      await prismaRead.$queryRaw`SELECT 1`;
      results.read = true;
      results.latency.read = Date.now() - readStart;
    } catch (error) {
      console.error("[DB] Read database health check failed:", error);
    }

    return results;
  }
}

// Export instances
export const db = {
  write: prismaWrite,
  read: prismaRead,
  query: DatabaseQueryBuilder,
  router: SmartDatabaseRouter,
  health: DatabaseHealthCheck,
};

// Backward compatibility
export const prisma = prismaWrite;
