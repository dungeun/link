import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@/lib/auth/constants';

export async function getServerSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return null;
  }
  
  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token.value, jwtSecret) as any;
    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        type: decoded.type
      }
    };
  } catch (error) {
    return null;
  }
}