import React from "react";

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hover?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  hover = false,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
}) => {
  const baseClasses = "bg-white rounded-lg shadow-md overflow-hidden";
  const hoverClasses = hover ? "transition-shadow duration-300 hover:shadow-lg" : "";

  const cardClasses = `${baseClasses} ${hoverClasses} ${className}`.trim();

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
          {title && (
            typeof title === "string" ? (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            ) : title
          )}
          {subtitle && (
            typeof subtitle === "string" ? (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            ) : subtitle
          )}
        </div>
      )}

      <div className={`px-6 py-4 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className={`px-6 py-4 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
