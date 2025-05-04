import { useState, useCallback } from "react";
import { User } from "../../../types";
import api from "../../../services/api";
import { processLargeImage } from "../imageUtils";
import { useRecognitionState } from "./useRecognitionState";
import { FaceAnalysis, DiagnosticInfo } from "../types";

interface UseFaceRecognitionProps {
  resetRecognitionState: () => void;
  setProcessingImage: (value: boolean) => void;
}

/**
 * Hook to handle the face recognition logic and state
 */
export const useFaceRecognition = ({
  resetRecognitionState,
  setProcessingImage,
}: UseFaceRecognitionProps) => {
  const {
    selectedFile,
    setSelectedFile,
    setPreviewUrl,
    setLoading,
    multiShotMode,
    multiShotImages,
    setPoseGuidance,
  } = useRecognitionState();

  // Recognition state
  const [error, setError] = useState<string>("");
  const [recognized, setRecognized] = useState<boolean>(false);
  const [recognizedUser, setRecognizedUser] = useState<User | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isPossibleMatch, setIsPossibleMatch] = useState<boolean>(false);

  // Diagnostic state
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(
    null
  );
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [usedMultiAngle, setUsedMultiAngle] = useState<boolean>(false);

  /**
   * Handle image capture callback from ImageCapture component
   */
  const handleImageCaptured = useCallback(
    (file: File | null, preview: string | null) => {
      if (!file || !preview) {
        console.warn("Image capture was null or incomplete.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(preview);
    },
    [setSelectedFile, setPreviewUrl]
  );

  /**
   * Handle form submission for face recognition
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!selectedFile && multiShotImages.length === 0) {
        setError("Please select an image or take at least one snapshot");
        return;
      }

      setLoading(true);
      setProcessingImage(true);
      resetRecognitionState();

      // Reset recognition-specific state
      setRecognized(false);
      setRecognizedUser(null);
      setError("");
      setIsPossibleMatch(false);
      setDiagnosticInfo(null);
      setFaceAnalysis(null);
      setPoseGuidance([]);
      setUsedMultiAngle(false);

      if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
        console.log(
          `Processing large file for recognition (${(
            selectedFile.size /
            (1024 * 1024)
          ).toFixed(2)}MB)`
        );
      }

      try {
        let fileToRecognize: File;

        if (multiShotMode && multiShotImages.length > 0 && !selectedFile) {
          const response = await fetch(multiShotImages[0]);
          const blob = await response.blob();
          fileToRecognize = new File([blob], "webcam-capture.jpg", {
            type: "image/jpeg",
          });

          fileToRecognize = await processLargeImage(fileToRecognize);
          console.log("Using webcam capture for recognition:", {
            size: `${(fileToRecognize.size / 1024).toFixed(2)} KB`,
            type: fileToRecognize.type,
          });
        } else if (selectedFile) {
          fileToRecognize = selectedFile;
          console.log("Using uploaded file for recognition:", {
            name: fileToRecognize.name,
            size: `${(fileToRecognize.size / 1024).toFixed(2)} KB`,
            type: fileToRecognize.type,
            lastModified: new Date(fileToRecognize.lastModified).toISOString(),
          });
        } else {
          setError("No valid image found");
          setLoading(false);
          setProcessingImage(false);
          return;
        }

        window.requestAnimationFrame(async () => {
          try {
            console.log("Sending recognition request...");

            const response = await api.recognizeFace(fileToRecognize, {
              useMultiAngle: true,
              preferMethod:
                fileToRecognize.size > 1024 * 1024 ? "file" : "base64",
            });

            console.log("Recognition response:", response);

            if (response.status === "success" && response.recognized) {
              setRecognized(true);

              if (response.user) {
                console.log("User data:", response.user);
                setRecognizedUser(response.user);
              }

              setConfidence(response.confidence || 0);
              setIsPossibleMatch(false);

              if (response.diagnostic && response.diagnostic.face_analysis) {
                setFaceAnalysis(response.diagnostic.face_analysis);

                if (response.diagnostic.pose_recommendation) {
                  setPoseGuidance(
                    Array.isArray(response.diagnostic.pose_recommendation)
                      ? response.diagnostic.pose_recommendation
                      : [response.diagnostic.pose_recommendation]
                  );
                }
              }

              if (response.diagnostic) {
                setDiagnosticInfo(response.diagnostic);

                if (response.diagnostic.used_multi_angle) {
                  setUsedMultiAngle(true);
                  console.log(
                    "Recognition used multi-angle encodings for better accuracy"
                  );
                }
              }
            } else {
              setError(response.message || "Face not recognized");

              if (response.diagnostic) {
                setDiagnosticInfo(response.diagnostic);

                if (response.diagnostic.face_analysis) {
                  setFaceAnalysis(response.diagnostic.face_analysis);

                  if (response.diagnostic.pose_recommendation) {
                    setPoseGuidance(
                      Array.isArray(response.diagnostic.pose_recommendation)
                        ? response.diagnostic.pose_recommendation
                        : [response.diagnostic.pose_recommendation]
                    );
                  }
                }
              }
            }
          } catch (error: unknown) {
            console.error("Recognition error:", error);
            setError(
              error instanceof Error ? error.message : "Face recognition failed"
            );
          } finally {
            setLoading(false);
            setProcessingImage(false);
          }
        });
      } catch (error: unknown) {
        console.error("Pre-processing error:", error);
        setError("Error preparing image for recognition");
        setLoading(false);
        setProcessingImage(false);
      }
    },
    [
      selectedFile,
      multiShotMode,
      multiShotImages,
      resetRecognitionState,
      setLoading,
      setProcessingImage,
      setPoseGuidance,
    ]
  );

  return {
    error,
    recognized,
    recognizedUser,
    confidence,
    isPossibleMatch,
    diagnosticInfo,
    faceAnalysis,
    usedMultiAngle,
    handleImageCaptured,
    handleSubmit,
  };
};

export default useFaceRecognition;
