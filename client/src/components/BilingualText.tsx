import React from "react";
import { useTranslation } from "react-i18next";

interface BilingualTextProps {
  textKey: string;
  values?: Record<string, string>;
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
  values = {},
  className = "",
  separator = " / ",
  showBothLanguages = true,
}) => {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  const isBilingual = showBothLanguages;

  // Get translations for both languages
  const enText = i18n.getFixedT("en")(textKey, values);
  const arText = i18n.getFixedT("ar")(textKey, values);

  // If bilingual mode is disabled, just show the current language
  if (!isBilingual) {
    return <span className={className}>{t(textKey, values)}</span>;
  }

  // Set appropriate styles
  const secondaryTextClass = "text-gray-600";

  // In bilingual mode, we show both languages
  return (
    <span className={`bilingual-text ${className}`}>
      {direction === "ltr" ? (
        <>
          <span className="en">{enText}</span>
          <span className={`separator mx-1 ${secondaryTextClass}`}>{separator}</span>
          <span className={`ar ${secondaryTextClass} text-sm`}>{arText}</span>
        </>
      ) : (
        <>
          <span className="ar">{arText}</span>
          <span className={`separator mx-1 ${secondaryTextClass}`}>{separator}</span>
          <span className={`en ${secondaryTextClass} text-sm`}>{enText}</span>
        </>
      )}
    </span>
  );
};

export default BilingualText;
