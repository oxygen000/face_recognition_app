import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { merge } from "lodash";

// Base translations to ensure critical UI elements have translations
const baseTranslations = {
  en: {
    translation: {
      "app.title": "Face Recognition App",
      "nav.dashboard": "Dashboard",
      "nav.recognize": "Recognize",
      "nav.register": "Register",
      "nav.users": "Users",
      "nav.settings": "Settings",
      "nav.darkMode": "Dark Mode",
      "nav.lightMode": "Light Mode",
      "nav.switchToArabic": "عربي",
      "nav.switchToEnglish": "English",
    },
  },
  ar: {
    translation: {
      "app.title": "تطبيق التعرف على الوجه",
      "nav.dashboard": "لوحة التحكم",
      "nav.recognize": "التعرف",
      "nav.register": "التسجيل",
      "nav.users": "المستخدمون",
      "nav.settings": "الإعدادات",
      "nav.darkMode": "الوضع الداكن",
      "nav.lightMode": "الوضع الفاتح",
      "nav.switchToArabic": "عربي",
      "nav.switchToEnglish": "English",
    },
  },
};

// Define supported languages
export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

// Direction mapping
export const LANGUAGE_DIRECTION: Record<SupportedLanguage, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

// Language names for display
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  ar: "Arabic",
};

// Native language names
export const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  ar: "العربية",
};

/**
 * Get the initial language from localStorage or browser settings
 * Ensures it's a supported language
 */
const getInitialLanguage = (): SupportedLanguage => {
  // Check for stored language preference first
  const storedLang = localStorage.getItem("i18nextLng");

  if (
    storedLang &&
    SUPPORTED_LANGUAGES.includes(storedLang as SupportedLanguage)
  ) {
    return storedLang as SupportedLanguage;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }

  // Fallback to default
  return DEFAULT_LANGUAGE;
};

/**
 * Apply direction attributes to HTML based on current language
 */
export const applyLanguageDirection = (language: string): void => {
  const dir = language === "ar" ? "rtl" : "ltr";

  // Set HTML attributes
  document.documentElement.dir = dir;
  document.documentElement.lang = language;

  // Update body classes for styling hooks
  document.body.className = document.body.className
    .replace(/lang-\w+/g, "")
    .trim();
  document.body.classList.add(`lang-${language}`);

  // Apply RTL-specific class if needed
  if (dir === "rtl") {
    document.body.classList.add("rtl");
  } else {
    document.body.classList.remove("rtl");
  }
};

// Initialize i18next
i18n
  // Load translations from server or local files
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize with configuration
  .init({
    // Embedded core translations as fallback
    resources: baseTranslations,
    // Use stored language or detect from browser
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,

    // Debug mode - set to false in production
    debug: process.env.NODE_ENV === "development",

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Load missing translations from backend
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      // Additional namespace files to load
      allowMultiLoading: true,
    },

    // Language detection options
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    // React options
    react: {
      useSuspense: true,
    },
  });

// Set direction on initialization and language change
applyLanguageDirection(i18n.language);
i18n.on("languageChanged", applyLanguageDirection);

/**
 * Change the current language
 * @param language The language code to switch to
 */
export const changeLanguage = async (
  language: SupportedLanguage
): Promise<void> => {
  if (SUPPORTED_LANGUAGES.includes(language)) {
    await i18n.changeLanguage(language);
    localStorage.setItem("i18nextLng", language);
  } else {
    console.error(`Unsupported language: ${language}`);
  }
};

/**
 * Add additional translations to the current language
 * @param namespace The namespace to add translations to
 * @param language The language to add translations for
 * @param translations The translations to add
 */
export const addResourceBundle = (
  namespace: string,
  language: SupportedLanguage,
  translations: Record<string, any>
): void => {
  // Get existing translations for namespace
  const existing = i18n.getResourceBundle(language, namespace) || {};

  // Merge new translations with existing ones
  const merged = merge({}, existing, translations);

  // Add or update the resource bundle
  i18n.addResourceBundle(language, namespace, merged, true, true);
};

export default i18n;
