/**
 * Prisma 클라이언트 리다이렉트
 * 모든 Prisma 관련 import는 이 파일 또는 /lib/db/prisma.ts를 사용해야 합니다
 * 
 * @deprecated /lib/db/prisma.ts 사용을 권장합니다
 */

export { prisma, db, type Prisma } from './db/prisma';
export default from './db/prisma';