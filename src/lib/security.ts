import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Input validation and sanitization utilities
export class SecurityUtils {
  
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false
    })
  }

  // Validate and sanitize email
  static validateEmail(email: string): { isValid: boolean; sanitized: string } {
    const sanitized = validator.normalizeEmail(email) || ''
    const isValid = validator.isEmail(sanitized)
    return { isValid, sanitized }
  }

  // Validate password strength
  static validatePassword(password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score += 25
    else feedback.push('Password must be at least 8 characters long')

    if (/[a-z]/.test(password)) score += 15
    else feedback.push('Password must contain lowercase letters')

    if (/[A-Z]/.test(password)) score += 15
    else feedback.push('Password must contain uppercase letters')

    if (/\d/.test(password)) score += 15
    else feedback.push('Password must contain numbers')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15
    else feedback.push('Password must contain special characters')

    if (password.length >= 12) score += 15

    return {
      isValid: score >= 70,
      score,
      feedback
    }
  }

  // Sanitize user input for database queries
  static sanitizeInput(input: string): string {
    return validator.escape(validator.trim(input))
  }

  // Validate URL
  static validateUrl(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const crypto = typeof window !== 'undefined' 
      ? window.crypto 
      : require('crypto')

    if (typeof window !== 'undefined') {
      // Browser environment
      const array = new Uint8Array(length)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else {
      // Node.js environment
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(crypto.randomBytes(1)[0] % chars.length)]
      }
    }
    
    return result
  }

  // Validate file upload
  static validateFile(file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Rate limiting check
  static checkRateLimit(
    key: string, 
    limit: number, 
    windowMs: number,
    store: Map<string, { count: number; resetTime: number }> = new Map()
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = store.get(key)

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs
      store.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: limit - 1, resetTime }
    }

    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
  }

  // SQL injection prevention
  static isSecureQuery(query: string): boolean {
    const dangerousPatterns = [
      /(\b(DROP|DELETE|TRUNCATE|UPDATE|INSERT)\b)/i,
      /(UNION\s+SELECT)/i,
      /(--|\/\*|\*\/)/,
      /(\bOR\b\s+\w+\s*=\s*\w+)/i,
      /(\bAND\b\s+\w+\s*=\s*\w+)/i,
      /(;\s*DROP)/i,
      /(EXEC\s+\w+)/i
    ]

    return !dangerousPatterns.some(pattern => pattern.test(query))
  }

  // Content Security Policy nonce generator
  static generateCSPNonce(): string {
    return this.generateSecureToken(16)
  }

  // Validate JSON input
  static validateJsonInput(input: string, maxDepth: number = 10): { 
    isValid: boolean; 
    parsed?: any; 
    error?: string 
  } {
    try {
      const parsed = JSON.parse(input)
      
      // Check depth
      const checkDepth = (obj: any, depth: number = 0): boolean => {
        if (depth > maxDepth) return false
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).every(value => checkDepth(value, depth + 1))
        }
        return true
      }

      if (!checkDepth(parsed)) {
        return { isValid: false, error: 'JSON depth exceeds maximum allowed' }
      }

      return { isValid: true, parsed }
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' }
    }
  }
}

// Security middleware for API routes
export function securityMiddleware(req: any, res: any, next: any) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Validate content-type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid content-type' })
    }
  }

  next()
}