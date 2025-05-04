import { useState, useCallback, useEffect } from "react";

/**
 * Hook to manage state for the RecognizeFace component
 */
export const useRecognitionState = () => {
  // Image and file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [processingImage, setProcessingImage] = useState<boolean>(false);
  const [usingWebcam, setUsingWebcam] = useState<boolean>(false);

  // Guidance state
  const [poseGuidance, setPoseGuidance] = useState<string[]>([]);

  // Multi-shot mode state
  const [multiShotMode, setMultiShotMode] = useState<boolean>(false);
  const [multiShotImages, setMultiShotImages] = useState<string[]>([]);

  /**
   * Reset recognition state
   */
  const resetRecognitionState = useCallback(() => {
    // We only reset state that's related to recognition results
    // Not the image capture state itself
    setPoseGuidance([]);
  }, []);

  // Memory cleanup for large images on unmount
  useEffect(() => {
    return () => {
      // Clean up object URLs when component unmounts
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      // Clean up any multiShotImages URLs
      multiShotImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrl, multiShotImages]);

  return {
    selectedFile,
    setSelectedFile,
    previewUrl,
    setPreviewUrl,
    loading,
    setLoading,
    processingImage,
    setProcessingImage,
    usingWebcam,
    setUsingWebcam,
    poseGuidance,
    setPoseGuidance,
    multiShotMode,
    setMultiShotMode,
    multiShotImages,
    setMultiShotImages,
    resetRecognitionState,
  };
};

export default useRecognitionState;
