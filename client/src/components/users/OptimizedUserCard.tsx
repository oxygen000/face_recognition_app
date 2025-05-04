import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiClock,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiActivity,
  FiAward,
  FiUser,
  FiEye,
} from "react-icons/fi";
import { User } from "../../types";
import type { UserStatus } from "./types";
import { Badge, Tooltip, Button } from "../common";
import {
  formatDate,
  formatRelativeTime,
  getUserImageUrl,
  getUserActivityStatus,
  getActivityStatusColor,
  getUserStatusColor,
} from "./utils/formatters";

// Extend the User type locally to add our custom properties
interface ExtendedUser extends User {
  status?: UserStatus;
  profile_completion?: number;
  last_login?: string;
  email?: string;
  phone?: string;
  access_level?: number;
}

/**
 * Type for user card props
 */
interface UserCardProps {
  user: User;
  compact?: boolean;
  extended?: boolean;
  className?: string;
  apiUrl?: string;
  onClick?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  selected?: boolean;
  isDeleting?: boolean;
}

/**
 * InfoItem component for consistent formatting
 */
const InfoItem = memo(
  ({
    icon,
    content,
    className = "",
  }: {
    icon: React.ReactNode;
    content: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`flex items-center justify-center md:justify-start ${className}`}
    >
      <span className="mr-2 text-gray-500 flex-shrink-0">{icon}</span>
      <span className="truncate">{content}</span>
    </div>
  )
);

InfoItem.displayName = "InfoItem";

/**
 * Highly optimized UserCard component
 * Uses memoization and component splitting for maximum performance
 */
const OptimizedUserCard: React.FC<UserCardProps> = memo(
  ({
    user,
    compact = false,
    extended = false,
    className = "",
    apiUrl,
    onClick,
    onEdit,
    onDelete,
    selected = false,
    isDeleting = false,
  }) => {
    // Cast user to ExtendedUser to access extended properties
    const userExtended = user as ExtendedUser;
    const { t } = useTranslation("users");

    // Memoized values - ensures these computations only run when dependencies change
    const userImageUrl = useMemo(
      () => getUserImageUrl(userExtended, apiUrl),
      [userExtended, apiUrl]
    );

    // Fix for potential undefined values in user object
    const userName = useMemo(
      () => userExtended.name || t("userCard.unknownName", "Unknown User"),
      [userExtended.name, t]
    );

    const userRole = useMemo(
      () => userExtended.role || "",
      [userExtended.role]
    );

    const userDepartment = useMemo(
      () => userExtended.department || "",
      [userExtended.department]
    );

    const activityStatus = useMemo(
      () => getUserActivityStatus(userExtended),
      [userExtended]
    );
    const activityStatusColor = useMemo(
      () => getActivityStatusColor(activityStatus),
      [activityStatus]
    );

    // Format creation date once
    const formattedCreationDate = useMemo(
      () =>
        userExtended.created_at ? formatDate(userExtended.created_at) : "",
      [userExtended.created_at]
    );

    // Event handlers - memoizing to prevent rerenders
    const handleClick = useMemo(
      () =>
        onClick
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(userExtended);
            }
          : undefined,
      [onClick, userExtended]
    );

    const handleEdit = useMemo(
      () =>
        onEdit
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(userExtended);
            }
          : undefined,
      [onEdit, userExtended]
    );

    const handleDelete = useMemo(
      () =>
        onDelete
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(userExtended);
            }
          : undefined,
      [onDelete, userExtended]
    );

    const viewDetails = useMemo(
      () =>
        onClick
          ? (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onClick(userExtended);
            }
          : undefined,
      [onClick, userExtended]
    );

    // Compute card classes
    const cardClasses = useMemo(() => {
      let classes = `bg-white rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-200 border ${
          selected ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-100"
        }
        ${onClick ? "cursor-pointer hover:translate-y-[-2px]" : ""} 
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
        ${className}`;
      return classes;
    }, [className, onClick, selected, isDeleting]);

    // Render compact card
    if (compact) {
      return (
        <div
          className={cardClasses}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={`User card for ${userName}`}
        >
          <div className="flex items-center p-3">
            <div className="relative flex-shrink-0">
              <img
                src={userImageUrl}
                alt={userName}
                className="mr-3 w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                onError={(e) => {
                  // Set a default image if loading fails
                  (
                    e.target as HTMLImageElement
                  ).src = `${apiUrl}/static/default-avatar.png`;
                }}
              />
              {userExtended.status && (
                <span
                  className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${getUserStatusColor(
                    userExtended.status
                  )}`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {userName}
                {userExtended.employee_id && (
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({userExtended.employee_id})
                  </span>
                )}
              </h3>
              <div className="flex items-center flex-wrap gap-1 mt-1">
                {userRole && (
                  <Badge variant="primary" size="sm" rounded>
                    {userRole}
                  </Badge>
                )}
                {userDepartment && (
                  <Badge variant="success" size="sm" rounded>
                    {userDepartment}
                  </Badge>
                )}
                <span className="text-xs text-gray-500 ml-auto flex items-center">
                  <FiClock className="inline mr-1" size={12} />
                  {formattedCreationDate}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex ml-2 space-x-1">
              {onClick && (
                <Tooltip content={t("view", "View details")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={FiEye}
                    onClick={viewDetails}
                    aria-label={t("view", "View details")}
                  >
                    {""}
                  </Button>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip content={t("delete", "Delete")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={FiTrash2}
                    onClick={handleDelete}
                    aria-label={t("delete", "Delete")}
                  >
                    {""}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Full card variant
    return (
      <div
        className={cardClasses}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`User card for ${userName}`}
      >
        {/* User content */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
          {/* User avatar with activity status */}
          <div className="relative">
            <img
              src={userImageUrl}
              alt={userName}
              className="ring-2 ring-gray-100 w-20 h-20 rounded-full object-cover"
              onError={(e) => {
                // Set a default image if loading fails
                (
                  e.target as HTMLImageElement
                ).src = `${apiUrl}/static/default-avatar.png`;
              }}
            />
            {userExtended.status && (
              <span
                className={`absolute bottom-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white ${getUserStatusColor(
                  userExtended.status
                )}`}
              />
            )}
          </div>

          {/* User info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {userName}
              {userExtended.employee_id && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({userExtended.employee_id})
                </span>
              )}
            </h3>

            {/* User badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              {userRole && (
                <Badge variant="primary" rounded>
                  {userRole}
                </Badge>
              )}
              {userDepartment && (
                <Badge variant="success" rounded>
                  {userDepartment}
                </Badge>
              )}
              {userExtended.status && (
                <Badge
                  variant="secondary"
                  rounded
                  className={getUserStatusColor(userExtended.status)}
                >
                  {userExtended.status}
                </Badge>
              )}
            </div>

            {/* User basic info */}
            <div className="space-y-2 text-sm text-gray-600">
              {userExtended.last_login && (
                <InfoItem
                  icon={<FiActivity className={activityStatusColor} />}
                  content={
                    <>
                      {t("userCard.lastLogin", "Last login")}:{" "}
                      {formatRelativeTime(userExtended.last_login)}
                    </>
                  }
                />
              )}

              {userExtended.created_at && (
                <InfoItem
                  icon={<FiClock />}
                  content={
                    <>
                      {t("userCard.registered", "Registered")}:{" "}
                      {formattedCreationDate}
                    </>
                  }
                />
              )}

              {/* Extended information */}
              {extended && (
                <>
                  {userExtended.email && (
                    <InfoItem icon={<FiMail />} content={userExtended.email} />
                  )}

                  {userExtended.phone && (
                    <InfoItem icon={<FiPhone />} content={userExtended.phone} />
                  )}

                  {userExtended.access_level !== undefined && (
                    <InfoItem
                      icon={<FiAward />}
                      content={
                        <>
                          {t("userCard.accessLevel", "Access Level")}:{" "}
                          {userExtended.access_level}
                        </>
                      }
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex md:flex-col gap-2 mt-2 md:mt-0">
            {onClick && (
              <Tooltip content={t("view", "View details")}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FiEye}
                  onClick={viewDetails}
                  aria-label={t("view", "View details")}
                >
                  {t("view", "View")}
                </Button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t("delete", "Delete")}>
                <Button
                  variant="danger"
                  size="sm"
                  icon={FiTrash2}
                  onClick={handleDelete}
                  aria-label={t("delete", "Delete")}
                >
                  {t("delete", "Delete")}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Set display name for React DevTools
OptimizedUserCard.displayName = "OptimizedUserCard";

export default OptimizedUserCard;
