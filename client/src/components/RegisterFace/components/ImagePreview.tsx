import React from "react";

interface ImagePreviewProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  placeholderText: string;
  acceptedFormats: string;
  required?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  onImageChange,
  previewUrl,
  placeholderText,
  acceptedFormats,
  required,
}) => {
  return (
    <div className="mb-4">
      <input type="file" accept={acceptedFormats} onChange={onImageChange} className="w-full" required={required} />
      {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 w-full h-64 object-cover" />}
      {!previewUrl && <p className="text-gray-400">{placeholderText}</p>}
    </div>
  );
};

export default ImagePreview;
