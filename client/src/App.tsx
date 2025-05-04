import { useRoutes } from "react-router-dom";
import { routes } from "./utils/routeConfig";
import { useLanguageDirection } from "./hooks/useLanguageDirection";
import { AuthProvider } from "./contexts/AuthContext";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

/**
 * Loading component shown during suspense
 */
const Loading = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">
        {t("common.loading", "Loading...")}
      </span>
    </div>
  );
};

/**
 * Main App component handling routing, authentication, and language direction
 */
function App() {
  // Handle language direction with custom hook
  useLanguageDirection();

  // Set up routes
  const routeElement = useRoutes(routes);

  return (
    <Suspense fallback={<Loading />}>
      <Toaster />
      <AuthProvider>{routeElement}</AuthProvider>
    </Suspense>
  );
}

export default App;
