import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";

/** Login button component */
const LoginButton: React.FC = () => {
  const { t } = useTranslation("userMenu");
  return (
    <Link
      to="/login"
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
    >
      {t("login", "Login")}
    </Link>
  );
};

/** User avatar component */
interface UserAvatarProps {
  name: string;
}
const UserAvatar: React.FC<UserAvatarProps> = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
    {name ? name.charAt(0).toUpperCase() : "U"}
  </div>
);

/** User info component */
interface UserInfoProps {
  name: string;
  email: string;
  role?: string;
}
const UserInfo: React.FC<UserInfoProps> = ({ name, email, role }) => (
  <div className="border-b border-gray-200 p-4">
    <p className="font-medium text-gray-800 truncate">{name}</p>
    <p className="text-sm text-gray-600 truncate">{email}</p>
    {role && (
      <p className="mt-1 text-xs bg-gray-100 text-gray-700 py-0.5 px-2 rounded inline-block">
        {role}
      </p>
    )}
  </div>
);

/** Menu items component */
interface MenuItemsProps {
  role?: string;
  onLogout: () => void;
  onCloseMenu: () => void;
}
const MenuItems: React.FC<MenuItemsProps> = ({
  role,
  onLogout,
  onCloseMenu,
}) => {
  const { t } = useTranslation("userMenu");
  return (
    <div className="py-2">
      <Link
        to="/profile"
        onClick={onCloseMenu}
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
      >
        {t("profile", "Profile")}
      </Link>
      {role === "admin" && (
        <Link
          to="/admin"
          onClick={onCloseMenu}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
        >
          {t("adminPanel", "Admin Panel")}
        </Link>
      )}
      <button
        onClick={onLogout}
        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
      >
        {t("logout", "Logout")}
      </button>
    </div>
  );
};

/** Dropdown menu component */
interface DropdownMenuProps {
  isOpen: boolean;
  name: string;
  email: string;
  role?: string;
  onLogout: () => void;
  onCloseMenu: () => void;
}
const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  name,
  email,
  role,
  onLogout,
  onCloseMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-56 sm:w-full sm:right-auto sm:left-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-fade-in">
      <UserInfo name={name} email={email} role={role} />
      <MenuItems role={role} onLogout={onLogout} onCloseMenu={onCloseMenu} />
    </div>
  );
};

/** Main user menu component */
const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation("userMenu");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/login");
  };

  if (!user) return <LoginButton />;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-gray-100 transition w-full sm:w-auto"
        aria-label={t("title", "User Menu")}
      >
        <UserAvatar name={user.name} />
        <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
          {user.name}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <DropdownMenu
        isOpen={isOpen}
        name={user.name}
        email={user.email}
        role={user.role}
        onLogout={handleLogout}
        onCloseMenu={() => setIsOpen(false)}
      />
    </div>
  );
};

export default UserMenu;
