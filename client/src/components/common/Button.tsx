import React from "react";
import { IconType } from "react-icons";

/**
 * أنواع الأزرار المتاحة
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "ghost";

/**
 * أحجام الأزرار
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * خصائص مكون الزر
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconType;
  iconRight?: IconType;
  fullWidth?: boolean;
  rounded?: boolean;
  loading?: boolean;
  outlined?: boolean;
  children: React.ReactNode;
}

/**
 * مكون الزر
 */
const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  rounded = false,
  loading = false,
  outlined = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  // القواعد الأساسية
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-0 shadow-sm";

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-500",
    info: "bg-blue-400 hover:bg-blue-500 text-white focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-400",
    light: "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
    dark: "bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50 focus:ring-gray-300 dark:focus:ring-gray-600",
  };

  const outlinedVariants: Record<ButtonVariant, string> = {
    primary: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-500 dark:text-blue-400",
    secondary: "border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-500 dark:text-gray-400",
    success: "border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500 dark:border-green-500 dark:text-green-400",
    danger: "border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500 dark:border-red-500 dark:text-red-400",
    warning: "border border-yellow-500 text-yellow-500 hover:bg-yellow-50 focus:ring-yellow-500 dark:border-yellow-500 dark:text-yellow-400",
    info: "border border-blue-400 text-blue-400 hover:bg-blue-50 focus:ring-blue-400 dark:border-blue-400 dark:text-blue-300",
    light: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 dark:border-gray-600 dark:text-gray-300",
    dark: "border border-gray-800 text-gray-800 hover:bg-gray-100 focus:ring-gray-700 dark:border-gray-600 dark:text-gray-300",
    ghost: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30 focus:ring-gray-300 dark:focus:ring-gray-600",
  };

  const finalClass = [
    base,
    sizes[size],
    outlined ? outlinedVariants[variant] : variants[variant],
    fullWidth && "w-full",
    rounded ? "rounded-full" : "rounded-lg",
    isDisabled && "opacity-60 cursor-not-allowed",
    loading && "relative",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={finalClass} disabled={isDisabled} {...props}>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 014 12H0c0 3 1.1 5.8 3 7.9l3-2.6z" />
          </svg>
        </span>
      )}

      <span className={loading ? "invisible" : "inline-flex items-center"}>
        {Icon && <Icon className={`h-5 w-5 ${children ? "mr-2" : ""}`} />}
        {children}
        {IconRight && <IconRight className={`h-5 w-5 ${children ? "ml-2" : ""}`} />}
      </span>
    </button>
  );
};

export default Button;
