import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiSearch, FiPlus, FiUsers, FiRefreshCw, FiX } from "react-icons/fi";
import { User } from "../../types";
import api from "../../services/api";
import { Button, Spinner, Alert, Card, EmptyState } from "../common";
import { PageHeader } from "../../layout";
import OptimizedUserCard from "./OptimizedUserCard";

const ITEMS_PER_PAGE = 12;
const MAX_RETRIES = 2;

const OptimizedUserList: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortField, setSortField] = useState<"name" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define sortAndFilterUsers first as it's used by other functions
  const sortAndFilterUsers = useCallback(
    (users: User[]) => {
      if (!users) return [];

      let result = [...users];

      if (searchQuery) {
        result = result.filter((user) =>
          ["name", "employee_id", "department", "role"].some((key) => {
            const value = user[key as keyof User];
            return (
              value &&
              typeof value === "string" &&
              value.toLowerCase().includes(searchQuery.toLowerCase())
            );
          })
        );
      }

      result.sort((a, b) => {
        if (sortField === "name") {
          return sortDirection === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();
        }
      });

      return result;
    },
    [searchQuery, sortField, sortDirection]
  );

  // Load initial data with pagination
  const loadInitialUsers = useCallback(() => {
    setLoading(true);
    setError(false);
    setErrorMessage(null);

    api
      .getUsers({ page: 1, limit: ITEMS_PER_PAGE * 2 })
      .then((response) => {
        if (response?.users && Array.isArray(response.users)) {
          setFilteredUsers(sortAndFilterUsers(response.users));

          // Check if there are more pages based on pagination info
          if (response.pagination) {
            setHasMorePages(
              response.pagination.page < response.pagination.pages
            );
            setCurrentPage(response.pagination.page);
          }
        }
        setApiError(null);
        setRetryCount(0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(t("users.errorLoading", "Error loading users:"), err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : t("users.failedToLoad", "Failed to load users");
        setApiError(errorMsg);
        setErrorMessage(errorMsg);
        setError(true);
        setLoading(false);

        // Only retry a limited number of times
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1);
          setTimeout(loadInitialUsers, 3000); // Retry after 3 seconds
        }
      });
  }, [retryCount, sortAndFilterUsers, t]);

  // Load more data when scrolling
  const loadMoreUsers = useCallback(() => {
    if (!hasMorePages || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    api
      .getUsers({ page: nextPage, limit: ITEMS_PER_PAGE })
      .then((response) => {
        if (response?.users && Array.isArray(response.users)) {
          setFilteredUsers((prev) => [
            ...prev,
            ...sortAndFilterUsers(response.users || []),
          ]);

          // Update pagination state
          if (response.pagination) {
            setHasMorePages(
              response.pagination.page < response.pagination.pages
            );
            setCurrentPage(response.pagination.page);
          } else {
            setHasMorePages(false);
          }
        }
        setIsLoadingMore(false);
      })
      .catch((err) => {
        console.error(
          t("users.errorLoadingMore", "Error loading more users:"),
          err
        );
        setIsLoadingMore(false);
      });
  }, [currentPage, hasMorePages, isLoadingMore, sortAndFilterUsers, t]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialUsers();
  }, [loadInitialUsers]);

  useEffect(() => {
    setVisibleUsers(filteredUsers.slice(0, page * ITEMS_PER_PAGE));
  }, [filteredUsers, page]);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (visibleUsers.length >= filteredUsers.length && hasMorePages) {
          loadMoreUsers();
        } else {
          setPage((prev) => prev + 1);
        }
      }
    }
  }, [filteredUsers.length, hasMorePages, loadMoreUsers, visibleUsers.length]);

  useEffect(() => {
    const currentListRef = listRef.current;
    currentListRef?.addEventListener("scroll", handleScroll);
    return () => currentListRef?.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);
  const handleClearSearch = () => setSearchQuery("");
  const handleSortChange = (field: "name" | "created_at") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRefresh = () => {
    setApiError(null);
    setRetryCount(0);
    setError(false);
    setErrorMessage(null);
    loadInitialUsers();
  };

  if (loading && !visibleUsers.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={t("userList.title", "Registered Users")}
          subtitle={t(
            "userList.subtitle",
            "View and manage all registered users"
          )}
          icon={FiUsers}
        />
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">
            {t("userList.loading", "Loading users...")}
          </span>
        </div>
      </div>
    );
  }

  if ((error || apiError) && !visibleUsers.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={t("userList.title", "Registered Users")}
          subtitle={t(
            "userList.subtitle",
            "View and manage all registered users"
          )}
          icon={FiUsers}
        />
        <Alert
          variant="error"
          className="mb-4"
          message={
            apiError ||
            errorMessage ||
            t("userList.error", "Failed to load users")
          }
        />
        <div className="flex justify-center">
          <Button onClick={handleRefresh} icon={FiRefreshCw}>
            {t("userList.retry", "Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={t("userList.title", "Registered Users")}
        subtitle={t(
          "userList.subtitle",
          "View and manage all registered users"
        )}
        icon={FiUsers}
      />
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  t("userList.searchPlaceholder", "Search users...") as string
                }
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FiX className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortField === "name" ? "primary" : "secondary"}
                onClick={() => handleSortChange("name")}
                className="whitespace-nowrap"
              >
                {t("userList.sortByName", "Sort by Name")}
                {sortField === "name" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </Button>
              <Button
                variant={sortField === "created_at" ? "primary" : "secondary"}
                onClick={() => handleSortChange("created_at")}
                className="whitespace-nowrap"
              >
                {t("userList.sortByDate", "Sort by Date")}
                {sortField === "created_at" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </Button>
            </div>
            <Link to="/register-face">
              <Button
                variant="success"
                icon={FiPlus}
                className="whitespace-nowrap"
              >
                {t("userList.registerNew", "Register New")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-600">
          {t("userList.showing", "Showing")} {visibleUsers.length}{" "}
          {t("userList.of", "of")} {filteredUsers.length}{" "}
          {t("userList.users", "users")}
          {searchQuery && (
            <span>
              {" "}
              {t("userList.matchingSearch", "matching")} "{searchQuery}"
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          icon={FiRefreshCw}
          onClick={handleRefresh}
          className="text-gray-600"
        >
          {t("userList.refresh", "Refresh")}
        </Button>
      </div>

      {filteredUsers.length === 0 && (
        <div className="flex justify-center">
          <EmptyState title={t("userList.noUsers", "No users found")} />
        </div>
      )}

      <div
        ref={listRef}
        className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {visibleUsers.map((user) => (
          <Link to={`/users/${user.id}`} key={user.id}>
            <OptimizedUserCard user={user} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OptimizedUserList;
