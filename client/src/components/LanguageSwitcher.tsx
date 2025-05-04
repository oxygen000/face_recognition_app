import React from "react";
import useLanguage from "../hooks/useLanguage";
import { SupportedLanguage } from "../utils/i18n";

/**
 * Flag emojis for each supported language
 */
const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  ar: "🇸🇦",
};

interface LanguageSwitcherProps {
  variant?: "minimal" | "full" | "dropdown";
  className?: string;
}

/**
 * Enhanced language switcher component that allows changing the application language
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "full",
  className = "",
}) => {
  const {
    language,
    nativeLanguageName,
    supportedLanguages,
    languageNames,
    nativeLanguageNames,
    switchLanguage,
    toggleLanguage,
  } = useLanguage();

  // If minimal is selected, just show a button that toggles languages
  if (variant === "minimal") {
    return (
      <button
        onClick={() => toggleLanguage()}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 ${className}`}
        aria-label={`Change language to ${
          language === "en" ? languageNames.ar : languageNames.en
        }`}
      >
        <span className="text-base">{LANGUAGE_FLAGS[language]}</span>
      </button>
    );
  }

  // Dropdown variant
  if (variant === "dropdown") {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-base">{LANGUAGE_FLAGS[language]}</span>
          <span className="text-sm font-medium">{nativeLanguageName}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute mt-1 py-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            role="listbox"
          >
            {supportedLanguages.map((code) => (
              <button
                key={code}
                onClick={() => {
                  switchLanguage(code as SupportedLanguage);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2 text-sm ${
                  language === code
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                role="option"
                aria-selected={language === code}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-lg">{LANGUAGE_FLAGS[code]}</span>
                  <span>{nativeLanguageNames[code as SupportedLanguage]}</span>
                </div>
                {language !== code && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {languageNames[code as SupportedLanguage]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default full view with all languages as buttons
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {supportedLanguages.map((code) => (
        <button
          key={code}
          onClick={() => switchLanguage(code as SupportedLanguage)}
          className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            language === code
              ? "bg-blue-700 text-white shadow-sm dark:bg-blue-800"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          aria-pressed={language === code}
          aria-label={`Switch to ${languageNames[code as SupportedLanguage]}`}
        >
          <span className="mr-1.5 text-base">{LANGUAGE_FLAGS[code]}</span>
          <span>{nativeLanguageNames[code as SupportedLanguage]}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
