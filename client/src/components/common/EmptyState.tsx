import React, { ReactNode } from "react";

interface EmptyStateProps {
  /**
   * Title text for the empty state
   */
  title: string;

  /**
   * Description text for the empty state
   */
  description?: string;

  /**
   * Icon to display
   */
  icon?: ReactNode;

  /**
   * Action button or link
   */
  action?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * EmptyState component for displaying when no data is available
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100 transition-all duration-300 ${className}`}
    >
      {icon && (
        <div className="mx-auto flex items-center justify-center h-16 w-16 mb-4 text-gray-400 transition-colors duration-300">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto transition-colors duration-300">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
