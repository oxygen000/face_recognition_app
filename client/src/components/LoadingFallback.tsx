import { useTranslation } from "react-i18next";

const LoadingFallback = () => {
  // Use a try-catch because i18n may not be initialized yet
  try {
    const { t } = useTranslation("common");

    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
        <span className="text-gray-600">{t("loading", "Loading...")}</span>
      </div>
    );
  } catch (error) {
    // Fallback if translations aren't loaded yet
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
};

export default LoadingFallback;
