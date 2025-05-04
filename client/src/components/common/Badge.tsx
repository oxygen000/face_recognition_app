import React from "react";

/**
 * Badge variants
 */
export type BadgeVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";

/**
 * Badge sizes
 */
export type BadgeSize = "sm" | "md" | "lg";

/**
 * Badge props
 */
export interface BadgeProps {
  /**
   * Badge variant
   */
  variant?: BadgeVariant;
  
  /**
   * Badge size
   */
  size?: BadgeSize;
  
  /**
   * Whether the badge is rounded
   */
  rounded?: boolean;
  
  /**
   * Whether the badge is outlined
   */
  outlined?: boolean;
  
  /**
   * Additional classes for the badge
   */
  className?: string;
  
  /**
   * Badge children
   */
  children: React.ReactNode;
}

/**
 * Badge component
 */
const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "md",
  rounded = false,
  outlined = false,
  className = "",
  children,
}) => {
  // Base classes
  const baseClasses = "inline-flex items-center font-medium";

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base",
  };

  // Variant classes (filled)
  const variantClasses = {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    light: "bg-gray-100 text-gray-800",
    dark: "bg-gray-800 text-white",
  };

  // Outlined variant classes
  const outlinedClasses = {
    primary: "border border-blue-500 text-blue-700",
    secondary: "border border-gray-500 text-gray-700",
    success: "border border-green-500 text-green-700",
    danger: "border border-red-500 text-red-700",
    warning: "border border-yellow-500 text-yellow-700",
    info: "border border-blue-500 text-blue-700",
    light: "border border-gray-300 text-gray-700",
    dark: "border border-gray-800 text-gray-800",
  };

  // Rounded classes
  const roundedClasses = rounded ? "rounded-full" : "rounded";

  // Combine classes
  const badgeClasses = [
    baseClasses,
    sizeClasses[size],
    outlined ? outlinedClasses[variant] : variantClasses[variant],
    roundedClasses,
    className,
  ].join(" ");

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};

export default Badge;
