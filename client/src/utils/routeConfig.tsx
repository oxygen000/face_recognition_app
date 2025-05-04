import { RouteObject } from "react-router-dom";
import { MainLayout } from "../layout";
import {
  Dashboard,
  Login,
  Profile,
  Unauthorized,
} from "../pages";
import RegisterFace from "../components/RegisterFace";
import RecognizeFace from "../components/RecognizeFace";
import {
  OptimizedUserList as UserList,
  OptimizedUserDetail as UserDetail,
} from "../components/users";
import ProtectedRoute from "../components/auth/ProtectedRoute";

/**
 * Route definitions for the application
 * Includes authentication and role-based access control
 */
export const routes: RouteObject[] = [
  // Public routes (no authentication required)
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },

  // Main application routes with layout
  {
    element: <MainLayout />,
    children: [
      // Public routes within main layout
      {
        path: "/",
        element: <Dashboard />,
      },
      

      // Protected routes (require authentication)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/recognize",
            element: <RecognizeFace />,
          },
        ],
      },

      // Admin-only routes
      {
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          {
            path: "/register-face",
            element: <RegisterFace />,
          },
          {
            path: "/users",
            element: <UserList />,
          },
          {
            path: "/users/:userId",
            element: <UserDetail />,
          },
        ],
      },
    ],
  },

  // Catch-all route for 404
  {
    path: "*",
    element: (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </MainLayout>
    ),
  },
];
