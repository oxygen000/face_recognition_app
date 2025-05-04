import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Define user type
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demo purposes
const DEMO_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=admin',
  },
  {
    id: '2',
    username: 'user',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?u=user',
  },
];

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('auth');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error(t('errors.checkingAuth', 'Error checking authentication:'), error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [t]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, check against our sample users
      const foundUser = DEMO_USERS.find(u => u.username === username);

      if (foundUser && (password === 'password' || password === 'admin123')) {
        // Store user in state and localStorage
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
      } else {
        throw new Error(t('errors.invalidCredentials', 'Invalid username or password'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('errors.generic', 'An error occurred during login'));
      console.error(t('errors.loginFailed', 'Login error:'), error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(useTranslation().t('auth:errors.hookUsage', 'useAuth must be used within an AuthProvider'));
  }
  return context;
};

export default AuthContext;
