import React, { useEffect, useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface TranslationProviderProps {
  children: ReactNode;
  namespaces?: string[];
}

/**
 * Component that ensures all specified translation namespaces are loaded
 * before rendering its children. This prevents missing translations
 * when a page is first loaded.
 */
const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  namespaces = ["common"],
}) => {
  const { i18n } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if all required namespaces are loaded
    const allNamespacesLoaded = namespaces.every((ns) =>
      i18n.hasResourceBundle(i18n.language, ns)
    );

    if (allNamespacesLoaded) {
      setIsLoaded(true);
      return;
    }

    // Load any missing namespaces
    const loadNamespaces = async () => {
      try {
        await i18n.loadNamespaces(namespaces);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load translation namespaces:", error);
        // Allow rendering even if there was an error loading translations
        setIsLoaded(true);
      }
    };

    loadNamespaces();
  }, [i18n, i18n.language, namespaces]);

  // Simple loading state while translations are being loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
};

export default TranslationProvider;
