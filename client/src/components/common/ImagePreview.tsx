import React, { useState, useRef, ChangeEvent } from "react";
import AnimatedFaceIcon from "./AnimatedFaceIcon";
import { useTranslation } from "react-i18next";

interface ImagePreviewProps {
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  previewUrl: string | null;
  placeholderText?: string;
  acceptedFormats?: string;
  maxSize?: string;
  required?: boolean;
  className?: string;
  allowReset?: boolean;
  scanText?: string;
}

/**
 * A reusable component that shows an animated face icon placeholder
 * and allows uploading an image with preview functionality
 */
const ImagePreview: React.FC<ImagePreviewProps> = ({
  onImageChange,
  previewUrl,
  placeholderText = "Upload a photo",
  acceptedFormats = "image/*",
  maxSize = "10MB",
  required = false,
  className = "",
  allowReset = true,
  scanText = "Ready for scan",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIsLoading(true);

    if (file) {
      const url = URL.createObjectURL(file); // Create a preview URL for the image
      onImageChange(file, url);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } else {
      onImageChange(null, null);
      setIsLoading(false);
    }
  };

  // Reset the selected file and preview
  const resetImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageChange(null, null);
  };

  // Trigger the file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg text-center p-6 transition-all ${
          !previewUrl
            ? "hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
            : ""
        } relative overflow-hidden`}
        onClick={!previewUrl ? triggerFileInput : undefined}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="mt-2 text-blue-500 font-medium">
                {t("common.processing", "Processing...")}
              </span>
            </div>
          </div>
        )}

        {previewUrl ? (
          <div className="mb-3 flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-80 max-w-full object-contain rounded-lg shadow-md"
            />
            {allowReset && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetImage();
                }}
                className="mt-4 text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-full border border-red-200 hover:bg-red-50 transition-colors"
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {t("common.removeImage", "Remove Image")}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="py-4">
            <AnimatedFaceIcon size="md" text={scanText} />
            <p className="mt-2 text-sm text-gray-500">{placeholderText}</p>
            <p className="mt-1 text-xs text-gray-400">
              {acceptedFormats.replace(
                "image/*",
                t("common.imageFormats", "PNG, JPG, JPEG")
              )}{" "}
              {t("common.upTo", "up to")} {maxSize}
            </p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept={acceptedFormats}
          onChange={handleFileChange}
          className="hidden"
          required={required}
        />

       
      </div>
    </div>
  );
};

export default ImagePreview;
