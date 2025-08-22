// Translation chunk loader with lazy loading support
// Splits large translation files into smaller, category-based chunks

export type TranslationCategory =
  | "action"
  | "admin"
  | "auth"
  | "badge"
  | "business"
  | "button"
  | "campaign"
  | "campaigns"
  | "category"
  | "common"
  | "error"
  | "footer"
  | "header"
  | "hero"
  | "homepage"
  | "influencer"
  | "mypage"
  | "pagination"
  | "platform"
  | "promo"
  | "review"
  | "search"
  | "section"
  | "status"
  | "table"
  | "toast"
  | "validation"
  | "wallet";

export interface TranslationItem {
  id: string;
  key: string;
  ko: string;
  en: string;
  jp?: string;
  category: string;
  description?: string;
  isEditable?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lazy load translation chunks
const translationChunks = new Map<
  TranslationCategory,
  Promise<TranslationItem[]>
>();

// Cache loaded translations in memory
const translationCache = new Map<TranslationCategory, TranslationItem[]>();

/**
 * Load a specific translation category chunk
 * Uses dynamic imports to reduce initial bundle size
 */
export async function loadTranslationChunk(
  category: TranslationCategory,
): Promise<TranslationItem[]> {
  // Return from cache if already loaded
  if (translationCache.has(category)) {
    return translationCache.get(category)!;
  }

  // Return existing promise if loading
  if (translationChunks.has(category)) {
    return translationChunks.get(category)!;
  }

  // Start loading the chunk
  const loadPromise = import(`./chunks/${category}-translations.js`)
    .then((module) => {
      const translations = module.default as TranslationItem[];
      translationCache.set(category, translations);
      return translations;
    })
    .catch((error) => {
      console.error(`Failed to load translation chunk for ${category}:`, error);
      return [];
    });

  translationChunks.set(category, loadPromise);
  return loadPromise;
}

/**
 * Load multiple translation chunks in parallel
 */
export async function loadTranslationChunks(
  categories: TranslationCategory[],
): Promise<TranslationItem[]> {
  const chunks = await Promise.all(categories.map(loadTranslationChunk));
  return chunks.flat();
}

/**
 * Preload critical translation chunks for better performance
 */
export function preloadCriticalTranslations(): void {
  const criticalCategories: TranslationCategory[] = [
    "common",
    "button",
    "error",
    "header",
  ];
  criticalCategories.forEach((category) => {
    loadTranslationChunk(category);
  });
}

/**
 * Get a single translation by key (lazy loads the necessary chunk)
 */
export async function getTranslation(
  key: string,
): Promise<TranslationItem | undefined> {
  // Extract category from key (e.g., "admin.footer.title" -> "admin")
  const category = key.split(".")[0] as TranslationCategory;

  const translations = await loadTranslationChunk(category);
  return translations.find((t) => t.key === key);
}

/**
 * Get all translations for a specific page/component
 * Loads only the necessary chunks
 */
export async function getPageTranslations(
  pageCategories: TranslationCategory[],
): Promise<Record<string, TranslationItem>> {
  const translations = await loadTranslationChunks(pageCategories);

  return translations.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<string, TranslationItem>,
  );
}
