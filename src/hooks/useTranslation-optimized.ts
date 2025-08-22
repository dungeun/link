import { useState, useEffect, useCallback, useMemo } from "react";
import {
  loadTranslationChunk,
  getPageTranslations,
  preloadCriticalTranslations,
  type TranslationCategory,
  type TranslationItem,
} from "@/lib/translations/translation-chunks";

// Preload critical translations on app start
if (typeof window !== "undefined") {
  preloadCriticalTranslations();
}

/**
 * Optimized translation hook with lazy loading and chunking
 * Reduces memory usage by loading only required translation chunks
 */
export function useTranslation(categories?: TranslationCategory[]) {
  const [translations, setTranslations] = useState<
    Record<string, TranslationItem>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [locale, setLocale] = useState<"ko" | "en" | "jp">("ko");

  // Load translations for specified categories
  useEffect(() => {
    if (!categories || categories.length === 0) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getPageTranslations(categories)
      .then((data) => {
        if (!cancelled) {
          setTranslations(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Failed to load translations:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categories?.join(",")]); // Only re-run if categories change

  // Get current locale from localStorage or default
  useEffect(() => {
    const storedLocale = localStorage.getItem("locale") as "ko" | "en" | "jp";
    if (storedLocale) {
      setLocale(storedLocale);
    }
  }, []);

  // Memoized translation function
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const translation = translations[key];

      if (!translation) {
        // If translation not loaded, return fallback or key
        return fallback || key;
      }

      // Return translation in current locale
      switch (locale) {
        case "en":
          return translation.en || translation.ko || fallback || key;
        case "jp":
          return translation.jp || translation.ko || fallback || key;
        default:
          return translation.ko || fallback || key;
      }
    },
    [translations, locale],
  );

  // Get translation with all locales
  const getTranslation = useCallback(
    (key: string) => {
      return translations[key];
    },
    [translations],
  );

  // Change locale
  const changeLocale = useCallback((newLocale: "ko" | "en" | "jp") => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  return useMemo(
    () => ({
      t,
      locale,
      changeLocale,
      getTranslation,
      isLoading,
      translations,
    }),
    [t, locale, changeLocale, getTranslation, isLoading, translations],
  );
}

/**
 * Hook for admin pages - loads admin-specific translations
 */
export function useAdminTranslation() {
  return useTranslation([
    "admin",
    "common",
    "button",
    "error",
    "table",
    "status",
  ]);
}

/**
 * Hook for campaign pages
 */
export function useCampaignTranslation() {
  return useTranslation([
    "campaign",
    "campaigns",
    "common",
    "button",
    "error",
    "status",
  ]);
}

/**
 * Hook for auth pages
 */
export function useAuthTranslation() {
  return useTranslation(["auth", "common", "button", "error", "validation"]);
}

/**
 * Hook for homepage
 */
export function useHomepageTranslation() {
  return useTranslation([
    "homepage",
    "hero",
    "common",
    "button",
    "header",
    "footer",
  ]);
}
