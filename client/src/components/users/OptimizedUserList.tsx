import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiSearch,
  FiPlus,
  FiUsers,
  FiRefreshCw,
  FiX,
  FiTrash2,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { User } from "../../types";
import api from "../../services/api";
import {
  Button,
  Spinner,
  Alert,
  Card,
  EmptyState,
  Tooltip,
  Modal,
} from "../common";
import { PageHeader } from "../../layout";
import OptimizedUserCard from "./OptimizedUserCard";
import { debounce } from "lodash";
import { useUserContext } from "../../contexts/UserContext";
import {
  userListReducer,
  initialState,
  ITEMS_PER_PAGE,
  CACHE_TTL,
  SortField,
} from "./state/userListReducer";

// Constants
const API_REQUEST_DEBOUNCE = 1000; // 1 second debounce for API requests

const OptimizedUserList: React.FC = () => {
  const { t } = useTranslation(["users", "common"]);
  const [state, dispatch] = useReducer(userListReducer, initialState);
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isUserDeleted, markUserAsDeleted } = useUserContext();

  // Ref to track if an API request has been made for empty state
  const emptyStateChecked = useRef<boolean>(false);
  // Ref to track last request time to prevent rapid consecutive calls
  const lastRequestTime = useRef<number>(0);

  // Debounced search
  const debouncedSearch = useRef(
    debounce((query: string) => {
      dispatch({ type: "SET_SEARCH_QUERY", payload: query });
    }, 300)
  ).current;

  // Memoized sort and filter function
  const sortAndFilterUsers = useCallback(
    (users: User[]) => {
      if (!users || !users.length) return [];

      // Filter out deleted users first
      let result = [...users].filter((user) => !isUserDeleted(user.id));

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        result = result.filter((user) =>
          ["name", "employee_id", "department", "role"].some((key) => {
            const value = user[key as keyof User];
            return (
              value &&
              typeof value === "string" &&
              value.toLowerCase().includes(query)
            );
          })
        );
      }

      // Apply sorting
      result.sort((a, b) => {
        const aValue = a[state.sortField];
        const bValue = b[state.sortField];

        // Handle special case for dates
        if (state.sortField === "created_at") {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return state.sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Normal string sorting
        if (typeof aValue === "string" && typeof bValue === "string") {
          return state.sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle undefined or non-string values
        if (!aValue && !bValue) return 0;
        if (!aValue) return state.sortDirection === "asc" ? -1 : 1;
        if (!bValue) return state.sortDirection === "asc" ? 1 : -1;

        return 0;
      });

      return result;
    },
    [state.searchQuery, state.sortField, state.sortDirection, isUserDeleted]
  );

  // Load initial data
  const loadUsers = useCallback(async () => {
    const now = Date.now();

    // Prevent loading if another request was made recently
    if (now - lastRequestTime.current < API_REQUEST_DEBOUNCE) {
      console.log("Skipping API request - too soon after previous request");
      return;
    }

    // Set last request time
    lastRequestTime.current = now;

    dispatch({ type: "FETCH_INIT" });

    try {
      const response = await api.getUsers({
        page: 1,
        limit: ITEMS_PER_PAGE * 2,
      });

      if (response.status === "success") {
        // Explicitly handle empty users array case
        const users = response.users || [];

        // If we get an empty array, mark that we've checked for empty state
        if (users.length === 0) {
          emptyStateChecked.current = true;
        }

        // Set hasMorePages to false when no users are found to prevent additional loading attempts
        const hasMorePages = response.pagination
          ? response.pagination.page < response.pagination.pages
          : users.length >= ITEMS_PER_PAGE;

        dispatch({
          type: "FETCH_SUCCESS",
          payload: {
            users: users,
            pagination: response.pagination,
            hasMorePages: hasMorePages,
          },
        });
      } else {
        dispatch({
          type: "FETCH_ERROR",
          payload: response.message || t("users:failedToLoad"),
        });
      }
    } catch (err) {
      console.error("Error loading users:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "FETCH_ERROR", payload: errorMsg });
      // Still mark as checked even on error to prevent endless retry loops
      emptyStateChecked.current = true;
    }
  }, [t]);

  // Load more users for pagination
  const loadMoreUsers = useCallback(async () => {
    if (!state.hasMorePages || state.isLoadingMore) return;

    dispatch({ type: "LOAD_MORE_INIT" });

    try {
      const nextPage = state.currentPage + 1;
      const response = await api.getUsers({
        page: nextPage,
        limit: ITEMS_PER_PAGE,
      });

      if (response.status === "success" && Array.isArray(response.users)) {
        dispatch({
          type: "LOAD_MORE_SUCCESS",
          payload: {
            users: response.users || [],
            hasMore: response.pagination
              ? response.pagination.page < response.pagination.pages
              : (response.users || []).length >= ITEMS_PER_PAGE,
          },
        });
      } else {
        dispatch({ type: "LOAD_MORE_ERROR" });
      }
    } catch (err) {
      console.error("Error loading more users:", err);
      dispatch({ type: "LOAD_MORE_ERROR" });
    }
  }, [state.currentPage, state.hasMorePages, state.isLoadingMore]);

  // Delete user
  const deleteUser = useCallback(
    async (user: User) => {
      if (!user || !user.id) return;

      dispatch({ type: "DELETE_USER_INIT", payload: user.id });

      try {
        const response = await api.deleteUser(user.id);

        if (response.status === "success") {
          dispatch({ type: "DELETE_USER_SUCCESS", payload: user.id });
          markUserAsDeleted(user.id);
        } else {
          dispatch({
            type: "DELETE_USER_ERROR",
            payload: {
              id: user.id,
              error: response.message || `Failed to delete ${user.name}`,
            },
          });
        }
      } catch (err) {
        console.error(`Error deleting user ${user.id}:`, err);
        dispatch({
          type: "DELETE_USER_ERROR",
          payload: {
            id: user.id,
            error: err instanceof Error ? err.message : "Failed to delete user",
          },
        });
      }
    },
    [markUserAsDeleted]
  );

  // Update filtered users when search/sort or allUsers changes
  useEffect(() => {
    const filtered = sortAndFilterUsers(state.allUsers);
    dispatch({ type: "UPDATE_FILTERED_USERS", payload: filtered });

    // Reset visible users to first page when filter changes
    dispatch({
      type: "SET_VISIBLE_USERS",
      payload: filtered.slice(0, ITEMS_PER_PAGE),
    });
  }, [
    state.allUsers,
    state.searchQuery,
    state.sortField,
    state.sortDirection,
    sortAndFilterUsers,
  ]);

  // Load initial data on mount or reset
  useEffect(() => {
    // Check if data needs refresh based on cache TTL and empty state check
    const now = Date.now();
    const cacheExpired = now - state.lastUpdated > CACHE_TTL;
    const shouldCheckForUsers =
      state.allUsers.length === 0 && !emptyStateChecked.current;
    const shouldRefreshData = cacheExpired && state.allUsers.length > 0;

    if ((shouldCheckForUsers || shouldRefreshData) && !state.isLoading) {
      // Add a small delay to prevent rapid consecutive calls
      const timer = setTimeout(() => {
        loadUsers();
      }, API_REQUEST_DEBOUNCE);

      return () => clearTimeout(timer);
    }
  }, [loadUsers, state.lastUpdated, state.allUsers.length, state.isLoading]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Load more when user scrolls to bottom with some threshold
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      if (
        state.visibleUsers.length >= state.filteredUsers.length &&
        state.hasMorePages
      ) {
        // Need to load more data from API
        loadMoreUsers();
      } else if (state.visibleUsers.length < state.filteredUsers.length) {
        // We have more filtered results to show locally
        dispatch({
          type: "SET_VISIBLE_USERS",
          payload: state.filteredUsers.slice(
            0,
            state.visibleUsers.length + ITEMS_PER_PAGE
          ),
        });
      }
    }
  }, [
    state.filteredUsers,
    state.visibleUsers.length,
    state.hasMorePages,
    loadMoreUsers,
  ]);

  // Add scroll event listener
  useEffect(() => {
    const currentListRef = listRef.current;
    if (currentListRef) {
      currentListRef.addEventListener("scroll", handleScroll);
      return () => currentListRef.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Input handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleClearSearch = () => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
  };

  const handleSortChange = (field: SortField) => {
    dispatch({
      type: "SET_SORT",
      payload: {
        field,
        direction:
          state.sortField === field && state.sortDirection === "asc"
            ? "desc"
            : "asc",
      },
    });
  };

  const handleRefresh = () => {
    // Reset the empty state check to allow a new check
    emptyStateChecked.current = false;
    dispatch({ type: "RESET" });

    // Reset last request time to force a new request
    lastRequestTime.current = 0;
    loadUsers();
  };

  const confirmDelete = (user: User) => {
    setDeleteModalUser(user);
  };

  const cancelDelete = () => {
    setDeleteModalUser(null);
  };

  const confirmDeleteAction = () => {
    if (deleteModalUser) {
      deleteUser(deleteModalUser);
      setDeleteModalUser(null);
    }
  };

  const toggleViewMode = () => {
    dispatch({ type: "TOGGLE_VIEW_MODE" });
  };

  const handleUserCardClick = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  // Loading state
  if (state.isLoading && !state.visibleUsers.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={t("users:userList.title", {
            defaultValue: "Registered Users",
          })}
          subtitle={t("users:userList.subtitle", {
            defaultValue: "View and manage all registered users",
          })}
          icon={FiUsers}
        />
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-600">
            {t("users:userList.loading", { defaultValue: "Loading users..." })}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !state.visibleUsers.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={t("users:userList.title", {
            defaultValue: "Registered Users",
          })}
          subtitle={t("users:userList.subtitle", {
            defaultValue: "View and manage all registered users",
          })}
          icon={FiUsers}
        />
        <Alert
          variant="error"
          message={
            state.error ||
            t("users:userList.error", { defaultValue: "Failed to load users" })
          }
          className="mb-4"
        />
        <div className="flex justify-center">
          <Button onClick={handleRefresh} icon={FiRefreshCw}>
            {t("users:userList.retry", { defaultValue: "Retry" })}
          </Button>
        </div>
      </div>
    );
  }

  // Main component view
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={t("users:userList.title", { defaultValue: "Registered Users" })}
        subtitle={t("users:userList.subtitle", {
          defaultValue: "View and manage all registered users",
        })}
        icon={FiUsers}
      />

      {/* Search and filter card */}
      <Card className="mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("users:userList.searchPlaceholder", {
                  defaultValue: "Search users...",
                })}
                defaultValue={state.searchQuery}
                onChange={handleSearchChange}
              />
              {state.searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FiX className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Sort buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={state.sortField === "name" ? "primary" : "secondary"}
                onClick={() => handleSortChange("name")}
                className="whitespace-nowrap"
              >
                {t("users:userList.sortByName", {
                  defaultValue: "Sort by Name",
                })}
                {state.sortField === "name" && (
                  <span className="ml-1">
                    {state.sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </Button>
              <Button
                variant={
                  state.sortField === "created_at" ? "primary" : "secondary"
                }
                onClick={() => handleSortChange("created_at")}
                className="whitespace-nowrap"
              >
                {t("users:userList.sortByDate", {
                  defaultValue: "Sort by Date",
                })}
                {state.sortField === "created_at" && (
                  <span className="ml-1">
                    {state.sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </Button>
              <Button
                variant={
                  state.sortField === "department" ? "primary" : "secondary"
                }
                onClick={() => handleSortChange("department")}
                className="whitespace-nowrap"
              >
                {t("users:userList.sortByDept", { defaultValue: "Department" })}
                {state.sortField === "department" && (
                  <span className="ml-1">
                    {state.sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Tooltip
                content={
                  state.viewMode === "grid"
                    ? "Switch to list view"
                    : "Switch to grid view"
                }
              >
                <Button
                  variant="secondary"
                  onClick={toggleViewMode}
                  icon={state.viewMode === "grid" ? FiList : FiGrid}
                  className="whitespace-nowrap"
                >
                  {state.viewMode === "grid" ? "List View" : "Grid View"}
                </Button>
              </Tooltip>

              <Link to="/register-face">
                <Button
                  variant="success"
                  icon={FiPlus}
                  className="whitespace-nowrap"
                >
                  {t("users:userList.registerNew", {
                    defaultValue: "Register New",
                  })}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Status bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-600">
          {t("users:userList.showing", { defaultValue: "Showing" })}{" "}
          {state.visibleUsers.length}{" "}
          {t("users:userList.of", { defaultValue: "of" })}{" "}
          {state.filteredUsers.length}{" "}
          {t("users:userList.users", { defaultValue: "users" })}
          {state.searchQuery && (
            <span>
              {" "}
              {t("users:userList.matchingSearch", {
                defaultValue: "matching",
              })}{" "}
              "{state.searchQuery}"
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          icon={FiRefreshCw}
          onClick={handleRefresh}
          loading={state.isLoading}
          disabled={state.isLoading}
          className="text-gray-600"
        >
          {t("users:userList.refresh", { defaultValue: "Refresh" })}
        </Button>
      </div>

      {/* Empty state */}
      {state.filteredUsers.length === 0 && !state.isLoading && (
        <div className="flex justify-center py-10">
          <EmptyState
            title={
              state.searchQuery
                ? t("users:userList.noResults", {
                    defaultValue: "No results found",
                  })
                : t("users:userList.noUsers", {
                    defaultValue: "No users registered",
                  })
            }
            description={
              state.searchQuery
                ? t("users:userList.clearSearch", {
                    defaultValue:
                      "Try clearing your search or using different keywords",
                  })
                : t("users:userList.registerFirst", {
                    defaultValue:
                      "Register your first user to get started with face recognition",
                  })
            }
            icon={<FiUsers className="text-4xl" />}
            action={
              <Link to="/register-face">
                <Button variant="primary" icon={FiPlus}>
                  {t("users:userList.registerNew", {
                    defaultValue: "Register New User",
                  })}
                </Button>
              </Link>
            }
          />
        </div>
      )}

      {/* User grid/list */}
      <div
        ref={listRef}
        className={`
          ${
            state.viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-2"
          }
          overflow-auto max-h-[calc(100vh-300px)] transition-all duration-300
        `}
      >
        {state.visibleUsers.map((user) => (
          <OptimizedUserCard
            key={user.id}
            user={user}
            compact={state.viewMode === "list"}
            apiUrl={api.getServerUrl()}
            onClick={() => handleUserCardClick(user)}
            onDelete={confirmDelete}
            className={
              state.deletingUsers.includes(user.id)
                ? "opacity-50 pointer-events-none"
                : ""
            }
          />
        ))}
      </div>

      {/* Loading indicator */}
      {state.isLoadingMore && (
        <div className="flex justify-center items-center mt-4 pb-4">
          <Spinner size="md" />
          <span className="ml-2 text-gray-600">
            {t("users:userList.loading", { defaultValue: "Loading users..." })}
          </span>
        </div>
      )}

      {/* Load more button */}
      {!state.isLoadingMore &&
        state.hasMorePages &&
        state.visibleUsers.length === state.filteredUsers.length && (
          <div className="flex justify-center mt-4 pb-4">
            <Button variant="secondary" onClick={loadMoreUsers}>
              {t("users:userList.loadMore", { defaultValue: "Load More" })}
            </Button>
          </div>
        )}

      {/* Delete confirmation modal */}
      {deleteModalUser && (
        <Modal
          isOpen={true}
          onClose={cancelDelete}
          title={t("users:deleteUser.title", { defaultValue: "Delete User" })}
        >
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              {t("users:deleteUser.confirmation", {
                defaultValue: "Are you sure you want to delete",
              })}{" "}
              <strong>{deleteModalUser.name}</strong>?
              <br />
              {t("users:deleteUser.warning", {
                defaultValue: "This action cannot be undone.",
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelDelete}>
                {t("common:cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                variant="danger"
                icon={FiTrash2}
                onClick={confirmDeleteAction}
              >
                {t("users:deleteUser.confirm", { defaultValue: "Delete" })}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OptimizedUserList;
