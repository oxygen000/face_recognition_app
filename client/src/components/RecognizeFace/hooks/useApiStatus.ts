import { useState, useCallback, useEffect } from "react";
import api from "../../../services/api";

/**
 * Hook to manage API status for components that need API access
 */
export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<"live" | "mock" | "error">("live");

  /**
   * Check API health
   */
  const checkApiHealth = useCallback(async () => {
    try {
      await api.checkHealth();
      setApiStatus("live");
    } catch (apiError) {
      console.error("Health check failed:", apiError);
      setApiStatus("error");
    }
  }, []);

  // Check API health on hook mount
  useEffect(() => {
    checkApiHealth();
  }, [checkApiHealth]);

  return {
    apiStatus,
    setApiStatus,
    checkApiHealth,
  };
};

export default useApiStatus;
