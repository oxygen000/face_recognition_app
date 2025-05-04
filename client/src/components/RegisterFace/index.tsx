import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import WebcamForm from "./components/WebcamForm";
import UploadForm from "./components/UploadForm";
import { FiUserPlus, FiCheck, FiCamera, FiUpload } from "react-icons/fi";

/**
 * Face registration component
 */
const RegisterFace: React.FC = () => {
  const { t } = useTranslation("register");
  const [registeredUser, setRegisteredUser] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<
    "webcam" | "upload"
  >("webcam");

  const handleRegistrationSuccess = (userName: string) => {
    setRegisteredUser(userName);
    setShowSuccess(true);

    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 text-white">
          <h1 className="text-3xl font-bold text-center flex items-center justify-center">
            <FiUserPlus className="mr-3" />
            {t("title", "Register New Face")}
          </h1>
          <p className="text-center mt-2 text-green-100">
            {t(
              "description",
              "Complete the form below to register a new face in the system."
            )}
          </p>
        </div>

        <div className="p-6">
          {showSuccess && (
            <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded relative flex items-center">
              <FiCheck className="text-green-500 mr-2 text-xl" />
              <span>
                {t(
                  "success",
                  "Successfully registered {{name}} in the system!",
                  {
                    name: registeredUser,
                  }
                )}
              </span>
            </div>
          )}

          {/* Registration method selection */}
          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => setRegistrationMethod("webcam")}
              className={`flex items-center px-4 py-2 rounded-lg ${
                registrationMethod === "webcam"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FiCamera className="mr-2" />
              {t("method.webcam", "Use Webcam")}
            </button>
            <button
              onClick={() => setRegistrationMethod("upload")}
              className={`flex items-center px-4 py-2 rounded-lg ${
                registrationMethod === "upload"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FiUpload className="mr-2" />
              {t("method.upload", "Upload Photo")}
            </button>
          </div>

          {registrationMethod === "webcam" ? (
            <WebcamForm onSuccess={handleRegistrationSuccess} />
          ) : (
            <UploadForm onSuccess={handleRegistrationSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFace;
