import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiUsers,
  FiUser,
  FiClock,
  FiInfo,
  FiBriefcase,
  FiHash,
  FiCamera,
  FiEdit,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiCalendar,
  FiActivity,
  FiLayers,
  FiSettings,
} from "react-icons/fi";
import { useUserDetail } from "../../hooks";
import api from "../../services/api";
import { Button, Alert, Modal, Spinner } from "../common";
import { useUserContext } from "../../contexts/UserContext";

/**
 * Format a date string into a readable format with caching
 */
const formatDate = (() => {
  const cache: Record<string, string> = {};

  return (dateString: string): string => {
    // Return from cache if available
    if (cache[dateString]) return cache[dateString];

    try {
      if (!dateString) return "Unknown date";

      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const result = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);

      // Cache the result
      cache[dateString] = result;
      return result;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };
})();

/**
 * Loading state component with skeleton UI
 */
const LoadingState: React.FC = () => {
  const { t } = useTranslation(["userDetail", "common"]);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-white/20 rounded animate-pulse"></div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
            {/* Skeleton for user image */}
            <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse mr-6"></div>

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Skeleton for personal info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Skeleton for system info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-gray-600">
        {t("loading", "Loading user details...")}
      </div>
    </div>
  );
};

/**
 * Error state component
 */
interface ErrorStateProps {
  error: string;
  onBack: () => void;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack, onRetry }) => {
  const { t } = useTranslation(["userDetail", "common"]);

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800 px-6 py-4 text-white">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <FiAlertCircle className="mr-2" />
            {t("error.title", "Error Loading User")}
          </h2>
          <p className="text-red-100 mt-1">
            {t(
              "error.subtitle",
              "There was a problem retrieving the user details"
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="p-6 bg-red-50 rounded-lg border border-red-200 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button variant="secondary" icon={FiArrowLeft} onClick={onBack}>
              {t("common:buttons.back", "Back")}
            </Button>

            {onRetry && (
              <Button variant="primary" icon={FiRefreshCw} onClick={onRetry}>
                {t("common:buttons.retry", "Retry")}
              </Button>
            )}

            <Link to="/users">
              <Button variant="primary" icon={FiUsers}>
                {t("allUsers", "All Users")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Info item component for displaying a label-value pair
 */
interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  monospace?: boolean;
  copyable?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = React.memo(
  ({ label, value, icon, monospace = false, copyable = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
      if (typeof value === "string") {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch((err) => console.error("Failed to copy text:", err));
      }
    }, [value]);

    return (
      <div className="flex items-start group p-3 hover:bg-gray-50 rounded-lg transition-colors">
        {icon && (
          <div className="text-indigo-500 mr-3 mt-1 text-xl">{icon}</div>
        )}
        <div className="flex-grow">
          <p className="text-gray-700 relative">
            <span className="font-medium text-gray-600 block mb-1">
              {label}
            </span>
            <span
              className={`${
                monospace ? "font-mono text-sm" : ""
              } break-words text-gray-800 font-medium`}
            >
              {value || "—"}
            </span>
          </p>
        </div>
        {copyable && typeof value === "string" && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-400 hover:text-gray-700"
            title="Copy to clipboard"
          >
            {copied ? (
              <FiCheckCircle className="text-green-500" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }
);

// Set display name for React DevTools
InfoItem.displayName = "InfoItem";

/**
 * Section header component
 */
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  color = "indigo",
}) => (
  <div className={`flex items-center border-b border-${color}-100 pb-3 mb-4`}>
    <div className={`text-${color}-600 mr-3 text-2xl`}>{icon}</div>
    <div>
      <h3 className={`text-${color}-700 font-bold text-lg`}>{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  </div>
);

/**
 * Optimized UserDetail component with performance improvements
 */
const OptimizedUserDetail: React.FC = () => {
  const { t } = useTranslation(["userDetail", "common"]);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { markUserAsDeleted } = useUserContext();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch user details
  const { user, loading, error, errorMessage, deleteUser, refreshUser } =
    useUserDetail(userId);

  // Delete operation states
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );
  const [deleteCountdown, setDeleteCountdown] = useState(3);

  // Handle back button click
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Handle delete button click
  const handleDelete = useCallback(() => {
    setDeleteConfirmOpen(true);
    setDeleteError(false);
    setDeleteErrorMessage(null);
  }, []);

  // Delete countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (deleteSuccess && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    } else if (deleteSuccess && deleteCountdown === 0) {
      navigate("/users");
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [deleteSuccess, deleteCountdown, navigate]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!userId) {
      setDeleteError(true);
      setDeleteErrorMessage(t("deleteConfirm.noId", "User ID is required"));
      return;
    }

    setIsDeleting(true);
    setDeleteError(false);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteUser();

      if (result.success) {
        // Mark the user as deleted in the global context
        markUserAsDeleted(userId);

        setDeleteSuccess(true);
        setDeleteCountdown(3);
      } else {
        setDeleteError(true);
        setDeleteErrorMessage(
          result.message || t("deleteConfirm.error", "Failed to delete user")
        );
      }
    } catch (err) {
      setDeleteError(true);
      setDeleteErrorMessage(
        err instanceof Error
          ? err.message
          : t("common:error", "An error occurred")
      );
    } finally {
      setIsDeleting(false);
    }
  }, [userId, deleteUser, t, markUserAsDeleted]);

  // Handle delete cancellation
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
    setDeleteError(false);
    setDeleteErrorMessage(null);
  }, []);

  // Memoize the server URL
  const serverUrl = useMemo(() => api.getServerUrl(), []);

  // Memoize the user image URL
  const userImageUrl = useMemo(() => {
    if (!user) return "";

    if (user.image_path) {
      return `${serverUrl}/${user.image_path}`;
    }

    return `${serverUrl}/api/users/${user.id}/image`;
  }, [user, serverUrl]);

  // Handle image modal
  const openImageModal = useCallback(() => {
    setIsImageModalOpen(true);
    setImageLoading(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  // Download image function
  const downloadImage = useCallback(() => {
    if (!user) return;

    const link = document.createElement("a");
    link.href = userImageUrl;
    link.download = `${user.name.replace(/\s+/g, "_")}_profile.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [user, userImageUrl]);

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render error state
  if (error || !user) {
    return (
      <ErrorState
        error={errorMessage || t("notFound", "User not found")}
        onBack={handleBack}
        onRetry={handleRetry}
      />
    );
  }

  // Calculate how long ago user was registered
  const registeredDuration = (() => {
    if (!user.created_at) return "";

    const now = new Date();
    const created = new Date(user.created_at);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("time.today", "Today");
    if (diffDays === 1) return t("time.yesterday", "Yesterday");
    if (diffDays < 30)
      return t("time.days", "{{days}} days ago", { days: diffDays });
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return t("time.months", "{{months}} months ago", { months });
    }
    const years = Math.floor(diffDays / 365);
    return t("time.years", "{{years}} years ago", { years });
  })();

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="secondary"
          icon={FiArrowLeft}
          onClick={handleBack}
          className="shadow-sm"
        >
          {t("common:buttons.back", "Back")}
        </Button>

        <div className="flex gap-2">
          <Link to="/users">
            <Button variant="secondary" icon={FiUsers} className="shadow-sm">
              {t("allUsers", "All Users")}
            </Button>
          </Link>

          <Button
            variant="danger"
            icon={FiTrash2}
            onClick={handleDelete}
            disabled={loading || isDeleting}
            className="shadow-sm"
          >
            {t("delete", "Delete")}
          </Button>
        </div>
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        {/* Colored header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-indigo-200 mt-1 flex items-center">
            <FiUser className="mr-2" />
            {user.role || t("noRole", "No role assigned")}
            {user.department && (
              <>
                <span className="mx-2">•</span>
                <FiBriefcase className="mr-2" />
                {user.department}
              </>
            )}
          </p>
        </div>

        {/* Main profile content */}
        <div className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Left column - Image and basic info */}
            <div className="flex flex-col items-center lg:items-start lg:w-1/3">
              <div
                className="relative mb-6 w-48 h-48 rounded-lg bg-gray-300 overflow-hidden shadow-lg group cursor-pointer"
                onClick={openImageModal}
              >
                <img
                  src={userImageUrl}
                  alt={user.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <FiCamera className="text-white text-3xl" />
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                

                <Button
                  variant="secondary"
                  icon={FiDownload}
                  onClick={downloadImage}
                  className="w-full"
                >
                  {t("downloadImage", "Download Image")}
                </Button>

                <Link to={`/users/${user.id}/edit`} className="w-full">
                  <Button variant="primary" icon={FiEdit} className="w-full">
                    {t("edit", "Edit Profile")}
                  </Button>
                </Link>
              </div>

              {/* Status indicators */}
              <div className="mt-6 bg-green-50 w-full p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 font-medium">
                    {t("active", "Active")}
                  </span>
                </div>
                <div className="flex items-start">
                  <FiShield className="mr-2 mt-1 text-blue-600" />
                  <span className="text-gray-700 text-sm">
                    {t(
                      "securityInfo",
                      "Face recognition enabled for secure authentication"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column - Detailed information */}
            <div className="lg:w-2/3">
              {/* Personal Information */}
              <div className="mb-8">
                <SectionHeader
                  icon={<FiUser />}
                  title={t("personalInfo", "Personal Information")}
                />

                <div className="bg-gray-50 rounded-lg border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {user.employee_id && (
                      <InfoItem
                        label={t("info.employeeId", "Employee ID")}
                        value={user.employee_id}
                        icon={<FiHash />}
                        copyable
                      />
                    )}

                    <InfoItem
                      label={t("info.registrationDate", "Registration Date")}
                      value={
                        user.created_at
                          ? formatDate(user.created_at)
                          : t("common:dateUnknown", "Unknown date")
                      }
                      icon={<FiCalendar />}
                    />

                    {user.department && (
                      <InfoItem
                        label={t("info.department", "Department")}
                        value={user.department}
                        icon={<FiBriefcase />}
                      />
                    )}

                    <InfoItem
                      label={t("info.registered", "Registered")}
                      value={registeredDuration}
                      icon={<FiClock />}
                    />

                    {user.role && (
                      <InfoItem
                        label={t("info.role", "Role")}
                        value={user.role}
                        icon={<FiSettings />}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <SectionHeader
                  icon={<FiInfo />}
                  title={t("systemInfo", "System Information")}
                />

                <div className="bg-gray-50 rounded-lg border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <InfoItem
                      label={t("info.userId", "User ID")}
                      value={user.id}
                      icon={<FiHash />}
                      monospace
                      copyable
                    />

                    {user.face_id && (
                      <InfoItem
                        label={t("info.faceId", "Face ID")}
                        value={user.face_id}
                        icon={<FiActivity />}
                        monospace
                        copyable
                      />
                    )}
                  </div>

                  {user.image_path && (
                    <InfoItem
                      label={t("info.imagePath", "Image Path")}
                      value={user.image_path}
                      icon={<FiLayers />}
                      monospace
                      copyable
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        title={t("userImage", "User Image")}
        size="lg"
      >
        <div className="p-4 flex flex-col items-center">
          {imageLoading && (
            <div className="flex justify-center items-center p-10">
              <Spinner size="lg" />
            </div>
          )}
          <img
            src={userImageUrl}
            alt={user.name}
            className={`max-w-full max-h-[70vh] object-contain ${
              imageLoading ? "hidden" : "block"
            }`}
            onLoad={handleImageLoad}
          />
          <div className="flex gap-4 mt-6">
            <Button
              variant="secondary"
              icon={FiDownload}
              onClick={downloadImage}
            >
              {t("downloadImage", "Download Image")}
            </Button>
            <Button variant="ghost" onClick={closeImageModal}>
              {t("common:buttons.close", "Close")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={deleteSuccess ? () => {} : handleDeleteCancel}
        title={t("deleteConfirm.title", "Confirm Deletion")}
        size="md"
      >
        <div className="p-6">
          {!deleteSuccess ? (
            <>
              <div className="bg-red-50 p-4 rounded-lg mb-5 border border-red-200">
                <div className="flex items-start">
                  <FiAlertCircle className="text-red-600 text-xl mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-700 mb-1">
                      {t(
                        "deleteConfirm.warning",
                        "Warning: This action cannot be undone"
                      )}
                    </h4>
                    <p className="text-gray-700">
                      {t(
                        "deleteConfirm.message",
                        "Are you sure you want to permanently delete this user?"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-2 font-medium">
                {t("deleteConfirm.userDetails", "User details:")}
              </p>
              <ul className="mb-6 bg-gray-50 p-3 rounded-lg">
                <li className="mb-2">
                  <strong>{t("common:name", "Name")}:</strong> {user.name}
                </li>
                {user.employee_id && (
                  <li className="mb-2">
                    <strong>{t("info.employeeId", "Employee ID")}:</strong>{" "}
                    {user.employee_id}
                  </li>
                )}
                {user.department && (
                  <li>
                    <strong>{t("info.department", "Department")}:</strong>{" "}
                    {user.department}
                  </li>
                )}
              </ul>

              {deleteError && (
                <Alert
                  variant="error"
                  className="mb-5"
                  message={
                    deleteErrorMessage ||
                    t("deleteConfirm.error", "Failed to delete user")
                  }
                />
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  {t("common:buttons.cancel", "Cancel")}
                </Button>
                <Button
                  variant="danger"
                  icon={FiTrash2}
                  onClick={handleDeleteConfirm}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  {t("common:buttons.delete", "Delete")}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="flex items-center justify-center mb-6">
                <div className="rounded-full bg-green-100 p-3">
                  <FiCheckCircle className="text-green-600 text-3xl" />
                </div>
              </div>

              <h3 className="text-center text-xl font-medium text-gray-900 mb-2">
                {t("deleteConfirm.success", "User deleted successfully")}
              </h3>

              <p className="text-center text-gray-600 mb-6">
                {t(
                  "deleteConfirm.redirecting",
                  "Redirecting to user list in {{seconds}} seconds",
                  { seconds: deleteCountdown }
                )}
              </p>

              <div className="flex justify-center">
                <Button variant="primary" onClick={() => navigate("/users")}>
                  {t("deleteConfirm.backToList", "Back to User List")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OptimizedUserDetail;
