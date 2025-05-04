import { useState, useRef, useCallback } from "react";
import api from "../../../services/api";

// Define a type that represents the actual structure of our refs
type InputRef = {
  current: HTMLInputElement | null;
};

interface RegisterFaceHookResult {
  loading: boolean;
  error: string;
  success: boolean;
  message: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  nameRef: InputRef;
  employeeIdRef: InputRef;
  photoRef: InputRef;
  webcamCapture: string | null;
  setWebcamCapture: (capture: string | null) => void;
  registerWithWebcam: (name: string, employeeId?: string) => Promise<void>;
  resetForm: () => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleFileSelect: (file: File | null, previewUrl: string | null) => void;
  previewUrl: string | null;
}

/**
 * Custom hook for managing the RegisterFace component state and logic
 */
const useRegisterFace = (): RegisterFaceHookResult => {
  // Refs for form elements
  const nameRef = useRef<HTMLInputElement>(null);
  const employeeIdRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // States for webcam capture and file selection
  const [webcamCapture, setWebcamCapture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Handle file selection from ImagePreview component
   */
  const handleFileSelect = useCallback(
    (file: File | null, preview: string | null) => {
      setSelectedFile(file);
      setPreviewUrl(preview);
      // Reset error/success states
      setError("");
      setSuccess(false);
      setMessage("");
    },
    []
  );

  /**
   * Reset the form and state
   */
  const resetForm = useCallback(() => {
    setError("");
    setSuccess(false);
    setMessage("");
    setWebcamCapture(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    if (nameRef.current) nameRef.current.value = "";
    if (employeeIdRef.current) employeeIdRef.current.value = "";
    if (photoRef.current) photoRef.current.value = "";
  }, []);

  /**
   * Convert a data URL to a File
   */
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

  /**
   * Register with a webcam capture
   */
  const registerWithWebcam = useCallback(
    async (name: string, employeeId?: string) => {
      // Reset state
      setError("");
      setSuccess(false);
      setMessage("");

      // Validate data
      if (!name) {
        setError("Please enter your name");
        return;
      }

      if (!webcamCapture) {
        setError("Please capture a photo");
        return;
      }

      setLoading(true);

      try {
        // Convert webcam capture to file
        const photoFile = dataURLtoFile(webcamCapture, "webcam-capture.jpg");

        // Get the multi-angle training option value
        const multiAngleTrainingEl = document.getElementById(
          "webcamMultiAngleTraining"
        ) as HTMLInputElement;
        const useMultiAngleTraining = multiAngleTrainingEl
          ? multiAngleTrainingEl.checked
          : true;

        // Call the API to register the face
        const response = await api.registerFaceWithFile(name, photoFile, {
          employee_id: employeeId || "",
          train_multiple: useMultiAngleTraining, // Use the checkbox value
        });

        if (response.status === "success") {
          setSuccess(true);
          setMessage(
            response.message || `Successfully registered ${name} in the system!`
          );

          // Reset form data
          setWebcamCapture(null);
        } else {
          setError(
            response.message || "Registration failed for unknown reason"
          );
        }
      } catch (error) {
        console.error("Error during registration:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred during registration"
        );
      } finally {
        setLoading(false);
      }
    },
    [webcamCapture]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Reset state
      setError("");
      setSuccess(false);
      setMessage("");

      // Validate form
      if (!nameRef.current?.value) {
        setError("Please enter your name");
        return;
      }

      // Use either selected file from ImagePreview or from traditional input
      const photoFile = selectedFile || photoRef.current?.files?.[0];

      if (!photoFile) {
        setError("Please select a photo");
        return;
      }

      setLoading(true);

      try {
        const name = nameRef.current.value;
        const employeeId = employeeIdRef.current?.value || "";

        // Get the multi-angle training option value
        const multiAngleTrainingEl = document.getElementById(
          "multiAngleTraining"
        ) as HTMLInputElement;
        const useMultiAngleTraining = multiAngleTrainingEl
          ? multiAngleTrainingEl.checked
          : true;

        console.log("Starting face registration with options:", {
          name,
          employeeId,
          useMultiAngleTraining,
          photoFileSize: photoFile.size,
          photoFileType: photoFile.type,
        });

        // Call the API to register the face with file upload
        const response = await api.registerFaceWithFile(name, photoFile, {
          employee_id: employeeId,
          train_multiple: useMultiAngleTraining, // Use the checkbox value
          department: "", // Add empty department to match backend expectations
          role: "", // Add empty role to match backend expectations
        });

        if (response.status === "success") {
          setSuccess(true);
          setMessage(
            response.message || `Successfully registered ${name} in the system!`
          );

          // Reset form
          if (nameRef.current) nameRef.current.value = "";
          if (employeeIdRef.current) employeeIdRef.current.value = "";
          if (photoRef.current) photoRef.current.value = "";
          setSelectedFile(null);
          setPreviewUrl(null);
        } else {
          setError(
            response.message || "Registration failed for unknown reason"
          );
        }
      } catch (error) {
        console.error("Error during registration:", error);

        // Check if it's an API error with detailed information
        if (error instanceof Error) {
          // Try to extract more detailed error information
          type ApiError = { data?: { detail?: string; message?: string } };
          const errorData = (error as ApiError).data;
          if (errorData) {
            console.error("API error details:", errorData);

            // Use the most specific error message available
            const errorMessage =
              errorData.detail ||
              errorData.message ||
              error.message ||
              "Registration failed";

            setError(errorMessage);
          } else {
            setError(error.message || "Registration failed");
          }
        } else {
          setError("An unexpected error occurred during registration");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedFile]
  );

  return {
    loading,
    error,
    success,
    message,
    handleSubmit,
    nameRef,
    employeeIdRef,
    photoRef,
    webcamCapture,
    setWebcamCapture,
    registerWithWebcam,
    resetForm,
    selectedFile,
    setSelectedFile,
    handleFileSelect,
    previewUrl,
  };
};

export default useRegisterFace;
