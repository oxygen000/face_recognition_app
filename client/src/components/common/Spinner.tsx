import React from "react";

/**
 * Spinner sizes
 */
export type SpinnerSize = "sm" | "md" | "lg" | "xl";

/**
 * Spinner colors
 */
export type SpinnerColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

/**
 * Spinner props
 */
export interface SpinnerProps {
  /**
   * Spinner size
   */
  size?: SpinnerSize;
  
  /**
   * Spinner color
   */
  color?: SpinnerColor;
  
  /**
   * Additional classes for the spinner
   */
  className?: string;
  
  /**
   * Whether to show a label
   */
  label?: string;
  
  /**
   * Whether to center the spinner
   */
  centered?: boolean;
}

/**
 * Spinner component
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  className = "",
  label,
  centered = false,
}) => {
  // Size classes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  
  // Color classes
  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    success: "text-green-600",
    danger: "text-red-600",
    warning: "text-yellow-500",
    info: "text-blue-400",
    light: "text-gray-300",
    dark: "text-gray-800",
  };
  
  // Combine classes
  const spinnerClasses = [
    "animate-spin",
    sizeClasses[size],
    colorClasses[color],
    className,
  ].join(" ");
  
  // Spinner element
  const spinnerElement = (
    <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  // If centered, wrap in a centered container
  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center">
        {spinnerElement}
        {label && (
          <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</span>
        )}
      </div>
    );
  }
  
  // If has label, wrap in a flex container
  if (label) {
    return (
      <div className="flex items-center">
        {spinnerElement}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
    );
  }
  
  // Otherwise, just return the spinner
  return spinnerElement;
};

export default Spinner;
