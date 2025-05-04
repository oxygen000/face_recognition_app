/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
  // Base API URL - change this to your actual backend URL
  BASE_URL: "http://localhost:8080/api",

  // Base server URL (without /api) - change this to your actual backend server
  SERVER_URL: "http://localhost:8080",

  // API timeout in milliseconds (30 seconds for face recognition operations which can be slower)
  TIMEOUT: 30000,

  // Force live mode, never use mock data - true to use only real API calls
  FORCE_LIVE: true,

  // Default headers
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Number of API retries on failure
  MAX_RETRIES: 3,

  // Retry delay in milliseconds (exponential backoff will be applied)
  RETRY_DELAY: 1000,

  // Enable response caching for GET requests
  ENABLE_CACHE: true,

  // Cache expiry time in milliseconds (5 minutes)
  CACHE_EXPIRY: 5 * 60 * 1000,

  // Maximum image size in bytes before compression (1MB)
  MAX_IMAGE_SIZE: 1024 * 1024,

  // Image compression quality (0-1)
  COMPRESSION_QUALITY: 0.8,

  // Request concurrency limit
  CONCURRENCY_LIMIT: 4,

  // Health check endpoint
  HEALTH_ENDPOINT: "/health",

  // Connection check interval in milliseconds (every 30 seconds)
  CONNECTION_CHECK_INTERVAL: 30 * 1000,

  // Fallback timeout for API operations in milliseconds
  FALLBACK_TIMEOUT: 5000,

  // Error handling settings
  ERROR_HANDLING: {
    // Show detailed error messages to user
    SHOW_DETAILED_ERRORS: false,

    // Log errors to console
    LOG_ERRORS: true,

    // Track error metrics
    TRACK_ERRORS: true,

    // Automatically retry failed operations
    AUTO_RETRY: true,
  },
};

// Authentication configuration
export const AUTH_CONFIG = {
  // Token storage key
  TOKEN_KEY: "auth_token",

  // User storage key
  USER_KEY: "user",

  // Token refresh interval in milliseconds (10 minutes)
  REFRESH_INTERVAL: 10 * 60 * 1000,

  // Token expiry buffer in milliseconds (5 minutes)
  EXPIRY_BUFFER: 5 * 60 * 1000,
};

// Application settings
export const APP_CONFIG = {
  // Application name
  APP_NAME: "Face Recognition App",

  // Default language (support both English and Arabic)
  DEFAULT_LANGUAGE: "en",

  // Available languages
  LANGUAGES: ["en", "ar"],

  // Enable bilingual interface
  ENABLE_BILINGUAL: true,

  // Enable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: true,

  // Theme (light or dark)
  THEME: "light",

  // Auto-retry failed face recognition
  AUTO_RETRY_RECOGNITION: true,

  // Maximum recognition attempts
  MAX_RECOGNITION_ATTEMPTS: 3,

  // Fail gracefully (show fallback UI) when backend is unavailable
  GRACEFUL_FAILURE: true,

  // Webcam settings
  WEBCAM: {
    // Default width
    WIDTH: 500,

    // Default height
    HEIGHT: 375,

    // Default facing mode
    FACING_MODE: "user",

    // Screenshot format
    SCREENSHOT_FORMAT: "image/jpeg",
  },
};

// Face recognition settings
export const FACE_RECOGNITION_CONFIG = {
  // Multi-angle mode enabled by default
  MULTI_ANGLE_MODE: true,

  // Number of angles to capture in multi-angle mode
  MULTI_ANGLE_COUNT: 3,

  // Show real-time pose guidance
  SHOW_POSE_GUIDANCE: true,

  // Confidence threshold for reliable recognition
  CONFIDENCE_THRESHOLD: 0.7,

  // Pose thresholds for optimal recognition
  POSE_THRESHOLDS: {
    YAW: 15, // Maximum degrees left/right
    PITCH: 15, // Maximum degrees up/down
    ROLL: 10, // Maximum degrees tilt
  },
};

// Experimental advanced settings
export const ADVANCED_CONFIG = {
  // Webcam capture quality (0-1)
  WEBCAM_QUALITY: 0.9,

  // Enable high-accuracy mode (when available)
  HIGH_ACCURACY_MODE: true,

  // Parallel processing for face recognition
  ENABLE_PARALLEL_PROCESSING: true,

  // Debug mode
  DEBUG_MODE: false,

  // Performance optimizations
  PERFORMANCE: {
    // Use WebWorker for image processing when available
    USE_WEB_WORKER: true,

    // Image processing optimizations
    OPTIMIZE_IMAGES: true,

    // Cache images in memory
    CACHE_IMAGES: true,
  },
};
