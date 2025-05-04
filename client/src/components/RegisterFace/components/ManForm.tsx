import React from "react";
import { useTranslation } from "react-i18next";
import ImagePreview from "../../common/ImagePreview";

interface ManFormProps {
    nameRef: React.RefObject<HTMLInputElement | null>;
    employeeIdRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (file: File | null, previewUrl: string | null) => void;
    previewUrl: string;
    loading: boolean;
    handleSubmit: (event: React.FormEvent) => void;
  }

const ManForm: React.FC<ManFormProps> = ({
  nameRef,
  employeeIdRef,
  handleFileSelect,
  previewUrl,
  loading,
  handleSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">{t("register.form.manName")}</label>
        <input
          type="text"
          ref={nameRef}
          placeholder={t("register.form.namePlaceholder") || ""}
          required
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">{t("register.form.manEmployeeId")}</label>
        <input
          type="text"
          ref={employeeIdRef}
          placeholder={t("register.form.employeeIdPlaceholder") || ""}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <ImagePreview
        onImageChange={(file, previewUrl) => handleFileSelect(file, previewUrl)}
        previewUrl={previewUrl}
        placeholderText={t("register.form.photoPlaceholder") || ""}
        acceptedFormats="image/*"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-md text-white font-medium ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? t("register.form.processing") : t("register.form.submit")}
      </button>
    </form>
  );
};

export default ManForm;
