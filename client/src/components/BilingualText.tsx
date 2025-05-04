import React from "react";
import { useTranslation } from "react-i18next";

// Define our own type for translation values
type TranslationValues = Record<string, any>;

interface BilingualTextProps {
  textKey: string;
  ns?: string;
  values?: TranslationValues;
  className?: string;
  separator?: string;
  showBothLanguages?: boolean;
}

/**
 * Component to display text in both languages (English and Arabic)
 * When in bilingual mode, it shows both translations
 * Otherwise it shows only the current language
 */
const BilingualText: React.FC<BilingualTextProps> = ({
  textKey,
  ns,
  values = {},
  className = "",
  separator = " / ",
  showBothLanguages = true,
}) => {
  const { t, i18n } = useTranslation(ns);
  const direction = i18n.dir();
  const isBilingual = showBothLanguages;

  // Get translations for both languages and ensure they're strings
  const enText = String(i18n.getFixedT("en", ns)(textKey, values));
  const arText = String(i18n.getFixedT("ar", ns)(textKey, values));

  // If bilingual mode is disabled, just show the current language
  if (!isBilingual) {
    return <span className={className}>{String(t(textKey, values))}</span>;
  }

  // Set appropriate styles
  const secondaryTextClass = "text-gray-600";

  // In bilingual mode, we show both languages
  return (
    <span className={`bilingual-text ${className}`} dir="auto">
      {direction === "ltr" ? (
        <>
          <span className="en">{enText}</span>
          <span className={`separator mx-1 ${secondaryTextClass}`}>
            {separator}
          </span>
          <span className={`ar ${secondaryTextClass} text-sm`} dir="rtl">
            {arText}
          </span>
        </>
      ) : (
        <>
          <span className="ar">{arText}</span>
          <span className={`separator mx-1 ${secondaryTextClass}`}>
            {separator}
          </span>
          <span className={`en ${secondaryTextClass} text-sm`} dir="ltr">
            {enText}
          </span>
        </>
      )}
    </span>
  );
};

export default BilingualText;
