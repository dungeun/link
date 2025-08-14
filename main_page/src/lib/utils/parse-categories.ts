/**
 * Parse categories from various formats
 * Handles both JSON arrays and comma-separated strings
 */
export function parseCategories(categories: string | null | undefined): string[] {
  if (!categories) return [];
  
  // If it's already an array (shouldn't happen with string type, but for safety)
  if (Array.isArray(categories)) return categories;
  
  // Try to parse as JSON first
  if (typeof categories === 'string') {
    // Check if it looks like JSON array
    if (categories.startsWith('[') && categories.endsWith(']')) {
      try {
        const parsed = JSON.parse(categories);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // If JSON parsing fails, fall through to comma-separated parsing
      }
    }
    
    // Parse as comma-separated string
    return categories
      .split(',')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);
  }
  
  return [];
}