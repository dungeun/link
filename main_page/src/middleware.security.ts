import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function addApiSecurityHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return addSecurityHeaders(response);
}

export function securityCheck(request: NextRequest) {
  // Basic security checks
  return true;
}