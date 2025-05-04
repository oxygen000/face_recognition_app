import React from "react";
import Webcam from "react-webcam";
import { TFunction } from "i18next";

interface WebcamCaptureProps {
  webcamRef: React.RefObject<Webcam | null>;
  previewUrl: string | null;
  videoConstraints: {
    width: number;
    height: number;
    facingMode: string;
  };
  captureFromWebcam: () => void;
  resetState: () => void;
  t: TFunction;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  webcamRef,
  previewUrl,
  videoConstraints,
  captureFromWebcam,
  resetState,
  t,
}) => {
  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <>
          <Webcam
            audio={false}
            height={375}
            ref={webcamRef as React.RefObject<Webcam>}
            screenshotFormat="image/jpeg"
            width={500}
            videoConstraints={videoConstraints}
            className="w-full rounded-lg shadow-md"
          />
          <button
            type="button"
            onClick={captureFromWebcam}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500"
          >
            {t("recognize.capture", "Capture")}
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <img
              src={previewUrl}
              alt={t("recognize.webcamCapture", "Webcam Capture")}
              className="w-full rounded-lg shadow-md"
            />
            <button
              type="button"
              onClick={resetState}
              className="mt-4 w-full py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300"
            >
              {t("recognize.retake", "Retake")}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WebcamCapture;
