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
} from "react-icons/fi";
import { User } from "../../types";
import type { UserStatus } from "./types";
import {  Badge, Tooltip, Button } from "../common";
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
  }) => {
    // Cast user to ExtendedUser to access extended properties
    const userExtended = user as ExtendedUser;
    const { t } = useTranslation();

    // Memoized values - ensures these computations only run when dependencies change
    const userImageUrl = useMemo(
      () => getUserImageUrl(userExtended, apiUrl),
      [userExtended, apiUrl]
    );
    const activityStatus = useMemo(
      () => getUserActivityStatus(userExtended),
      [userExtended]
    );
    const activityStatusColor = useMemo(
      () => getActivityStatusColor(activityStatus),
      [activityStatus]
    );

    // Event handlers - memoizing to prevent rerenders
    const handleClick = useMemo(
      () => (onClick ? () => onClick(userExtended) : undefined),
      [onClick, userExtended]
    );
    const handleEdit = useMemo(
      () =>
        onEdit
          ? (e: React.MouseEvent) => {
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
              e.stopPropagation();
              onDelete(userExtended);
            }
          : undefined,
      [onDelete, userExtended]
    );

    // Render compact card
    if (compact) {
      return (
        <div
          className={`bg-white rounded-lg shadow-sm hover:shadow-md 
          transition-all duration-200 border border-gray-100 p-3
          ${onClick ? "cursor-pointer hover:translate-y-[-2px]" : ""} 
          ${className}`}
          onClick={handleClick}
        >
          <div className="flex items-center">
            <div className="relative">
              <img
                src={userImageUrl}
                alt={userExtended.name}
                className="mr-3 w-10 h-10 rounded-full"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {userExtended.name}
              </h3>
              <div className="flex items-center flex-wrap gap-1">
                {userExtended.role && (
                  <Badge variant="primary" size="sm" rounded>
                    {userExtended.role}
                  </Badge>
                )}
                {userExtended.status && (
                  <Badge
                    variant="secondary"
                    size="sm"
                    rounded
                    className={getUserStatusColor(userExtended.status)}
                  >
                    {userExtended.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            {(onEdit || onDelete) && (
              <div className="flex ml-2 space-x-1">
                {onEdit && (
                  <Tooltip content={t("userCard.edit", "Edit")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FiEdit2}
                      onClick={handleEdit}
                      aria-label={t("userCard.edit", "Edit")}
                    >
                      {""}
                    </Button>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip content={t("userCard.delete", "Delete")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={FiTrash2}
                      onClick={handleDelete}
                      aria-label={t("userCard.delete", "Delete")}
                    >
                      {""}
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Full card variant
    return (
      <div
        className={`bg-white rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-200 border border-gray-100 overflow-hidden
        ${onClick ? "cursor-pointer hover:translate-y-[-2px]" : ""} 
        ${className}`}
        onClick={handleClick}
      >
        {/* Header with actions */}
        {(onEdit || onDelete) && (
          <div className="bg-gray-50 px-4 py-2 flex justify-end border-b border-gray-100">
            {onEdit && (
              <Tooltip content={t("userCard.edit", "Edit")}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={FiEdit2}
                  onClick={handleEdit}
                  aria-label={t("userCard.edit", "Edit")}
                >
                  {""}
                </Button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t("userCard.delete", "Delete")}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={FiTrash2}
                  onClick={handleDelete}
                  aria-label={t("userCard.delete", "Delete")}
                >
                  {""}
                </Button>
              </Tooltip>
            )}
          </div>
        )}

        {/* User content */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4">
          {/* User avatar with activity status */}
          <div className="relative">
            <img
              src={userImageUrl}
              alt={userExtended.name}
              className="ring-2 ring-gray-100 w-20 h-20 rounded-full"
            />
          </div>

          {/* User info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {userExtended.name}
              {userExtended.employee_id && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({userExtended.employee_id})
                </span>
              )}
            </h3>

            {/* User badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              {userExtended.role && (
                <Badge variant="primary" rounded>
                  {userExtended.role}
                </Badge>
              )}
              {userExtended.department && (
                <Badge variant="success" rounded>
                  {userExtended.department}
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
                      {formatDate(userExtended.created_at)}
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
        </div>
      </div>
    );
  }
);

// Set display name for React DevTools
OptimizedUserCard.displayName = "OptimizedUserCard";

export default OptimizedUserCard;
