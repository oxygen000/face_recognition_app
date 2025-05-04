import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import WebcamForm from "./WebcamForm";
import UploadForm from "./UploadForm";
import  useRegisterFace  from "../hooks/useRegisterFace";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [isWebcamMode, setIsWebcamMode] = useState(false);
  const { resetForm } = useRegisterFace();

  const toggleMode = () => {
    setIsWebcamMode((prev) => !prev);
    resetForm();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{t("register.title")}</h2>
        <button
          onClick={toggleMode}
          className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {isWebcamMode ? t("register.useUpload") : t("register.useWebcam")}
        </button>
      </div>
      {isWebcamMode ? <WebcamForm /> : <UploadForm /> }
    </div>
  );
};

export default RegisterPage;
