import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import api from "../../services/api";
import { RecognizeResponse } from "../../types";
import ImagePreview from "../common/ImagePreview";
import FaceAnalysisDisplay from "./FaceAnalysisDisplay";

const RecognizeFace: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"upload" | "webcam">("upload");
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 500,
    height: 375,
    facingMode: cameraFacingMode,
  };

  const handleImageChange = (
    file: File | null,
    imagePreviewUrl: string | null
  ) => {
    setSelectedFile(file);
    setPreviewUrl(imagePreviewUrl);
    setResult(null);
    setApiError(null);
  };

  const captureFromWebcam = useCallback(() => {
    if (webcamRef.current && !previewUrl) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPreviewUrl(imageSrc);
        setResult(null);
        setApiError(null);
      }
    }
  }, [webcamRef, previewUrl]);

  const toggleCamera = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    try {
      let imageFile: File | null = null;

      if (captureMode === "upload") {
        if (!selectedFile) {
          setApiError("Please select an image first");
          return;
        }
        imageFile = selectedFile;
      } else if (previewUrl) {
        // Use the webcam image
        imageFile = dataURLtoFile(
          previewUrl,
          `webcam-capture-${Date.now()}.jpg`
        );
      } else {
        setApiError("Please capture an image first");
        return;
      }

      if (!imageFile) {
        setApiError("No valid image found");
        return;
      }

      setLoading(true);

      // Call the API's recognizeFace method with proper options
      const response = await api.recognizeFace(imageFile, {
        useMultiAngle: true,
        preferMethod: imageFile.size > 1024 * 1024 ? "file" : "base64",
      });

      console.log("Recognition response:", response);

      // Ensure we have a valid RecognizeResponse with recognized: boolean always set
      const typedResponse: RecognizeResponse = {
        ...response,
        recognized: !!response.recognized,
      };

      setResult(typedResponse);

      if (response.status === "error") {
        setApiError(response.message || "Recognition failed");
      }
    } catch (error) {
      console.error("Recognition error:", error);
      setApiError(
        error instanceof Error ? error.message : "Recognition failed"
      );

      // Create a properly typed error response
      const errorResponse: RecognizeResponse = {
        status: "error",
        recognized: false,
        message: error instanceof Error ? error.message : "Recognition failed",
      };

      setResult(errorResponse);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setApiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
          <h1 className="text-3xl font-bold text-center">
            {t("recognize.title", "Face Recognition")}
          </h1>
          <h2 className="text-xl font-semibold text-center mt-2 text-blue-100">
            {t(
              "recognize.description",
              "Upload a photo or take a snapshot to identify a registered person."
            )}
          </h2>
        </div>

        <div className="p-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setCaptureMode("upload");
                resetState();
              }}
              className={`py-2 px-4 font-medium ${
                captureMode === "upload"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
            >
              {t("recognize.uploadImage", "Upload Photo")}
            </button>
            <button
              onClick={() => {
                setCaptureMode("webcam");
                resetState();
              }}
              className={`py-2 px-4 font-medium ${
                captureMode === "webcam"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
            >
              {t("recognize.useWebcam", "Use Webcam")}
            </button>
          </div>

          <div className="mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {captureMode === "upload" ? (
                <ImagePreview
                  onImageChange={handleImageChange}
                  previewUrl={previewUrl}
                  placeholderText={t(
                    "recognize.uploadPhoto",
                    "Upload a photo to recognize"
                  )}
                  scanText={t("recognize.scanning", "Scanning for faces...")}
                  maxSize="10MB"
                  allowReset={true}
                  className="w-full"
                />
              ) : (
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="flex flex-col items-center">
                    {previewUrl ? (
                      <div className="mb-4 flex flex-col items-center">
                        <img
                          src={previewUrl}
                          alt="Captured"
                          className="max-h-80 rounded-lg shadow-md mb-2"
                        />
                        <button
                          type="button"
                          onClick={resetState}
                          className="mt-4 px-3 py-1.5 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
                        >
                          {t("recognize.retake", "Retake Photo")}
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={videoConstraints}
                          className="rounded-lg shadow-md"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          <button
                            type="button"
                            onClick={toggleCamera}
                            className="px-3 py-1.5 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 transition-all"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm9 9V7a1 1 0 10-2 0v4a1 1 0 102 0zM8 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={captureFromWebcam}
                            className="px-4 py-1.5 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100"
                            disabled={!!previewUrl}
                          >
                            {t("recognize.capture", "Capture")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {apiError && <div className="text-red-600">{apiError}</div>}

              <button
                type="submit"
                disabled={
                  loading ||
                  (captureMode === "webcam" && !previewUrl) ||
                  (captureMode === "upload" && !selectedFile)
                }
                className={`w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 focus:outline-none ${
                  (loading ||
                    (captureMode === "webcam" && !previewUrl) ||
                    (captureMode === "upload" && !selectedFile)) &&
                  "opacity-50 cursor-not-allowed"
                }`}
              >
                {loading
                  ? t("recognize.processing", "Processing...")
                  : t("recognize.submit", "Submit")}
              </button>
            </form>
          </div>

          {result && <FaceAnalysisDisplay result={result} />}
        </div>
      </div>
    </div>
  );
};

export default RecognizeFace;
