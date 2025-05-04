import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next";
import useRegisterFace from "../hooks/useRegisterFace";
import {
  FiCamera,
  FiRefreshCw,
  FiCheck,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import api from "../../../services/api";

interface WebcamFormProps {
  onSuccess?: (name: string) => void;
}

const WebcamForm: React.FC<WebcamFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation("register");
  const webcamRef = useRef<Webcam>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [webcamName, setWebcamName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [webcamCapture, setWebcamCapture] = useState<string | null>(null);
  const [personType, setPersonType] = useState<"man" | "child">("man");
  const [guardianName, setGuardianName] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useMultiAngle, setUseMultiAngle] = useState(true);

  useRegisterFace();

  const toggleCameraFacing = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleForm = () => {
    setPersonType((prev) => (prev === "man" ? "child" : "man"));
    setWebcamName("");
    setGuardianName("");
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const captureWebcamPhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setWebcamCapture(imageSrc);
      setRegisterError(null);
    } else {
      setRegisterError(
        t("error.webcamNotAvailable", "Webcam is not available")
      );
    }
  }, [t]);

  const resetCapture = () => {
    setWebcamCapture(null);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const resetForm = () => {
    setWebcamName("");
    setEmployeeId("");
    setDepartment("");
    setRole("");
    setGuardianName("");
    setWebcamCapture(null);
    setRegisterError(null);
    setRegisterSuccess(null);
  };

  const handleWebcamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Input validation
    if (!webcamName.trim()) {
      setRegisterError(t("error.nameRequired", "Name is required"));
      return;
    }

    if (!webcamCapture) {
      setRegisterError(
        t("error.photoRequired", "Please capture a photo first")
      );
      return;
    }

    setIsSubmitting(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      // Get the name based on person type
      const fullName =
        personType === "man" ? webcamName : `${webcamName} (${guardianName})`;

      // Convert the webcam capture to a file
      const photoFile = dataURLtoFile(
        webcamCapture,
        `face-registration-${Date.now()}.jpg`
      );

      // Register the face using the API
      const response = await api.registerFaceWithFile(fullName, photoFile, {
        employee_id: employeeId,
        department: department,
        role: role,
        train_multiple: useMultiAngle,
      });

      if (response.status === "success") {
        setRegisterSuccess(
          response.message || t("success", "Successfully registered!")
        );
        resetForm();
        if (onSuccess) {
          onSuccess(fullName);
        }
      } else {
        setRegisterError(
          response.message || t("error.failed", "Registration failed")
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError(
        error instanceof Error
          ? error.message
          : t("error.unknown", "An unknown error occurred")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert data URL to File object
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
    <form onSubmit={handleWebcamSubmit} className="space-y-6">
      <div className="flex justify-between">
        <button
          type="button"
          onClick={toggleForm}
          className="px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 flex items-center"
        >
          {personType === "man" ? (
            <>
              <FiUsers className="mr-2" />
              {t("form.switchToChild", "Switch to Child")}
            </>
          ) : (
            <>
              <FiUser className="mr-2" />
              {t("form.switchToMan", "Switch to Adult")}
            </>
          )}
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {personType === "man" ? (
          <>
            <div>
              <label className="block font-medium mb-1">
                {t("form.fullName", "Full Name")}
              </label>
              <input
                type="text"
                placeholder={t("form.fullNamePlaceholder", "Enter full name")}
                value={webcamName}
                onChange={(e) => setWebcamName(e.target.value)}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                {t("form.employeeId", "Employee ID (Optional)")}
              </label>
              <input
                type="text"
                placeholder={t(
                  "form.employeeIdPlaceholder",
                  "Enter employee ID"
                )}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">
                  {t("form.department", "Department (Optional)")}
                </label>
                <input
                  type="text"
                  placeholder={t(
                    "form.departmentPlaceholder",
                    "Enter department"
                  )}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t("form.role", "Role (Optional)")}
                </label>
                <input
                  type="text"
                  placeholder={t("form.rolePlaceholder", "Enter role")}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">
                {t("form.childName", "Child's Name")}
              </label>
              <input
                type="text"
                placeholder={t(
                  "form.childNamePlaceholder",
                  "Enter child's name"
                )}
                value={webcamName}
                onChange={(e) => setWebcamName(e.target.value)}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                {t("form.guardianName", "Guardian's Name")}
              </label>
              <input
                type="text"
                placeholder={t(
                  "form.guardianNamePlaceholder",
                  "Enter guardian's name"
                )}
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                required
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Webcam capture and preview area */}
      <div className="mb-8">
        {!webcamCapture ? (
          <div className="relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: cameraFacingMode,
                width: 640,
                height: 480,
              }}
              className="w-full h-auto rounded-lg border"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <button
                type="button"
                onClick={captureWebcamPhoto}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center"
              >
                <FiCamera className="mr-2" />
                {t("form.capturePhoto", "Capture Photo")}
              </button>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                {t("form.switchCamera", "Switch Camera")}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={webcamCapture}
              alt={t("form.preview", "Preview")}
              className="w-full h-auto rounded-lg border"
            />
            <button
              type="button"
              onClick={resetCapture}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2"
              title={t("form.retakePhoto", "Retake photo")}
            >
              <FiRefreshCw />
            </button>
          </div>
        )}
      </div>

      {/* Multi-angle training option */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="useMultiAngle"
          checked={useMultiAngle}
          onChange={(e) => setUseMultiAngle(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="useMultiAngle" className="ml-2 text-sm text-gray-600">
          {t("form.useMultiAngle", "Train with multiple angles (Recommended)")}
        </label>
      </div>

      {/* Error and success messages */}
      {registerError && (
        <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {registerError}
        </div>
      )}

      {registerSuccess && (
        <div className="mb-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded flex items-center">
          <FiCheck className="mr-2 text-green-500" />
          {registerSuccess}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !webcamCapture}
        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isSubmitting || !webcamCapture
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        }`}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            {t("form.processing", "Processing...")}
          </>
        ) : (
          <>
            <FiCheck className="mr-2" />
            {t("form.submit", "Register Face")}
          </>
        )}
      </button>
    </form>
  );
};

export default WebcamForm;
