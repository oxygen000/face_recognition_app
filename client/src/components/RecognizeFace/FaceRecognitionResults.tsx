import React, { useState } from "react";
import { TFunction } from "i18next";

interface FaceRecognitionResultsProps {
  t: TFunction;
  multiCaptures: string[];
  captureMultiple: () => void;
}

const FaceRecognitionResults: React.FC<FaceRecognitionResultsProps> = ({
  t,
  multiCaptures,
  captureMultiple,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureMultiple = () => {
    setIsCapturing(true);
    captureMultiple();

    // Reset the capturing state after the expected completion time (3 seconds for 3 images)
    setTimeout(() => {
      setIsCapturing(false);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleCaptureMultiple}
        type="button"
        disabled={isCapturing}
        className={`w-full py-3 text-white font-semibold rounded-lg shadow-md transition duration-300 ${
          isCapturing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        {isCapturing
          ? t("capturing", "Capturing...")
          : t("captureMultiple", "Capture Multiple Photos")}
      </button>

      {multiCaptures.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {multiCaptures.map((src, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden shadow-md"
            >
              <img
                src={src}
                alt={`Capture ${index + 1}`}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-sm p-1 px-2">
                {t("captureNumber", "Capture {{number}}", {
                  number: index + 1,
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {multiCaptures.length > 0 && (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            {t("multiCaptureReady", "Multiple captures ready")}
          </h3>
          <p className="text-sm text-blue-600 mb-2">
            {t(
              "multiCaptureHint",
              "Multiple angle captures improve recognition accuracy. Click submit to process all captures."
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceRecognitionResults;
