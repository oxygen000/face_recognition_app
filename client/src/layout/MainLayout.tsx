import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * MainLayout component
 * Can be used with Outlet (for routes) or with direct children
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-grow py-8">{children ? children : <Outlet />}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
