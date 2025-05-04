import { User } from "../../../types";

// Constants
export const ITEMS_PER_PAGE = 12;
export const CACHE_TTL = 120000; // 2 minutes cache TTL

// State type
export type SortField = "name" | "created_at" | "department" | "role";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";

export interface UserListState {
  allUsers: User[];
  filteredUsers: User[];
  visibleUsers: User[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMorePages: boolean;
  currentPage: number;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  deletingUsers: string[];
  viewMode: ViewMode;
  lastUpdated: number;
}

// Action types for reducer
export type UserListAction =
  | { type: "FETCH_INIT" }
  | {
      type: "FETCH_SUCCESS";
      payload: {
        users: User[];
        pagination?: { page: number; pages: number };
        hasMorePages?: boolean;
      };
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_FILTERED_USERS"; payload: User[] }
  | { type: "SET_VISIBLE_USERS"; payload: User[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | {
      type: "SET_SORT";
      payload: { field: SortField; direction: SortDirection };
    }
  | { type: "LOAD_MORE_INIT" }
  | { type: "LOAD_MORE_SUCCESS"; payload: { users: User[]; hasMore: boolean } }
  | { type: "LOAD_MORE_ERROR" }
  | { type: "DELETE_USER_INIT"; payload: string }
  | { type: "DELETE_USER_SUCCESS"; payload: string }
  | { type: "DELETE_USER_ERROR"; payload: { id: string; error: string } }
  | { type: "ADD_USER"; payload: User }
  | { type: "TOGGLE_VIEW_MODE" }
  | { type: "RESET" };

// Initial state
export const initialState: UserListState = {
  allUsers: [],
  filteredUsers: [],
  visibleUsers: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMorePages: true,
  currentPage: 1,
  searchQuery: "",
  sortField: "name",
  sortDirection: "asc",
  deletingUsers: [],
  viewMode: "grid",
  lastUpdated: 0,
};

// Reducer function
export function userListReducer(
  state: UserListState,
  action: UserListAction
): UserListState {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        allUsers: action.payload.users,
        hasMorePages: action.payload.hasMorePages || false,
        currentPage: action.payload.pagination?.page || 1,
        lastUpdated: Date.now(),
      };
    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "UPDATE_FILTERED_USERS":
      return {
        ...state,
        filteredUsers: action.payload,
      };
    case "SET_VISIBLE_USERS":
      return {
        ...state,
        visibleUsers: action.payload,
      };
    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
      };
    case "SET_SORT":
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction,
      };
    case "LOAD_MORE_INIT":
      return {
        ...state,
        isLoadingMore: true,
      };
    case "LOAD_MORE_SUCCESS":
      return {
        ...state,
        isLoadingMore: false,
        allUsers: [
          ...state.allUsers,
          ...action.payload.users.filter(
            (newUser) => !state.allUsers.some((user) => user.id === newUser.id)
          ),
        ],
        hasMorePages: action.payload.hasMore,
        currentPage: state.currentPage + 1,
      };
    case "LOAD_MORE_ERROR":
      return {
        ...state,
        isLoadingMore: false,
        hasMorePages: false,
      };
    case "DELETE_USER_INIT":
      return {
        ...state,
        deletingUsers: [...state.deletingUsers, action.payload],
      };
    case "DELETE_USER_SUCCESS":
      return {
        ...state,
        allUsers: state.allUsers.filter((user) => user.id !== action.payload),
        deletingUsers: state.deletingUsers.filter(
          (id) => id !== action.payload
        ),
        lastUpdated: Date.now(),
      };
    case "DELETE_USER_ERROR":
      return {
        ...state,
        deletingUsers: state.deletingUsers.filter(
          (id) => id !== action.payload.id
        ),
        error: action.payload.error,
      };
    case "ADD_USER":
      // Add user only if it doesn't already exist
      if (state.allUsers.some((user) => user.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        allUsers: [action.payload, ...state.allUsers],
        lastUpdated: Date.now(),
      };
    case "TOGGLE_VIEW_MODE":
      return {
        ...state,
        viewMode: state.viewMode === "grid" ? "list" : "grid",
      };
    case "RESET":
      return {
        ...initialState,
        isLoading: true,
      };
    default:
      return state;
  }
}
