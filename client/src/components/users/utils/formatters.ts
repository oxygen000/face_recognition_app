import { User, UserActivityStatus, UserStatus } from "../types";

/**
 * Format a date string into a readable format with caching for better performance
 */
export const formatDate = (() => {
  const cache: Record<string, string> = {};

  return (
    dateString: string | undefined,
    includeTime = false,
    locale = "en-US"
  ): string => {
    if (!dateString) return "—";

    // Create cache key that includes all parameters
    const cacheKey = `${dateString}-${includeTime}-${locale}`;

    // Return from cache if available
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };

      if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
      }

      const result = new Intl.DateTimeFormat(locale, options).format(date);

      // Cache the result
      cache[cacheKey] = result;
      return result;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };
})();

/**
 * Format a date to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (() => {
  const cache: Record<string, string> = {};
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  return (dateString: string | undefined): string => {
    if (!dateString) return "never";

    // Check cache every 5 minutes for recent dates
    const now = new Date();
    const cacheKey = `${dateString}-${Math.floor(
      now.getTime() / (5 * MINUTE)
    )}`;

    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const diff = now.getTime() - date.getTime();

      let result: string;

      if (diff < MINUTE) {
        result = "just now";
      } else if (diff < HOUR) {
        const minutes = Math.floor(diff / MINUTE);
        result = rtf.format(-minutes, "minute");
      } else if (diff < DAY) {
        const hours = Math.floor(diff / HOUR);
        result = rtf.format(-hours, "hour");
      } else if (diff < WEEK) {
        const days = Math.floor(diff / DAY);
        result = rtf.format(-days, "day");
      } else if (diff < MONTH) {
        const weeks = Math.floor(diff / WEEK);
        result = rtf.format(-weeks, "week");
      } else if (diff < YEAR) {
        const months = Math.floor(diff / MONTH);
        result = rtf.format(-months, "month");
      } else {
        const years = Math.floor(diff / YEAR);
        result = rtf.format(-years, "year");
      }

      cache[cacheKey] = result;
      return result;
    } catch (error) {
      console.error("Error formatting relative time:", error);
      return "Date error";
    }
  };
})();

/**
 * Calculate user activity status based on last login date
 *
 * @param user The user object to check
 * @returns Activity status: 'today', 'recent', 'inactive', or 'never'
 */
export const getUserActivityStatus = (user: User): UserActivityStatus => {
  if (!user || !user.last_login) return "never";

  const daysAgo = Math.floor(
    (Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAgo === 0) return "today";
  if (daysAgo <= 7) return "recent";
  return "inactive";
};

/**
 * Get color class based on user activity status
 */
export const getActivityStatusColor = (status: UserActivityStatus): string => {
  switch (status) {
    case "today":
      return "text-green-600 dark:text-green-400";
    case "recent":
      return "text-blue-600 dark:text-blue-400";
    case "inactive":
      return "text-amber-600 dark:text-amber-400";
    case "never":
      return "text-gray-500 dark:text-gray-400";
    default:
      return "text-gray-500 dark:text-gray-400";
  }
};

/**
 * Get color class based on user status
 */
export const getUserStatusColor = (status?: UserStatus): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "locked":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

/**
 * Generate user avatar initials from name
 *
 * @param name User's full name
 * @returns Initials (up to 2 characters)
 */
export const getInitials = (name?: string): string => {
  if (!name) return "??";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Build the user's image URL
 *
 * @param user User object
 * @param apiUrl Base API URL
 * @returns Complete image URL
 */
export const getUserImageUrl = (user: User, apiUrl?: string): string => {
  if (!user) return "";

  // Default base URL if not provided
  const baseUrl =
    apiUrl || import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Use user ID to fetch image from API
  if (user.id) {
    return `${baseUrl}/api/users/${user.id}/image`;
  }

  // Fallback to image_path or image_url if available
  if (user.image_path) {
    // Check if it's a full URL or a relative path
    if (user.image_path.startsWith("http")) {
      return user.image_path;
    } else {
      // Assume it's a relative path and prepend the API server URL
      return `${baseUrl}/${user.image_path.replace(/^\//, "")}`;
    }
  }

  if (user.image_url) {
    // Check if it's a full URL or a relative path
    if (user.image_url.startsWith("http")) {
      return user.image_url;
    } else {
      // Assume it's a relative path and prepend the API server URL
      return `${baseUrl}/${user.image_url.replace(/^\//, "")}`;
    }
  }

  return "";
};

/**
 * Format a user's full name with additional information
 */
export const formatUserName = (user: User, includeId = false): string => {
  if (!user) return "";

  let result = user.name || "";

  if (includeId && user.employee_id) {
    result += ` (${user.employee_id})`;
  }

  return result;
};

/**
 * Format a percentage value
 */
export const formatPercentage = (value?: number): string => {
  if (value === undefined || value === null) return "—";
  return `${Math.round(value)}%`;
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (user: User): number => {
  if (!user) return 0;

  const fields = [
    user.name,
    user.email,
    user.phone,
    user.department,
    user.role,
    user.employee_id,
    user.image_url || user.image_path,
  ];

  const filledFields = fields.filter((field) => !!field).length;
  return Math.round((filledFields / fields.length) * 100);
};
