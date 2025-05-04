// Export components - using OptimizedUserCard as the default UserCard for backward compatibility
export { default as UserCard } from "./OptimizedUserCard";


// Export optimized components
export { default as OptimizedUserList } from "./OptimizedUserList";
export { default as OptimizedUserDetail } from "./OptimizedUserDetail";
export { default as OptimizedUserCard } from "./OptimizedUserCard";

// Export enhanced components from components directory
export { default as EnhancedUserCard } from "./components/UserCard";

// Export types
export * from "./types";

// Export utilities
export * from "./utils/formatters";
