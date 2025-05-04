import React, { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

/**
 * Alert variants
 */
export type AlertVariant = "success" | "error" | "warning" | "info";

/**
 * Alert props
 */
export interface AlertProps {
  /**
   * Alert variant
   */
  variant: AlertVariant;

  /**
   * Alert title
   */
  title?: string;

  /**
   * Alert message
   */
  message: string;

  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;

  /**
   * Callback when the alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Additional classes for the alert
   */
  className?: string;
}

/**
 * Alert component
 */
const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  dismissible = false,
  onDismiss,
  className = "",
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  // If dismissed, don't render anything
  if (dismissed) return null;

  // Variant classes for the background, text, and border
  const variantClasses = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  // Icon components corresponding to the variant
  const IconComponents = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertCircle,
    info: FiInfo,
  };

  // Get the icon component for the current variant
  const Icon = IconComponents[variant];

  // Handle dismiss action
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`p-4 rounded-lg border ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={`text-sm ${title ? "mt-2" : ""}`}>{message}</div>
        </div>
        {dismissible && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2"
            onClick={handleDismiss}
            aria-label={t("common.dismiss", "Dismiss")}
          >
            <span className="sr-only">{t("common.dismiss", "Dismiss")}</span>
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
