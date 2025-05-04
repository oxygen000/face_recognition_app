import { useRoutes } from "react-router-dom";
import { routes } from "./utils/routeConfig";
import { useLanguageDirection } from "./hooks/useLanguageDirection";
import { AuthProvider } from "./contexts/AuthContext";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import TranslationProvider from "./components/TranslationProvider";
import { UserProvider } from "./contexts/UserContext";

/**
 * Loading component shown during suspense
 */
const Loading = () => {
  const { t } = useTranslation("common");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">{t("loading", "Loading...")}</span>
    </div>
  );
};

/**
 * Main App component handling routing, authentication, and language direction
 */
function App() {
  useTranslation();

  // Handle language direction with custom hook
  useLanguageDirection();

  // Get all available namespaces
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
    "auth",
  ];

  // Set up routes
  const routeElement = useRoutes(routes);

  return (
    <UserProvider>
      <Suspense fallback={<Loading />}>
        <TranslationProvider namespaces={namespaces}>
          <Toaster />
          <AuthProvider>{routeElement}</AuthProvider>
        </TranslationProvider>
      </Suspense>
    </UserProvider>
  );
}

export default App;
