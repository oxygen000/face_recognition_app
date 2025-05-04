import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";

// Define types for our context
interface UserContextType {
  deletedUserIds: string[];
  markUserAsDeleted: (userId: string) => void;
  isUserDeleted: (userId: string) => boolean;
  clearDeletedUsers: () => void;
}

// Create context with default values
const UserContext = createContext<UserContextType>({
  deletedUserIds: [],
  markUserAsDeleted: () => {},
  isUserDeleted: () => false,
  clearDeletedUsers: () => {},
});

// Context provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use localStorage to persist deleted user IDs between page refreshes
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() => {
    const savedIds = localStorage.getItem("deletedUserIds");
    return savedIds ? JSON.parse(savedIds) : [];
  });

  // Save to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("deletedUserIds", JSON.stringify(deletedUserIds));
  }, [deletedUserIds]);

  // Mark a user as deleted
  const markUserAsDeleted = useCallback((userId: string) => {
    setDeletedUserIds((prev) => {
      // Only add if not already in the list
      if (!prev.includes(userId)) {
        return [...prev, userId];
      }
      return prev;
    });
  }, []);

  // Check if a user is deleted
  const isUserDeleted = useCallback(
    (userId: string) => {
      return deletedUserIds.includes(userId);
    },
    [deletedUserIds]
  );

  // Clear the list of deleted users (useful for testing)
  const clearDeletedUsers = useCallback(() => {
    setDeletedUserIds([]);
  }, []);

  return (
    <UserContext.Provider
      value={{
        deletedUserIds,
        markUserAsDeleted,
        isUserDeleted,
        clearDeletedUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUserContext = () => useContext(UserContext);

export default UserContext;
