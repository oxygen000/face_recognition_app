import React from "react";
import { FiUpload, FiCamera, FiLayers } from "react-icons/fi";
import { TFunction } from "i18next";

interface CaptureModeButtonsProps {
  captureMode: "upload" | "webcam" | "multi";
  setCaptureMode: (mode: "upload" | "webcam" | "multi") => void;
  resetState: () => void;
  t: TFunction;
}

const CaptureModeButtons: React.FC<CaptureModeButtonsProps> = ({
  captureMode,
  setCaptureMode,
  resetState,
  t,
}) => {
  const handleModeChange = (mode: "upload" | "webcam" | "multi") => {
    resetState();
    setCaptureMode(mode);
  };

  const buttons = [
    {
      mode: "upload" as const,
      icon: <FiUpload className="mr-2" />,
      label: t("uploadImage", "Upload Image"),
    },
    {
      mode: "webcam" as const,
      icon: <FiCamera className="mr-2" />,
      label: t("useWebcam", "Use Webcam"),
    },
    {
      mode: "multi" as const,
      icon: <FiLayers className="mr-2" />,
      label: t("multiCapture", "Multi Capture"),
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {buttons.map((button) => (
        <button
          key={button.mode}
          type="button"
          onClick={() => handleModeChange(button.mode)}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            captureMode === button.mode
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {button.icon}
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default CaptureModeButtons;
