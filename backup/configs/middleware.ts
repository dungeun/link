import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or external service)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  skipPaths: ['/health', '/favicon.ico', '/_next/', '/api/health']
}

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`
}

function isRateLimited(req: NextRequest): boolean {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const path = req.nextUrl.pathname
  
  // Skip rate limiting for certain paths
  if (RATE_LIMIT.skipPaths.some(skipPath => path.startsWith(skipPath))) {
    return false
  }
  
  const key = getRateLimitKey(ip, path)
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or initialize counter
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    })
    return false
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return true
  }
  
  record.count++
  return false
}

// Security headers for enhanced protection
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Remove server header for security
  response.headers.delete('Server')
  
  // Add additional security headers not covered in next.config.js
  response.headers.set('X-Robots-Tag', 'index, follow')
  
  // Remove potentially sensitive headers
  response.headers.delete('X-Powered-By')
  
  return response
}

// Validate request headers for security
function validateRequest(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent')
  const referer = req.headers.get('referer')
  
  // Block requests without user agent (potential bots)
  if (!userAgent && req.nextUrl.pathname.startsWith('/api/')) {
    return false
  }
  
  // Block suspicious user agents
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burpsuite/i,
    /acunetix/i
  ]
  
  if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return false
  }
  
  return true
}

export function middleware(req: NextRequest) {
  // Validate request
  if (!validateRequest(req)) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  // Rate limiting
  if (isRateLimited(req)) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes
        'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
        'X-RateLimit-Window': (RATE_LIMIT.windowMs / 1000).toString()
      }
    })
  }
  
  // Continue to the next middleware or route handler
  const response = NextResponse.next()
  
  // Add security headers
  return addSecurityHeaders(response)
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|workers).*)',
  ],
}