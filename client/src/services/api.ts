import axios from "axios";
import {
  ApiResponse,
  RegistrationResponse as RegisterResponse,
  RecognitionResponse as RecognizeResponse,
  UserListResponse,
  User,
  FaceAnalysisResponse,
} from "../types";
import { processLargeImage } from "../components/RecognizeFace/imageUtils";

// Define an API error interface
interface ApiError extends Error {
  data?: unknown;
}

// API configuration - update with correct paths
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Log the server URL for debugging
console.log("API Configuration:", {
  API_URL,
  SERVER_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

// Fix the endpoint path to match the backend API structure
const getEndpointPath = (path: string): string => {
  // Create the full path
  let fullPath;

  // Check if path already has /api prefix
  if (path.startsWith("/api/")) {
    // Path already has /api prefix, use as is
    fullPath = `${SERVER_URL}${path}`;
  } else if (!path.startsWith("/")) {
    // If path doesn't start with /, add /api/ prefix
    fullPath = `${SERVER_URL}/api/${path}`;
  } else {
    // If path starts with / but not /api/, add /api prefix
    fullPath = `${SERVER_URL}/api${path}`;
  }

  console.log(`API Endpoint: ${fullPath}`);
  return fullPath;
};

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 30000; // 30 seconds
axios.defaults.headers.common = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Create an axios instance with retry capability
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
      config
    );
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} ${response.config.url}`,
      response.data ? true : false // Just log if data exists to avoid bloating console
    );
    return response;
  },
  (error) => {
    console.error("API Response Error:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
    }
    return Promise.reject(error);
  }
);

/**
 * Convert a file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Extract only the Base64 data part (remove the data URL prefix)
        const base64Data = reader.result.split(",")[1];

        if (!base64Data) {
          console.error(
            "Failed to extract base64 data from file",
            reader.result
          );
          reject(new Error("Failed to extract base64 data from file"));
          return;
        }

        console.log(
          `Base64 conversion successful. Data starts with: ${base64Data.substring(
            0,
            20
          )}...`
        );
        resolve(base64Data);
      } else {
        console.error("FileReader result is not a string", reader.result);
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };
  });
};

interface RegisterMetadata {
  employee_id?: string;
  department?: string;
  role?: string;
  train_multiple?: boolean;
  bypass_angle_check?: boolean;
}

/**
 * API health response
 */
interface HealthResponse extends ApiResponse {
  version?: string | null;
  uptime?: number | null;
}

const api = {
  /**
   * Get the base API URL
   * @returns {string} The base URL for API requests
   */
  getBaseUrl: (): string => {
    return API_URL;
  },

  /**
   * Get the base server URL (without /api)
   * @returns {string} The base server URL
   */
  getServerUrl: (): string => {
    return SERVER_URL;
  },

  /**
   * Register a new face with direct base64 data
   * @param {string} name - User's name
   * @param {string} imageBase64 - Base64 encoded image string
   * @param {RegisterMetadata} metadata - Additional user metadata
   * @returns {Promise<RegisterResponse>} Registration result
   */
  registerFace: async (
    name: string,
    imageBase64: string,
    metadata: RegisterMetadata = {}
  ): Promise<RegisterResponse> => {
    try {
      console.log("Registering face for user:", name);

      // Send the registration request - use the full API path to avoid double /api prefix
      const response = await axios.post(
        `${SERVER_URL}/api/register`,
        {
          name,
          image_base64: imageBase64,
          employee_id: metadata.employee_id,
          department: metadata.department,
          role: metadata.role,
          bypass_angle_check: metadata.bypass_angle_check,
          train_multiple: metadata.train_multiple !== false, // Enable by default unless explicitly disabled
        },
        {
          timeout: 60000, // Increase timeout to 60 seconds for larger images
        }
      );

      console.log("Registration successful:", response.data);

      // Log if multi-angle training was used
      if (response.data.multi_angle_trained) {
        console.log(
          "Successfully trained with multiple angles for better recognition"
        );
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Registration failed:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error("API Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
        });

        const e = new Error(
          error.response.data?.message ||
            error.response.data?.detail ||
            "Registration failed"
        ) as ApiError;
        e.data = error.response.data;
        throw e;
      }
      throw new Error((error as Error).message || "Registration failed");
    }
  },

  /**
   * Register a new face with file upload
   * @param {string} name - User's name
   * @param {File} photoFile - Photo file containing a face
   * @param {RegisterMetadata} metadata - Additional user metadata
   * @returns {Promise<RegisterResponse>} Registration result
   */
  registerFaceWithFile: async (
    name: string,
    photoFile: File,
    metadata: RegisterMetadata = {}
  ): Promise<RegisterResponse> => {
    try {
      console.log("Registering face with file for user:", name);

      // Compress the image before upload
      const compressedFile = await processLargeImage(photoFile);

      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("name", name);
      formData.append("file", compressedFile);

      // Add metadata if provided
      if (metadata.employee_id) {
        formData.append("employee_id", metadata.employee_id);
      }
      if (metadata.department) {
        formData.append("department", metadata.department);
      }
      if (metadata.role) {
        formData.append("role", metadata.role);
      }

      // Enable multi-angle training by default unless explicitly disabled
      if (metadata.train_multiple !== false) {
        formData.append("train_multiple", "true");
        console.log("Enabling multi-angle training for better recognition");
      } else {
        formData.append("train_multiple", "false");
      }

      if (metadata.bypass_angle_check) {
        formData.append("bypass_angle_check", "true");
      }

      // Send the registration request
      // Convert the file to base64 since the backend expects base64 data
      const base64Data = await fileToBase64(compressedFile);

      // Log the base64 data length for debugging
      console.log(`Base64 data length: ${base64Data.length} characters`);

      // Create the request payload
      const requestData = {
        name: name,
        image_base64: base64Data,
        employee_id: metadata.employee_id,
        department: metadata.department,
        role: metadata.role,
        train_multiple: metadata.train_multiple !== false,
        bypass_angle_check: metadata.bypass_angle_check,
      };

      // Send the request - use the full API path to avoid double /api prefix
      const response = await axios.post(
        `${SERVER_URL}/api/register`,
        requestData,
        {
          timeout: 60000, // Increase timeout to 60 seconds for larger images
        }
      );

      console.log("Registration successful:", response.data);

      // Log if multi-angle training was used
      if (response.data.multi_angle_trained) {
        console.log(
          "Successfully trained with multiple angles for better recognition"
        );
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Registration failed:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error("API Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
        });

        const e = new Error(
          error.response.data?.message ||
            error.response.data?.detail ||
            "Registration failed"
        ) as ApiError;
        e.data = error.response.data;
        throw e;
      }
      throw new Error((error as Error).message || "Registration failed");
    }
  },

  /**
   * Recognize a face
   * @param {File} imageFile - Image file containing a face to recognize
   * @param {Object} options - Additional options for recognition
   * @returns {Promise<RecognizeResponse>} Recognition result
   */
  recognizeFace: async (
    imageFile: File,
    options: {
      preferMethod?: "base64" | "file";
      useMultiAngle?: boolean;
    } = {}
  ): Promise<RecognizeResponse> => {
    try {
      // First compress the image to ensure reasonable size
      const compressedFile = await processLargeImage(imageFile);

      console.log("Recognition image prepared:", {
        size: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        name: compressedFile.name,
        type: compressedFile.type,
      });

      // Determine which method to try first based on options
      const tryBase64First = options.preferMethod !== "file";

      if (tryBase64First) {
        try {
          // First try the base64 approach
          const base64Data = await fileToBase64(compressedFile);

          // Send with appropriate content structure that server expects
          const response = await axios.post(
            getEndpointPath("/recognize"),
            {
              image_base64: base64Data,
              use_multi_angle: options.useMultiAngle !== false, // Enable by default
            },
            {
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        } catch (baseError) {
          console.log(
            "Base64 approach failed, trying file upload approach:",
            baseError
          );

          // If base64 approach fails, try the form data approach
          const formData = new FormData();
          formData.append("file", compressedFile);

          // Add options if specified
          if (options.useMultiAngle !== false) {
            formData.append("use_multi_angle", "true");
          }

          const response = await axios.post(
            getEndpointPath("/recognize"),
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        }
      } else {
        // Try file upload approach first
        try {
          const formData = new FormData();
          formData.append("file", compressedFile);

          // Add options if specified
          if (options.useMultiAngle !== false) {
            formData.append("use_multi_angle", "true");
          }

          const response = await axios.post(
            getEndpointPath("/recognize"),
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        } catch (fileError) {
          console.log(
            "File upload approach failed, trying base64 approach:",
            fileError
          );

          // Fall back to base64 approach
          const base64Data = await fileToBase64(compressedFile);

          // Send with appropriate content structure that server expects
          const response = await axios.post(
            getEndpointPath("/recognize"),
            {
              image_base64: base64Data,
              use_multi_angle: options.useMultiAngle !== false, // Enable by default
            },
            {
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        }
      }
    } catch (error) {
      console.error("Error recognizing face:", error);

      // Check if it's an API error with response data
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data;
        console.log("Recognition API error response:", responseData);

        // Return response data with error
        return {
          status: "error",
          recognized: false,
          message: responseData.message || "Recognition failed",
          diagnostic: {
            error_type: "api_error",
            face_detected: false,
            ...responseData,
          },
        };
      }

      // Handle file processing errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        status: "error",
        recognized: false,
        message: errorMessage,
        diagnostic: {
          error_type: "processing_error",
          error_message: errorMessage,
          face_detected: false,
        },
      };
    }
  },

  /**
   * Get a list of all registered users
   * @param {Object} options - Options for pagination
   * @param {number} options.page - Page number (starting from 1)
   * @param {number} options.limit - Number of items per page
   * @returns {Promise<UserListResponse>} User list response
   */
  getUsers: async (
    options = { page: 1, limit: 100 }
  ): Promise<UserListResponse> => {
    try {
      console.log("Calling getUsers API endpoint");

      // Use the correct API endpoint from the backend - avoid double /api prefix
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      const params = new URLSearchParams({
        page: options.page.toString(),
        limit: options.limit.toString(),
      });

      // Use getEndpointPath for consistent path formatting
      const response = await axios.get(
        getEndpointPath(`/users?${params.toString()}`),
        {
          signal: controller.signal,
          timeout: 20000,
        }
      );

      clearTimeout(timeoutId);

      console.log("Raw API response:", response.status);

      // Simple normalization to ensure users array exists
      const responseData = response.data || {};

      if (!responseData.users && Array.isArray(responseData.data)) {
        // Support both response formats (users or data)
        responseData.users = responseData.data;
      }

      if (!responseData.users || !Array.isArray(responseData.users)) {
        console.warn("Response missing users array, creating empty array");
        responseData.users = [];
      }

      if (!responseData.status) {
        responseData.status = "success";
      }

      return responseData;
    } catch (error) {
      console.error("Error getting users:", error);

      // Check if this is a timeout error
      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" ||
          error.message.includes("timeout") ||
          error.name === "AbortError");

      // Return a formatted error response
      return {
        status: "error",
        message: isTimeout
          ? "Request timed out when fetching users. Please try again."
          : error instanceof Error
          ? error.message
          : "Failed to fetch users",
        users: [],
      } as UserListResponse;
    }
  },

  /**
   * Get a specific user by ID
   * @param {string} userId - User ID to fetch
   * @returns {Promise<ApiResponse<User>>} User data response
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      console.log(`Fetching user with ID: ${userId}`);

      // Use the correct API endpoint with consistent path formatting
      const response = await axios.get(getEndpointPath(`/users/${userId}`), {
        timeout: 10000,
      });

      // Log the response for debugging
      console.log(`User API response status:`, response.status);

      // Normalize the response to ensure it has a consistent format
      const responseData = response.data || {};

      // If the response doesn't have a status field, add it
      if (!responseData.status) {
        responseData.status = "success";
      }

      // Support both response formats (user or data property)
      if (responseData.user && !responseData.data) {
        responseData.data = responseData.user;
      } else if (responseData.data && !responseData.user) {
        responseData.user = responseData.data;
      }

      return responseData;
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);

      // Check if it's an API error with response data
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data;
        return {
          status: "error",
          message:
            responseData.message || `Failed to fetch user with ID ${userId}`,
          ...responseData,
        };
      }

      // Return a formatted error response
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : `Failed to fetch user with ID ${userId}`,
      };
    }
  },

  /**
   * Get a user's image by user ID
   * @param {string} userId - User ID
   * @returns {Promise<string>} Image URL
   */
  getUserImage: async (userId: string): Promise<string> => {
    try {
      // Use the correct API endpoint from the backend
      // The backend serves user images at /api/users/{user_id}/image
      console.log(`Getting image for user with ID: ${userId}`);
      return `${SERVER_URL}/api/users/${userId}/image`;
    } catch (error) {
      console.error(`Error getting user ${userId} image:`, error);
      throw error;
    }
  },

  /**
   * Delete a user by ID
   * @param {string} userId - User ID to delete
   * @returns {Promise<ApiResponse>} Delete response
   */
  deleteUser: async (userId: string): Promise<ApiResponse> => {
    try {
      console.log(`Deleting user with ID: ${userId}`);
      // Use the correct API endpoint from the backend
      const response = await axios.delete(getEndpointPath(`/users/${userId}`));

      console.log(`Delete user API response:`, response.status);

      // Normalize response data
      const responseData = response.data || {};
      if (!responseData.status) {
        responseData.status = "success";
      }

      if (!responseData.message) {
        responseData.message = "User deleted successfully";
      }

      return responseData;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);

      // Check if it's an API error with response data
      if (axios.isAxiosError(error) && error.response?.data) {
        const responseData = error.response.data;
        return {
          status: "error",
          message:
            responseData.message || `Failed to delete user with ID ${userId}`,
          ...responseData,
        };
      }

      // Return a formatted error response
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : `Failed to delete user with ID ${userId}`,
      };
    }
  },

  /**
   * Analyze a face in an image
   * @param {File} imageFile - Image file containing a face to analyze
   * @param {Object} options - Additional options for analysis
   * @returns {Promise<FaceAnalysisResponse>} Face analysis results
   */
  analyzeFace: async (
    imageFile: File,
    options: { preferMethod?: "base64" | "file" } = {}
  ): Promise<FaceAnalysisResponse> => {
    try {
      // First compress the image
      const compressedFile = await processLargeImage(imageFile);
      console.log("Analyzing face with image:", {
        size: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        type: compressedFile.type,
        name: compressedFile.name,
      });

      // Determine which method to try first based on options
      const tryBase64First = options.preferMethod !== "file";

      if (tryBase64First) {
        try {
          // Try the base64 approach first
          const base64Data = await fileToBase64(compressedFile);

          // Make the API call
          const response = await axios.post(
            getEndpointPath("/analyze_face"),
            {
              image_base64: base64Data,
            },
            {
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        } catch (baseError) {
          console.log(
            "Base64 approach failed, trying file upload approach:",
            baseError
          );

          // Fall back to file upload approach
          const formData = new FormData();
          formData.append("file", compressedFile);

          const response = await axios.post(
            getEndpointPath("/analyze_face"),
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        }
      } else {
        // Try file upload approach first
        try {
          const formData = new FormData();
          formData.append("file", compressedFile);

          const response = await axios.post(
            getEndpointPath("/analyze_face"),
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        } catch (fileError) {
          console.log(
            "File upload approach failed, trying base64 approach:",
            fileError
          );

          // Fall back to base64 approach
          const base64Data = await fileToBase64(compressedFile);

          // Make the API call
          const response = await axios.post(
            getEndpointPath("/analyze_face"),
            {
              image_base64: base64Data,
            },
            {
              timeout: 30000, // 30 second timeout for larger images
            }
          );

          return response.data;
        }
      }
    } catch (error) {
      console.error("Error analyzing face:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        return error.response.data as FaceAnalysisResponse;
      }

      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        face_detected: false,
        analysis_success: false,
      };
    }
  },

  /**
   * Check API health/connectivity
   * @returns {Promise<HealthResponse>} API health response
   */
  checkHealth: async (): Promise<HealthResponse> => {
    try {
      // Use a direct API call to check health
      const response = await apiClient.get(getEndpointPath("/health"), {
        timeout: 5000, // Short timeout for health check
      });
      return response.data;
    } catch (error) {
      console.error("API health check failed:", error);

      return {
        status: "error",
        message: "API health check failed",
        version: null,
        uptime: null,
      };
    }
  },

  /**
   * Get API performance metrics
   * @returns {Promise<ApiResponse<Record<string, unknown>>>} API metrics data
   */
  getMetrics: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const response = await axios.get(getEndpointPath("/metrics"));
      return response.data;
    } catch (error) {
      console.error("Error getting API metrics:", error);
      throw error;
    }
  },

  /**
   * Clear API cache (admin only)
   * @returns {Promise<ApiResponse<Record<string, unknown>>>} Cache clear result
   */
  clearCache: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    try {
      const response = await axios.post(getEndpointPath("/cache/clear"));
      return response.data;
    } catch (error) {
      console.error("Error clearing API cache:", error);
      throw error;
    }
  },
};

export default api;
