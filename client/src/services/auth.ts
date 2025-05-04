import axios from "axios";
import { API_CONFIG, AUTH_CONFIG } from "../config";

// API URL from environment or default
const API_URL = API_CONFIG.BASE_URL;

// Mock users for development (in a real app this would be in the backend)
const mockUsers = [
  {
    id: 1,
    email: "admin@example.com",
    password: "admin123", // In a real app, passwords would never be stored in plain text
    name: "Admin User",
    role: "admin",
  },
  {
    id: 2,
    email: "user@example.com",
    password: "user123",
    name: "Regular User",
    role: "user",
  },
];

// Auth service object
const AuthService = {
  // Login function
  login: async (email: string, password: string) => {
    try {
      // Try to use the real API first
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.token);
        localStorage.setItem(
          AUTH_CONFIG.USER_KEY,
          JSON.stringify(response.data.user)
        );
        return response.data;
      }
    } catch {
      // Only use mock data if FORCE_LIVE is false
      if (!API_CONFIG.FORCE_LIVE) {
        console.log("API login failed, using mock data for development");

        // Fall back to mock login for development
        const user = mockUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (user) {
          // Create a mock token (JWT format but not a real JWT)
          const mockToken = `mock_${btoa(
            JSON.stringify({
              id: user.id,
              email: user.email,
              role: user.role,
              exp: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
            })
          )}`;

          // Create user object without password
          const userWithoutPassword = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };

          // Store in localStorage
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
          localStorage.setItem(
            AUTH_CONFIG.USER_KEY,
            JSON.stringify(userWithoutPassword)
          );

          return {
            token: mockToken,
            user: userWithoutPassword,
          };
        }
      }

      throw new Error("Invalid credentials");
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  // Check if user is logged in
  isLoggedIn: () => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) return false;

    // If it's a mock token
    if (token.startsWith("mock_")) {
      try {
        const payload = JSON.parse(atob(token.substring(5)));
        // Check if token is expired
        return payload.exp > new Date().getTime();
      } catch {
        return false;
      }
    }

    // For real JWT tokens, we would check expiration
    // For simplicity, we're just checking if token exists
    return true;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  },

  // Register function
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });
      return response.data;
    } catch {
      if (API_CONFIG.FORCE_LIVE) {
        // If FORCE_LIVE is true, don't use mock data
        throw new Error("Registration failed. Try again later.");
      } else {
        // Otherwise log the failure and throw an error
        console.log("API register failed, mock registration not supported");
        throw new Error("Registration failed. Try again later.");
      }
    }
  },
};

export default AuthService;
