import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Custom hook to manage language direction based on current language
 * Sets document direction and body class for current language
 */
export const useLanguageDirection = () => {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<"rtl" | "ltr">(
    i18n.language === "ar" ? "rtl" : "ltr"
  );

  useEffect(() => {
    // Set document direction based on language (RTL for Arabic, LTR for others)
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;

    // Add language class to body for language-specific styling
    document.body.className = document.body.className
      .replace(/lang-\w+/g, "")
      .trim();
    document.body.classList.add(`lang-${i18n.language}`);

    // Update local state
    setDirection(dir);

    // Apply bilingual class
    document.body.classList.add("bilingual-enabled");

    return () => {
      // Cleanup on unmount
      document.body.classList.remove("bilingual-enabled");
    };
  }, [i18n.language]);

  // Return direction for component use if needed
  return {
    direction,
    language: i18n.language,
    isRTL: direction === "rtl",
    isLTR: direction === "ltr",
    // Utility function to get text-align based on current direction
    getTextAlign: (reverse = false) => {
      if (reverse) {
        return direction === "rtl" ? "left" : "right";
      }
      return direction === "rtl" ? "right" : "left";
    },
  };
};

export default useLanguageDirection;
