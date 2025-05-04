import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import api from "../../services/api";
import { RecognizeResponse } from "../../types";
import CaptureModeButtons from "./CaptureModeButtons";
import WebcamCapture from "./WebcamCapture";
import FileUpload from "./FileUpload";
import FaceRecognitionResults from "./FaceRecognitionResults";
import ErrorDisplay from "./ErrorDisplay";
import { getUserImageUrl } from "../users/utils/formatters";
import { Link } from "react-router-dom";

const RecognizeFace: React.FC = () => {
  const { t } = useTranslation("recognize");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognizeResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"upload" | "webcam" | "multi">(
    "upload"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [multiCaptures, setMultiCaptures] = useState<string[]>([]);

  const webcamRef = useRef<Webcam | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 500,
    height: 375,
    facingMode: "user",
  };

  useEffect(() => {
    if (captureMode === "multi" && !webcamRef.current) {
      setCaptureMode("multi");
    }
  }, [captureMode]);

  const captureMultiple = useCallback(() => {
    if (!webcamRef.current) {
      setApiError(
        t("error.webcamNotReady", "Webcam is not ready. Please try again.")
      );
      return;
    }

    const captures: string[] = [];
    setMultiCaptures([]);
    setResult(null);
    setApiError(null);

    const takeSnapshot = (index: number) => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        captures.push(imageSrc);
        setMultiCaptures([...captures]);
      } else {
        setApiError(
          t("error.captureFailure", "Failed to capture image from webcam")
        );
      }

      if (index < 2) {
        setTimeout(() => takeSnapshot(index + 1), 1000);
      }
    };

    takeSnapshot(0);
  }, [t]);

  const handleImageChange = (
    file: File | null,
    imagePreviewUrl: string | null
  ) => {
    setSelectedFile(file);
    setPreviewUrl(imagePreviewUrl);
    setResult(null);
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    try {
      setLoading(true);

      // Handle different capture modes
      if (captureMode === "multi" && multiCaptures.length > 0) {
        // Process multiple captures for better recognition
        const results: RecognizeResponse[] = [];
        let bestMatch: RecognizeResponse | null = null;

        // Process each capture
        for (const capture of multiCaptures) {
          const imageFile = dataURLtoFile(
            capture,
            `webcam-capture-${Date.now()}.jpg`
          );

          const response = await api.recognizeFace(imageFile, {
            useMultiAngle: true,
            preferMethod: "base64",
          });

          const typedResponse: RecognizeResponse = {
            ...response,
            recognized: !!response.recognized,
          };

          results.push(typedResponse);

          // Track the best match (highest confidence)
          if (
            typedResponse.recognized &&
            typedResponse.confidence &&
            (!bestMatch ||
              !bestMatch.confidence ||
              typedResponse.confidence > bestMatch.confidence)
          ) {
            bestMatch = typedResponse;
          }
        }

        // Use the best match as the result
        if (bestMatch) {
          setResult(bestMatch);
        } else {
          // No matches found in any of the captures
          setResult({
            status: "error",
            recognized: false,
            message: t(
              "error.notRecognized",
              "Face not recognized in any of the captures"
            ),
          });
        }
      } else {
        // Handle single image recognition (upload or webcam)
        let imageFile: File | null = null;

        if (captureMode === "upload" && selectedFile) {
          imageFile = selectedFile;
        } else if (previewUrl) {
          imageFile = dataURLtoFile(
            previewUrl,
            `webcam-capture-${Date.now()}.jpg`
          );
        } else {
          setApiError(
            t("error.noImage", "Please capture or upload an image first")
          );
          setLoading(false);
          return;
        }

        const response = await api.recognizeFace(imageFile, {
          useMultiAngle: true,
          preferMethod: imageFile.size > 1024 * 1024 ? "file" : "base64",
        });

        const typedResponse: RecognizeResponse = {
          ...response,
          recognized: !!response.recognized,
        };

        setResult(typedResponse);

        if (response.status === "error") {
          setApiError(
            response.message || t("error.general", "Recognition failed")
          );
        }
      }
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : t("error.general", "Recognition failed")
      );
      setResult({
        status: "error",
        recognized: false,
        message:
          error instanceof Error
            ? error.message
            : t("error.general", "Recognition failed"),
      });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setApiError(null);
    setMultiCaptures([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white">
          <h1 className="text-3xl font-bold text-center">
            {t("title", "Face Recognition")}
          </h1>
          <h2 className="text-xl font-semibold text-center mt-2 text-blue-100">
            {t(
              "description",
              "Upload a photo or take a snapshot to identify a registered person."
            )}
          </h2>
        </div>

        <div className="p-6">
          <CaptureModeButtons
            captureMode={captureMode}
            setCaptureMode={setCaptureMode}
            resetState={resetState}
            t={t}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {captureMode === "upload" ? (
              <FileUpload
                onImageChange={handleImageChange}
                previewUrl={previewUrl}
                t={t}
              />
            ) : captureMode === "webcam" ? (
              <WebcamCapture
                webcamRef={webcamRef}
                previewUrl={previewUrl}
                videoConstraints={videoConstraints}
                captureFromWebcam={() =>
                  setPreviewUrl(webcamRef.current?.getScreenshot() || null)
                }
                resetState={resetState}
                t={t}
              />
            ) : (
              <>
                <div className="mb-4">
                  <Webcam
                    audio={false}
                    height={375}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={500}
                    videoConstraints={videoConstraints}
                    className="w-full rounded-lg shadow-md mx-auto"
                  />
                </div>
                <FaceRecognitionResults
                  multiCaptures={multiCaptures}
                  captureMultiple={captureMultiple}
                  t={t}
                />
              </>
            )}

            {apiError && <ErrorDisplay apiError={apiError} />}

            {/* Display recognition results when available */}
            {result && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-2">
                  {result.recognized
                    ? t("recognize.result.title", "Face Recognized!")
                    : t("recognize.error.notRecognized", "Face not recognized")}
                </h3>

                {result.recognized && result.user && (
                  <Link to={`/users/${result.user.id}`}>
                    <div className="space-y-2">
                      {/* صورة المستخدم */}
                      <div>
                      <img
                        src={
                          result.user.image ||
                          getUserImageUrl(result.user, api.getServerUrl())
                        }
                        alt={result.user.name}
                        className="w-32 h-32 object-cover rounded-full border border-gray-300 mb-2"
                        onError={(e) => {
                          (
                            e.target as HTMLImageElement
                          ).src = `${api.getServerUrl()}/static/default-avatar.png`;
                        }}
                      />
                    </div>

                    <p>
                      <span className="font-medium">
                        {t("recognize.result.name", "Name:")}
                      </span>{" "}
                      {result.user.name}
                    </p>
                    {result.user.employee_id && (
                      <p>
                        <span className="font-medium">
                          {t("recognize.result.id", "Employee ID:")}
                        </span>{" "}
                        {result.user.employee_id}
                      </p>
                    )}
                    {result.user.department && (
                      <p>
                        <span className="font-medium">
                          {t("recognize.result.department", "Department:")}
                        </span>{" "}
                        {result.user.department}
                      </p>
                    )}
                    {result.user.role && (
                      <p>
                        <span className="font-medium">
                          {t("recognize.result.role", "Role:")}
                        </span>{" "}
                        {result.user.role}
                      </p>
                    )}
                    {result.confidence && (
                      <p>
                        <span className="font-medium">
                          {t("recognize.result.confidence", "Confidence:")}
                        </span>{" "}
                        {(result.confidence * 100).toFixed(2)}%
                      </p>
                    )}
                    </div>
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (captureMode === "webcam" && !previewUrl) ||
                (captureMode === "upload" && !selectedFile) ||
                (captureMode === "multi" && multiCaptures.length === 0)
              }
              className={`w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-500 focus:outline-none ${
                loading ||
                (captureMode === "webcam" && !previewUrl) ||
                (captureMode === "upload" && !selectedFile) ||
                (captureMode === "multi" && multiCaptures.length === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading
                ? t("recognize.processing", "Processing...")
                : t("recognize.submit", "Submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecognizeFace;
