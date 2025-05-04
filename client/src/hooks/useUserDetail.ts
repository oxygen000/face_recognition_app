import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { User } from "../types";

/**
 * Hook for fetching and managing user details
 * @param userId - The ID of the user to fetch
 */
function useUserDetail(userId: string | undefined) {
  const { t } = useTranslation(["users", "common", "hooks"]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetch user details from the API
   */
  const fetchUser = useCallback(async () => {
    if (!userId) {
      setError(true);
      setErrorMessage(
        t("hooks:errors.userDetail.idRequired", "User ID is required")
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    setErrorMessage(null);

    try {
      const response = await api.getUserById(userId);

      if (response.status === "success") {
        // Check if the response has user property or data property
        if (response.user) {
          setUser(response.user);
        } else if (response.data) {
          setUser(response.data as User);
        } else {
          setError(true);
          setErrorMessage(
            t("hooks:errors.userDetail.notFound", "User data not found")
          );
        }
      } else {
        setError(true);
        setErrorMessage(
          response.message ||
            t(
              "hooks:errors.userDetail.fetchFailed",
              "Failed to fetch user details"
            )
        );
      }
    } catch (err) {
      setError(true);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : t("common:error", "An error occurred")
      );
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  /**
   * Delete a user
   */
  const deleteUser = useCallback(async () => {
    if (!userId) {
      return {
        success: false,
        message: t("hooks:errors.userDetail.idRequired", "User ID is required"),
      };
    }

    try {
      const response = await api.deleteUser(userId);

      return {
        success: response.status === "success",
        message:
          response.message ||
          t("hooks:success.userDeleted", "User deleted successfully"),
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : t("users:userDetail.deleteError", "Failed to delete user"),
      };
    }
  }, [userId, t]);

  // Fetch user on mount or when userId changes
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    errorMessage,
    fetchUser,
    deleteUser,
  };
}

export default useUserDetail;
