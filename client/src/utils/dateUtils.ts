/**
 * Format a date string into a readable format
 * @param dateString The date string to format
 * @param format The format to use (default, short, long)
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  format: "default" | "short" | "long" = "default"
): string => {
  try {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month:
        format === "short" ? "short" : format === "long" ? "long" : "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date error";
  }
};

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param dateString The date string to format
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  try {
    if (!dateString) return "Unknown time";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
      return "just now";
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }

    // Fallback to standard date format
    return formatDate(dateString, "short");
  } catch (error) {
    console.error("Error getting relative time:", error);
    return "Time error";
  }
};
