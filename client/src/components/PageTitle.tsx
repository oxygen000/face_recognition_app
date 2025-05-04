import React from "react";
import BilingualText from "./BilingualText";

interface PageTitleProps {
  textKey: string;
  values?: Record<string, string>;
  className?: string;
  showBothLanguages?: boolean;
}

/**
 * Page title component with built-in bilingual support
 * Displays a consistent page title across the application
 */
const PageTitle: React.FC<PageTitleProps> = ({
  textKey,
  values,
  className = "",
  showBothLanguages,
}) => {
  return (
    <h1 className={`text-2xl font-bold mb-4 text-gray-800 ${className}`}>
      <BilingualText
        textKey={textKey}
        values={values}
        showBothLanguages={showBothLanguages}
      />
    </h1>
  );
};

export default PageTitle;
