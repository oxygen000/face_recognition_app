import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Function to get initial language
const getInitialLanguage = () => {
  const storedLang = localStorage.getItem("i18nextLng");
  if (storedLang && ["en", "ar"].includes(storedLang)) {
    return storedLang;
  }
  return "en";
};

// Define all available namespaces
const namespaces = [
  "common", 
  "login", 
  "dashboard", 
  "profile", 
  "users", 
  "userDetail", 
  "register", 
  "recognize", 
  "app", 
  "nav", 
  "footer", 
  "userMenu", 
  "auth"
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    lng: getInitialLanguage(),
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      // Increase request timeout to avoid issues with loading multiple files
      requestOptions: {
        timeout: 5000
      }
    },

    ns: namespaces,
    defaultNS: "common",

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },

    react: {
      useSuspense: true,
    },
    
    // Handle missing keys by keeping the key and adding a console warning in development
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: "${key}" in namespace: "${ns}" for language: "${lng}"`);
      }
    }
  });

// Set initial language direction
const setInitialDirection = () => {
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = i18n.language;
  document.body.className = dir;
};

// Preload all namespaces for the current language
const preloadNamespaces = async () => {
  try {
    await i18n.loadNamespaces(namespaces);
  } catch (error) {
    console.error("Failed to preload namespaces:", error);
  }
};

// Initialize language direction and preload namespaces
i18n.on("initialized", () => {
  setInitialDirection();
  preloadNamespaces();
});

// Handle language changes
i18n.on("languageChanged", () => {
  setInitialDirection();
  preloadNamespaces();
});

export default i18n;
