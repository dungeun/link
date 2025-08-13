import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth/constants';

export async function getServerSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
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