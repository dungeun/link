import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@/lib/auth/constants';

interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  type: string;
}

export async function getServerSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return null;
  }
  
  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token.value, jwtSecret) as JWTPayload;
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