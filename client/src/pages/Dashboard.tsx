import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../components/common";
import { FiUsers, FiCamera, FiInfo } from "react-icons/fi";

/**
 * Dashboard page component
 * Serves as the main landing page with quick access to all major features
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation("dashboard");

  // Define the main feature cards
  const featureCards = [
    {
      title: t("features.register.title", "Register Face"),
      description: t(
        "features.register.description",
        "Register a new user with facial recognition"
      ),
      icon: <FiCamera className="w-8 h-8 text-blue-500" />,
      link: "/register-face",
      color: "bg-blue-50",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: t("features.recognize.title", "Recognize Face"),
      description: t(
        "features.recognize.description",
        "Identify users with facial recognition"
      ),
      icon: <FiCamera className="w-8 h-8 text-green-500" />,
      link: "/recognize",
      color: "bg-green-50",
      buttonColor: "bg-green-500 hover:bg-green-600",
    },
    {
      title: t("features.users.title", "Manage Users"),
      description: t(
        "features.users.description",
        "View and manage all registered users"
      ),
      icon: <FiUsers className="w-8 h-8 text-purple-500" />,
      link: "/users",
      color: "bg-purple-50",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {t("title", "Facial Recognition System")}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t(
            "subtitle",
            "Secure, fast, and reliable facial recognition for identity verification"
          )}
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {featureCards.map((card, index) => (
          <Card key={index} className={`${card.color} border-none h-full`}>
            <div className="flex flex-col h-full">
              <div className="mb-4">{card.icon}</div>
              <h2 className="text-xl font-bold mb-2">{card.title}</h2>
              <p className="text-gray-600 mb-6 flex-grow">{card.description}</p>
              <Link
                to={card.link}
                className={`${card.buttonColor} text-white py-2 px-4 rounded-md inline-block text-center transition-colors`}
              >
                {t("features.accessButton", "Access")}
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* System status section */}
      <Card className="mb-8">
        <div className="flex items-center mb-4">
          <FiInfo className="w-6 h-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-bold">
            {t("status.title", "System Status")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-md">
            <div className="font-medium text-gray-700">
              {t("status.api", "API Status")}
            </div>
            <div className="text-green-600 font-bold">
              {t("status.online", "Online")}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="font-medium text-gray-700">
              {t("status.users", "Registered Users")}
            </div>
            <div className="text-blue-600 font-bold">
              {t("status.active", "Active")}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="font-medium text-gray-700">
              {t("status.recognition", "Recognition Service")}
            </div>
            <div className="text-purple-600 font-bold">
              {t("status.running", "Running")}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
