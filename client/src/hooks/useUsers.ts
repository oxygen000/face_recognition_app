import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { User } from "../types";

/**
 * Hook for fetching and managing users
 */
function useUsers() {
  const { t } = useTranslation(["users", "common", "hooks"]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Fetch users from the API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    setErrorMessage(null);

    try {
      const response = await api.getUsers();

      // Check if we have users in the response
      if (
        response &&
        Array.isArray(response.users) &&
        response.users.length > 0
      ) {
        setUsers(response.users);
      }
      // If no users, set empty array
      else {
        setUsers([]);
        setError(true);
        setErrorMessage(t("hooks:errors.users.noUsers", "No users found"));
      }
    } catch (err) {
      setError(true);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : t("hooks:errors.users.fetchFailed", "Failed to fetch users")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    errorMessage,
    fetchUsers,
  };
}

export default useUsers;
