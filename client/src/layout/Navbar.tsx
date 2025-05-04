import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiCamera,
  FiUserPlus,
  FiGlobe,
} from "react-icons/fi";
import UserMenu from "../components/UserMenu";

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation(["nav", "app"]);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: t("nav:dashboard", "Dashboard"), path: "/", icon: FiHome },
    {
      name: t("nav:recognize", "Recognize"),
      path: "/recognize",
      icon: FiCamera,
    },
    {
      name: t("nav:register", "Register"),
      path: "/register-face",
      icon: FiUserPlus,
    },
    { name: t("nav:users", "Users"), path: "/users", icon: FiUsers },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLanguageChange = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  const renderLink = (link: (typeof navLinks)[0], mobile = false) => {
    const isActive = location.pathname === link.path;
    const Icon = link.icon;
    const baseClasses = `group relative ${
      mobile ? "flex text-base" : "inline-flex text-sm"
    } items-center px-4 py-2 font-medium`;

    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={mobile ? closeMenu : undefined}
        className={`${baseClasses} ${
          isActive ? "text-blue-700" : "text-gray-600 hover:text-blue-700"
        }`}
      >
        <Icon className="mr-2 h-5 w-5" />
        {link.name}
        <span
          className={`absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300 ease-in-out ${
            isActive ? "w-full" : "w-0 group-hover:w-full"
          }`}
        ></span>
      </Link>
    );
  };

  return (
    <>
      {/* Top header with logos and text */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-20 w-full px-6">
          <ul className="flex items-center gap-4">
            <li>
              <img
                src="./nav/logo2.png"
                alt="logo2"
                className="w-16 h-16 object-contain"
              />
            </li>
            <li>
              <img
                src="./nav/logo1.png"
                alt="logo1"
                className="w-16 h-16 object-contain"
              />
            </li>
          </ul>
          <div className="text-end">
            <h1 className="text-lg font-black text-blue-900 leading-5">
              {t("app:ministry", "وزارة الداخلية")} <br />
              {t("app:country", "جمهورية مصر العربية")}
            </h1>
          </div>
        </div>
      </nav>

      {/* Main navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                {t("app:name", "Face Recognition")}
              </Link>
            </div>

            <div className="hidden sm:flex space-x-4 ml-6">
              {navLinks.map((link) => renderLink(link))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="hidden sm:inline-flex p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                onClick={handleLanguageChange}
              >
                <FiGlobe className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <UserMenu />
              </div>

              <div className="sm:hidden">
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                >
                  {isMenuOpen ? (
                    <FiX className="h-6 w-6" />
                  ) : (
                    <FiMenu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden px-4 pt-4 pb-6 border-t border-gray-200 space-y-2">
            <div className="border-b pb-2 mb-2">
              <UserMenu />
            </div>

            {navLinks.map((link) => renderLink(link, true))}

            <button
              className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => {
                handleLanguageChange();
                closeMenu();
              }}
            >
              <FiGlobe className="mr-3 h-5 w-5" />
              {i18n.language === "en"
                ? t("nav:switchToArabic", "Switch to Arabic")
                : t("nav:switchToEnglish", "Switch to English")}
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
