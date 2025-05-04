import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import {
  LANGUAGE_DIRECTION,
  LANGUAGE_NAMES,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  changeLanguage,
} from "../utils/i18n";
import { TOptions } from "i18next";

/**
 * Hook for managing language, direction and translation features
 *
 * @returns Language state and control functions
 */
export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage
  );
  const [direction, setDirection] = useState<"ltr" | "rtl">(
    LANGUAGE_DIRECTION[i18n.language as SupportedLanguage] || "ltr"
  );

  // Update local state when i18n language changes
  useEffect(() => {
    const updateLanguageState = () => {
      const currentLang = i18n.language as SupportedLanguage;
      setLanguage(currentLang);
      setDirection(LANGUAGE_DIRECTION[currentLang] || "ltr");
    };

    // Set initial state
    updateLanguageState();

    // Listen for language changes
    i18n.on("languageChanged", updateLanguageState);

    return () => {
      i18n.off("languageChanged", updateLanguageState);
    };
  }, [i18n]);

  /**
   * Switch the application language
   */
  const switchLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (lang !== language) {
        await changeLanguage(lang);
      }
    },
    [language]
  );

  /**
   * Toggle between current language and first available alternative
   */
  const toggleLanguage = useCallback(async () => {
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(language);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    const nextLanguage = SUPPORTED_LANGUAGES[nextIndex];

    await switchLanguage(nextLanguage);
  }, [language, switchLanguage]);

  /**
   * Get text alignment based on current direction
   * @param reverse If true, returns opposite alignment
   */
  const getTextAlign = useCallback(
    (reverse = false): "left" | "right" => {
      if (reverse) {
        return direction === "rtl" ? "left" : "right";
      }
      return direction === "rtl" ? "right" : "left";
    },
    [direction]
  );

  /**
   * Get flex direction based on current language direction
   * @param reverse If true, returns opposite direction
   */
  const getFlexDirection = useCallback(
    (reverse = false): "row" | "row-reverse" => {
      if (reverse) {
        return direction === "rtl" ? "row" : "row-reverse";
      }
      return direction === "rtl" ? "row-reverse" : "row";
    },
    [direction]
  );

  /**
   * Translate a key with namespace support
   */
  const translate = useCallback(
    (key: string, options?: TOptions) => {
      return t(key, options);
    },
    [t]
  );

  return {
    // Current language state
    language,
    direction,
    isRTL: direction === "rtl",
    isLTR: direction === "ltr",
    languageName: LANGUAGE_NAMES[language],
    nativeLanguageName: LANGUAGE_NATIVE_NAMES[language],
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageNames: LANGUAGE_NAMES,
    nativeLanguageNames: LANGUAGE_NATIVE_NAMES,

    // Language switching
    switchLanguage,
    toggleLanguage,

    // Translation
    t: translate,

    // Direction helpers
    getTextAlign,
    getFlexDirection,
  };
};

export default useLanguage;
