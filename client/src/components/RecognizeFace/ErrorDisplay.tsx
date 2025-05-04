import React from "react";
import { useTranslation } from "react-i18next";

interface ErrorDisplayProps {
  apiError: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ apiError }) => {
  const { t } = useTranslation("recognize");

  return (
    <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md mt-4">
      <h3 className="font-medium mb-1">{t("error.title", "Error")}</h3>
      <p>{apiError}</p>
    </div>
  );
};

export default ErrorDisplay;
