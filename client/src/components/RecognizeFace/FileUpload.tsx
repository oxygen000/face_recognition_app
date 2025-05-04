import React from "react";
import ImagePreview from "../common/ImagePreview";
import { TFunction } from "i18next";

interface FileUploadProps {
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  previewUrl: string | null;
  t?: TFunction;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onImageChange,
  previewUrl,
  t,
}) => (
  <div className="space-y-4">
    <ImagePreview
      onImageChange={onImageChange}
      previewUrl={previewUrl}
      placeholderText={t ? t("recognize.preview", "Preview") : "Preview"}
      acceptedFormats="image/*"
      required
    />
  </div>
);

export default FileUpload;
