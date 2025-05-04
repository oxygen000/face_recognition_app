import React, { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import { FiCheck, FiUser, FiUsers } from "react-icons/fi";
import ImagePreview from "../../common/ImagePreview";

interface UploadFormProps {
  onSuccess?: (name: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation("register");

  // Form state
  const [name, setName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useMultiAngle, setUseMultiAngle] = useState(true);
  const [personType, setPersonType] = useState<"adult" | "child">("adult");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (file: File | null, imageUrl: string | null) => {
    setSelectedFile(file);
    setPreviewUrl(imageUrl);
    setError(null);
  };

  const togglePersonType = () => {
    setPersonType((prev) => (prev === "adult" ? "child" : "adult"));
    setError(null);
  };

  const resetForm = () => {
    setName("");
    setGuardianName("");
    setEmployeeId("");
    setDepartment("");
    setRole("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError(t("error.nameRequired", "Name is required"));
      return;
    }

    if (personType === "child" && !guardianName.trim()) {
      setError(t("error.guardianRequired", "Guardian name is required"));
      return;
    }

    if (!selectedFile) {
      setError(t("error.photoRequired", "Please upload a photo"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format the name based on person type
      const formattedName =
        personType === "adult" ? name : `${name} (${guardianName})`;

      // Call API to register face
      const response = await api.registerFaceWithFile(
        formattedName,
        selectedFile,
        {
          employee_id: employeeId,
          department: department,
          role: role,
          train_multiple: useMultiAngle,
        }
      );

      if (response.status === "success") {
        setSuccess(
          response.message || t("success", "Successfully registered!")
        );

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(formattedName);
        }

        // Reset form
        resetForm();
      } else {
        setError(response.message || t("error.failed", "Registration failed"));
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("error.unknown", "An unknown error occurred")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Person type toggle button */}
      <button
        type="button"
        onClick={togglePersonType}
        className="px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 flex items-center"
      >
        {personType === "adult" ? (
          <>
            <FiUsers className="mr-2" />
            {t("form.switchToChild", "Switch to Child ")}
          </>
        ) : (
          <>
            <FiUser className="mr-2" />
            {t("form.switchToAdult", "Switch to Adult ")}
          </>
        )}
      </button>

      <div className="space-y-4">
        {/* Conditional form fields based on person type */}
        {personType === "adult" ? (
          // Adult form fields
          <>
            <div>
              <label className="block font-medium mb-1">
                {t("form.fullName", "Full Name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("form.fullNamePlaceholder", "Enter full name")}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                {t("form.employeeId", "Employee ID (Optional)")}
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder={t(
                  "form.employeeIdPlaceholder",
                  "Enter employee ID"
                )}
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
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={t(
                    "register.form.departmentPlaceholder",
                    "Enter department"
                  )}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t("register.form.role", "Role (Optional)")}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={t("register.form.rolePlaceholder", "Enter role")}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </>
        ) : (
          // Child form fields
          <>
            <div>
              <label className="block font-medium mb-1">
                {t("register.form.childName", "Child's Name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(
                  "register.form.childNamePlaceholder",
                  "Enter child's name"
                )}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                {t("register.form.guardianName", "Guardian's Name")}
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder={t(
                  "register.form.guardianNamePlaceholder",
                  "Enter guardian's name"
                )}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </>
        )}

        {/* Image upload (common to both forms) */}
        <div className="mt-6">
          <div className="mb-4">
            <label className="block font-medium mb-1">
              {t("form.photo", "Upload Photo")}
            </label>
            <ImagePreview
              onImageChange={handleImageChange}
              previewUrl={previewUrl}
              placeholderText={t(
                "form.photoDesc",
                "Upload a clear photo of your face"
              )}
              acceptedFormats="image/*"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="multiAngleTraining"
              checked={useMultiAngle}
              onChange={(e) => setUseMultiAngle(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor="multiAngleTraining"
              className="ml-2 text-sm text-gray-600"
            >
              {t(
                "form.useMultiAngle",
                "Train with multiple angles (Recommended)"
              )}
            </label>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting
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
        </div>
      </div>
    </form>
  );
};

export default UploadForm;
