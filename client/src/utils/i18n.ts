import i18n from "i18next";

/**
 * Supported languages in the application
 */
export type SupportedLanguage = "en" | "ar";

/**
 * List of all supported languages
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "ar"];

/**
 * Human-readable names for each language (in English)
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  ar: "Arabic",
};

/**
 * Native names for each language (in its own script)
 */
export const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  ar: "العربية",
};

/**
 * Text direction for each language
 */
export const LANGUAGE_DIRECTION: Record<SupportedLanguage, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

/**
 * Change the application language
 * @param lang The language to switch to
 * @returns Promise that resolves when language change is complete
 */
export const changeLanguage = async (
  lang: SupportedLanguage
): Promise<void> => {
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.warn(`Language ${lang} is not supported`);
    return;
  }

  await i18n.changeLanguage(lang);

  // Update html direction attribute
  document.documentElement.dir = LANGUAGE_DIRECTION[lang];
  document.documentElement.lang = lang;
};

/**
 * Get the current language's text direction
 */
export const getCurrentDirection = (): "ltr" | "rtl" => {
  const currentLang = i18n.language as SupportedLanguage;
  return LANGUAGE_DIRECTION[currentLang] || "ltr";
};

/**
 * Check if the current language is RTL
 */
export const isRTL = (): boolean => {
  return getCurrentDirection() === "rtl";
};
