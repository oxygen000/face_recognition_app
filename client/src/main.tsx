import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/rtl.css"; // Import RTL styles
import "./i18n"; // Import i18n configuration
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import NextToploader from "nextjs-toploader";
import LoadingFallback from "./components/LoadingFallback";

// Get root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <BrowserRouter>
        <NextToploader
          color="linear-gradient(to right, #1958df, #1e7944)"
          height={4}
          showSpinner={false}
          shadow="0 0 10px #1958df"
        />
        <App />
      </BrowserRouter>
    </Suspense>
  </StrictMode>
);
