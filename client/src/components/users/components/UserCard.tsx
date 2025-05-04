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
import { Avatar, Badge, Tooltip, Button } from "../../common";
import { UserCardProps } from "../types";
import {
  formatDate,
  formatRelativeTime,
  getUserImageUrl,
  getUserActivityStatus,
  getActivityStatusColor,
  getUserStatusColor,
} from "../utils/formatters";

/**
 * Enhanced UserCard component with modern design and additional features
 *
 * Features:
 * - Fully responsive layout
 * - Dark mode support with improved contrast
 * - Activity indicators
 * - Action buttons (edit, delete)
 * - Profile completion indicator
 * - Extended information view
 */
const UserCard: React.FC<UserCardProps> = ({
  user,
  compact = false,
  extended = false,
  className = "",
  apiUrl,
  onClick,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  // Get user image URL
  const userImageUrl = useMemo(
    () => getUserImageUrl(user, apiUrl),
    [user, apiUrl]
  );

  // Calculate activity status
  const activityStatus = useMemo(() => getUserActivityStatus(user), [user]);

  // Get activity status color
  const activityStatusColor = useMemo(
    () => getActivityStatusColor(activityStatus),
    [activityStatus]
  );

  // Handler for clicking the card
  const handleClick = () => {
    if (onClick) onClick(user);
  };

  // Handler for edit button
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(user);
  };

  // Handler for delete button
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(user);
  };

  // Compact card variant
  if (compact) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md 
          transition-all duration-200 dark:border dark:border-gray-700 p-3
          ${onClick ? "cursor-pointer hover:translate-y-[-2px]" : ""} 
          ${className}`}
        onClick={onClick ? handleClick : undefined}
      >
        <div className="flex items-center">
          <div className="relative">
            <Avatar
              src={userImageUrl}
              alt={user.name}
              size="md"
              className="mr-3"
              initials={user.name?.substring(0, 2)}
            />

            {/* Activity indicator */}
            <Tooltip
              content={t(
                `userCard.activityStatus.${activityStatus}`,
                activityStatus
              )}
            >
              <div
                className={`absolute bottom-0 right-1 h-3 w-3 rounded-full 
                border-2 border-white dark:border-gray-800 ${
                  activityStatus === "today"
                    ? "bg-green-500"
                    : activityStatus === "recent"
                    ? "bg-blue-500"
                    : activityStatus === "inactive"
                    ? "bg-amber-500"
                    : "bg-gray-500"
                }`}
              />
            </Tooltip>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </h3>
            <div className="flex items-center flex-wrap gap-1">
              {user.role && (
                <Badge variant="primary" size="sm" rounded>
                  {user.role}
                </Badge>
              )}
              {user.status && (
                <Badge
                  variant="secondary"
                  size="sm"
                  rounded
                  className={getUserStatusColor(user.status)}
                >
                  {user.status}
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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-200 dark:border dark:border-gray-700 overflow-hidden
        ${onClick ? "cursor-pointer hover:translate-y-[-2px]" : ""} 
        ${className}`}
      onClick={onClick ? handleClick : undefined}
    >
      {/* Header with actions */}
      {(onEdit || onDelete) && (
        <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-2 flex justify-end border-b border-gray-100 dark:border-gray-700">
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
          <Avatar
            src={userImageUrl}
            alt={user.name}
            size="xl"
            initials={user.name?.substring(0, 2)}
            className="ring-2 ring-gray-100 dark:ring-gray-700"
          />

          {/* Activity indicator */}
          <Tooltip
            content={t(
              `userCard.activityStatus.${activityStatus}`,
              activityStatus
            )}
          >
            <div
              className={`absolute bottom-1 right-1 h-4 w-4 rounded-full 
              border-2 border-white dark:border-gray-800 ${
                activityStatus === "today"
                  ? "bg-green-500"
                  : activityStatus === "recent"
                  ? "bg-blue-500"
                  : activityStatus === "inactive"
                  ? "bg-amber-500"
                  : "bg-gray-500"
              }`}
            />
          </Tooltip>
        </div>

        {/* User info */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {user.name}
            {user.employee_id && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({user.employee_id})
              </span>
            )}
          </h3>

          {/* User badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
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
            {user.status && (
              <Badge
                variant="secondary"
                rounded
                className={getUserStatusColor(user.status)}
              >
                {user.status}
              </Badge>
            )}
          </div>

          {/* User basic info */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {user.last_login && (
              <div className="flex items-center justify-center md:justify-start">
                <FiActivity
                  className={`mr-2 ${activityStatusColor} flex-shrink-0`}
                />
                <span>
                  {t("userCard.lastLogin", "Last login")}:{" "}
                  {formatRelativeTime(user.last_login)}
                </span>
              </div>
            )}

            {user.created_at && (
              <div className="flex items-center justify-center md:justify-start">
                <FiClock className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span>
                  {t("userCard.registered", "Registered")}:{" "}
                  {formatDate(user.created_at)}
                </span>
              </div>
            )}

            {/* Extended information */}
            {extended && (
              <>
                {user.email && (
                  <div className="flex items-center justify-center md:justify-start">
                    <FiMail className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center justify-center md:justify-start">
                    <FiPhone className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user.access_level !== undefined && (
                  <div className="flex items-center justify-center md:justify-start">
                    <FiAward className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>
                      {t("userCard.accessLevel", "Access Level")}:{" "}
                      {user.access_level}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Use React.memo for performance optimization
export default memo(UserCard);
