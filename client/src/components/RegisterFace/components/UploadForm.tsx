import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import useRegisterFace from "../hooks/useRegisterFace";
import ChildForm from "./ChildForm";
import ManForm from "./ManForm";




const UploadForm: React.FC = () => {
  const { t } = useTranslation();
  const { loading, handleSubmit, handleFileSelect, previewUrl } = useRegisterFace();

  const nameRef = useRef<HTMLInputElement>(null);  // مراجع للأسماء
  const employeeIdRef = useRef<HTMLInputElement>(null);  // مراجع لرقم الموظف

  // إضافة حالة personType لتحديد نوع النموذج
  const [personType, setPersonType] = useState<"man" | "child">("man");

  const toggleForm = () => {
    setPersonType((prev) => (prev === "man" ? "child" : "man"));
  };

  return (
    <div>
      {/* زر التبديل بين نموذج الرجل والطفل */}
      <button
        type="button"
        onClick={toggleForm}
        className="w-full py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700"
      >
        {personType === "man" ? t("register.form.switchToChild") : t("register.form.switchToMan")}
      </button>

      {/* عرض النموذج المناسب بناءً على الشخص */}
      {personType === "man" ? (
        <ManForm
          nameRef={nameRef}
          employeeIdRef={employeeIdRef}
          handleFileSelect={handleFileSelect}
          previewUrl={previewUrl || ""}  // تعيين قيمة افتراضية إذا كانت null
          loading={loading}
          handleSubmit={handleSubmit}
        />
      ) : (
        <ChildForm
          nameRef={nameRef}
          employeeIdRef={employeeIdRef}
          handleFileSelect={handleFileSelect}
          previewUrl={previewUrl || ""}  // تعيين قيمة افتراضية إذا كانت null
          loading={loading}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default UploadForm;
