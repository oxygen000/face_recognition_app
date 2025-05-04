import React from "react";
import { IconType } from "react-icons";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

/**
 * PageHeader props
 */
interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;

  /**
   * Page subtitle
   */
  subtitle?: string;

  /**
   * Icon to display next to the title
   * Can be either an IconType (component reference) or a ReactNode (JSX element)
   */
  icon?: IconType | React.ReactNode;

  /**
   * Actions to display in the header
   */
  actions?: React.ReactNode;

  /**
   * Whether to show a back button
   */
  showBackButton?: boolean;

  /**
   * URL to navigate to when the back button is clicked
   */
  backUrl?: string;

  /**
   * Callback when the back button is clicked
   */
  onBack?: () => void;

  /**
   * Additional classes for the header
   */
  className?: string;
}

/**
 * PageHeader component
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  showBackButton = false,
  backUrl,
  onBack,
  className = "",
}) => {
  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  // Back button element
  const backButton =
    showBackButton &&
    (backUrl ? (
      <Link
        to={backUrl}
        className="mr-4 p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      >
        <FiArrowLeft className="h-5 w-5" />
      </Link>
    ) : (
      <button
        onClick={handleBackClick}
        className="mr-4 p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      >
        <FiArrowLeft className="h-5 w-5" />
      </button>
    ));

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {backButton}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            {Icon &&
              (typeof Icon === "function" ? (
                <Icon className="mr-2 h-7 w-7 text-blue-600" />
              ) : (
                <span className="mr-2">{Icon}</span>
              ))}
            {title}
          </h1>
        </div>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
      {subtitle && <p className="mt-2 text-gray-600 max-w-3xl">{subtitle}</p>}
    </div>
  );
};

export default PageHeader;
