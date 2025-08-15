/**
 * HTML 컨텐츠 살균처리 유틸리티
 * XSS 공격 방지를 위한 안전한 HTML 렌더링
 */

// 허용된 HTML 태그
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'div', 'span'
]

// 허용된 속성
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  div: ['class', 'id'],
  span: ['class', 'id'],
  p: ['class', 'id'],
  h1: ['class', 'id'],
  h2: ['class', 'id'],
  h3: ['class', 'id'],
  h4: ['class', 'id'],
  h5: ['class', 'id'],
  h6: ['class', 'id'],
}

// 위험한 프로토콜
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:']

export class HTMLSanitizer {
  /**
   * HTML 문자열을 살균처리
   * @param html 원본 HTML 문자열
   * @returns 살균처리된 HTML 문자열
   */
  static sanitize(html: string): string {
    if (!html) return ''
    
    // 기본 이스케이프
    let sanitized = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
    
    // 허용된 태그만 복원
    ALLOWED_TAGS.forEach(tag => {
      // 여는 태그
      const openTagRegex = new RegExp(`&lt;${tag}(\\s[^&]*)?&gt;`, 'gi')
      sanitized = sanitized.replace(openTagRegex, (match, attributes) => {
        if (attributes) {
          const cleanedAttributes = this.sanitizeAttributes(tag, attributes)
          return `<${tag}${cleanedAttributes}>`
        }
        return `<${tag}>`
      })
      
      // 닫는 태그
      const closeTagRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi')
      sanitized = sanitized.replace(closeTagRegex, `</${tag}>`)
    })
    
    // 위험한 이벤트 핸들러 제거
    sanitized = this.removeEventHandlers(sanitized)
    
    // 위험한 프로토콜 제거
    sanitized = this.removeDangerousProtocols(sanitized)
    
    return sanitized
  }
  
  /**
   * 속성 살균처리
   */
  private static sanitizeAttributes(tag: string, attributes: string): string {
    if (!attributes) return ''
    
    const allowedAttrs = ALLOWED_ATTRIBUTES[tag] || []
    const attrRegex = /(\w+)=["']([^"']+)["']/g
    const cleanedPairs: string[] = []
    
    let match
    while ((match = attrRegex.exec(attributes)) !== null) {
      const [, attrName, attrValue] = match
      
      if (allowedAttrs.includes(attrName.toLowerCase())) {
        // href 속성의 경우 추가 검증
        if (attrName.toLowerCase() === 'href') {
          if (!this.isDangerousUrl(attrValue)) {
            cleanedPairs.push(`${attrName}="${attrValue}"`)
          }
        } else {
          cleanedPairs.push(`${attrName}="${attrValue}"`)
        }
      }
    }
    
    return cleanedPairs.length > 0 ? ' ' + cleanedPairs.join(' ') : ''
  }
  
  /**
   * 이벤트 핸들러 제거
   */
  private static removeEventHandlers(html: string): string {
    // on으로 시작하는 모든 속성 제거
    return html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  }
  
  /**
   * 위험한 프로토콜 제거
   */
  private static removeDangerousProtocols(html: string): string {
    let sanitized = html
    
    DANGEROUS_PROTOCOLS.forEach(protocol => {
      const regex = new RegExp(protocol, 'gi')
      sanitized = sanitized.replace(regex, '')
    })
    
    return sanitized
  }
  
  /**
   * URL이 위험한지 확인
   */
  private static isDangerousUrl(url: string): boolean {
    const lowercaseUrl = url.toLowerCase().trim()
    
    return DANGEROUS_PROTOCOLS.some(protocol => 
      lowercaseUrl.startsWith(protocol)
    )
  }
  
  /**
   * 텍스트만 추출 (모든 HTML 제거)
   */
  static stripTags(html: string): string {
    if (!html) return ''
    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .trim()
  }
}

export default HTMLSanitizer