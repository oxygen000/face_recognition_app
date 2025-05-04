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
} from "react-icons/fi";
import { useUserDetail } from "../../hooks";
import api from "../../services/api";
import { Button, Alert, Card, Badge } from "../common";

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
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white  rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800  px-6 py-4">
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-white/20 rounded animate-pulse"></div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
            {/* Skeleton for user image */}
            <div className="w-32 h-32 rounded-full bg-gray-200  animate-pulse mr-6"></div>

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <div className="h-7 w-48 bg-gray-200  rounded animate-pulse mb-3"></div>
              <div className="h-5 w-32 bg-gray-200  rounded animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Skeleton for personal info */}
            <div className="bg-gray-50  p-4 rounded-lg">
              <div className="h-6 w-48 bg-gray-200  rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-5 w-full bg-gray-200  rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200  rounded animate-pulse"></div>
              </div>
            </div>

            {/* Skeleton for system info */}
            <div className="bg-gray-50  p-4 rounded-lg">
              <div className="h-6 w-48 bg-gray-200  rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-5 w-full bg-gray-200  rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200  rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-24 bg-gray-200  rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200  rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-gray-600 ">
        {t("userDetail.loading", "Loading user details...")}
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
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white  rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800  px-6 py-4 text-white">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <FiAlertCircle className="mr-2" />
            {t("userDetail.error.title", "Error Loading User")}
          </h2>
          <p className="text-red-100 mt-1">
            {t(
              "userDetail.error.subtitle",
              "There was a problem retrieving the user details"
            )}
          </p>
        </div>

        <div className="p-6">
          <div className="p-6 bg-red-50  rounded-lg border border-red-200  mb-6">
            <p className="text-red-700  font-medium">
              {error}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button variant="secondary" icon={FiArrowLeft} onClick={onBack}>
              {t("userDetail.back", "Back")}
            </Button>

            <Link to="/users">
              <Button variant="primary" icon={FiUsers}>
                {t("userDetail.allUsers", "All Users")}
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
}

const InfoItem: React.FC<InfoItemProps> = React.memo(
  ({ label, value, icon, monospace = false }) => {
    return (
      <div className="flex items-start">
        {icon && (
          <div className="text-gray-500  mr-2 mt-1">
            {icon}
          </div>
        )}
        <div>
          <p className="text-gray-700 ">
            <span className="font-medium text-gray-600  block mb-1">
              {label}
            </span>
            <span className={monospace ? "font-mono text-sm" : ""}>
              {value}
            </span>
          </p>
        </div>
      </div>
    );
  }
);

/**
 * Optimized UserDetail component with performance improvements
 */
const OptimizedUserDetail: React.FC = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );

  // Fetch user details
  const { user, loading, error, errorMessage, deleteUser } =
    useUserDetail(userId);

  // Navigate back after successful deletion
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (deleteSuccess) {
      navigate("/users");
    }
  }, [deleteSuccess, navigate]);

  // Handle back button click
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle delete button click
  const handleDelete = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (userId) {
      setDeleteLoading(true);
      setDeleteError(false);
      setDeleteErrorMessage(null);

      try {
        const result = await deleteUser();

        if (result.success) {
          setDeleteSuccess(true);
        } else {
          setDeleteError(true);
          setDeleteErrorMessage(result.message);
        }
      } catch (err) {
        setDeleteError(true);
        setDeleteErrorMessage(
          err instanceof Error ? err.message : "An error occurred"
        );
      } finally {
        setDeleteLoading(false);
      }
    }
    setDeleteConfirmOpen(false);
  }, [userId, deleteUser]);

  // Handle delete cancellation
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
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

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render error state
  if (error || !user) {
    return (
      <ErrorState
        error={errorMessage || t("userDetail.notFound", "User not found")}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white  rounded-xl shadow-lg overflow-hidden">
        {/* Header area with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800  px-6 py-4 text-white">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("userDetail.title", "User Details")}
          </h2>
          <p className="text-blue-100 mt-1">
            {t(
              "userDetail.subtitle",
              "View detailed information about this user"
            )}
          </p>
        </div>

        <div className="p-6">
          {/* User header with image and name */}
          <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
            <div className="mb-4 md:mb-0 md:mr-6">
              <img
                src={userImageUrl}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>

            <div className="text-center md:text-left flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {user.name}
              </h3>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {user.role && (
                  <Badge variant="primary" rounded>
                    {user.role}
                  </Badge>
                )}
                {user.department && (
                  <Badge variant="success" rounded>
                    {user.department}
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <Button
                  variant="secondary"
                  icon={FiCamera}
                  onClick={() =>
                    window.open(
                      `${serverUrl}/api/users/${user.id}/image`,
                      "_blank"
                    )
                  }
                >
                  {t("userDetail.viewImage", "View Image")}
                </Button>

                <Link to={`/users/${user.id}/edit`}>
                  <Button variant="primary" icon={FiEdit}>
                    {t("userDetail.edit", "Edit User")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* User information cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card
              title={
                <div className="flex items-center">
                  <FiUser className="text-blue-500 mr-2" />
                  <span>
                    {t("userDetail.personalInfo", "Personal Information")}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                {user.employee_id && (
                  <InfoItem
                    label={t("userDetail.info.employeeId", "Employee ID")}
                    value={user.employee_id}
                    icon={<FiHash />}
                  />
                )}

                {user.department && (
                  <InfoItem
                    label={t("userDetail.info.department", "Department")}
                    value={user.department}
                    icon={<FiBriefcase />}
                  />
                )}

                {user.role && (
                  <InfoItem
                    label={t("userDetail.info.role", "Role")}
                    value={user.role}
                    icon={<FiBriefcase />}
                  />
                )}

                <InfoItem
                  label={t(
                    "userDetail.info.registrationDate",
                    "Registration Date"
                  )}
                  value={
                    user.created_at
                      ? formatDate(user.created_at)
                      : t("common.dateUnknown", "Unknown date")
                  }
                  icon={<FiClock />}
                />
              </div>
            </Card>

            <Card
              title={
                <div className="flex items-center">
                  <FiInfo className="text-blue-500 mr-2" />
                  <span>
                    {t("userDetail.systemInfo", "System Information")}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <InfoItem
                  label={t("userDetail.info.userId", "User ID")}
                  value={user.id}
                  icon={<FiHash />}
                  monospace
                />

                {user.face_id && (
                  <InfoItem
                    label={t("userDetail.info.faceId", "Face ID")}
                    value={user.face_id}
                    icon={<FiHash />}
                    monospace
                  />
                )}

                {user.image_path && (
                  <InfoItem
                    label={t("userDetail.info.imagePath", "Image Path")}
                    value={user.image_path}
                    icon={<FiHash />}
                    monospace
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Status card */}
          <Card
            title={
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                <span>{t("userDetail.status", "Status")}</span>
              </div>
            }
            className="mb-8"
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700  font-medium">
                {t("userDetail.active", "Active")}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Button variant="secondary" icon={FiArrowLeft} onClick={handleBack}>
          {t("userDetail.back", "Back")}
        </Button>

        <Link to="/users">
          <Button variant="primary" icon={FiUsers}>
            {t("userDetail.allUsers", "All Users")}
          </Button>
        </Link>

        <div className="flex-grow"></div>

        <Button variant="danger" icon={FiTrash2} onClick={handleDelete}>
          {t("userDetail.delete", "Delete User")}
        </Button>
      </div>

      {/* Delete confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white  rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900  mb-2">
              {t("userDetail.deleteConfirm.title", "Confirm Deletion")}
            </h3>
            <p className="text-gray-600  mb-4">
              {t(
                "userDetail.deleteConfirm.message",
                "Are you sure you want to delete this user? This action cannot be undone."
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleDeleteCancel}>
                {t("userDetail.deleteConfirm.cancel", "Cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                loading={deleteLoading}
              >
                {t("userDetail.deleteConfirm.confirm", "Delete")}
              </Button>
            </div>
            {deleteError && (
              <Alert
                variant="error"
                className="mt-4"
                message={
                  deleteErrorMessage ||
                  t("userDetail.deleteConfirm.error", "Failed to delete user")
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedUserDetail;
