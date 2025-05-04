import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next";
import useRegisterFace from "../hooks/useRegisterFace";

const WebcamForm: React.FC = () => {
  const { t } = useTranslation();
  const webcamRef = useRef<Webcam>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [webcamName, setWebcamName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [webcamCapture, setWebcamCapture] = useState<string | null>(null);
  const [personType, setPersonType] = useState<"man" | "child">("man");

  const { loading, registerWithWebcam } = useRegisterFace();

  const toggleCameraFacing = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const toggleForm = () => {
    setPersonType((prev) => (prev === "man" ? "child" : "man"));
    setWebcamName("");
    setGuardianName("");
  };

  const captureWebcamPhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setWebcamCapture(imageSrc);
    }
  }, []);

  const handleWebcamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = personType === "man" ? webcamName : `${webcamName} (${guardianName})`;
    await registerWithWebcam(fullName);
    setWebcamName("");
    setGuardianName("");
    setWebcamCapture(null);
  };

  return (
    <form onSubmit={handleWebcamSubmit} className="space-y-4">
      <button
        type="button"
        onClick={toggleForm}
        className="w-full py-2 rounded-md text-white font-medium bg-gray-600 hover:bg-gray-700"
      >
        {personType === "man" ? t("register.form.switchToChild") : t("register.form.switchToMan")}
      </button>

      {personType === "man" ? (
        <div>
          <label className="block font-medium mb-1">{t("register.form.fullName")}</label>
          <input
            type="text"
            placeholder={t("register.form.fullNamePlaceholder")}
            value={webcamName}
            onChange={(e) => setWebcamName(e.target.value)}
            required
            className="w-full p-2 border rounded-md"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">{t("register.form.childName")}</label>
            <input
              type="text"
              placeholder={t("register.form.childNamePlaceholder")}
              value={webcamName}
              onChange={(e) => setWebcamName(e.target.value)}
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">{t("register.form.guardianName")}</label>
            <input
              type="text"
              placeholder={t("register.form.guardianNamePlaceholder")}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      )}

      <div className="relative w-full border rounded-lg overflow-hidden">
        {webcamCapture ? (
          <div className="relative">
            <img src={webcamCapture} alt="Captured" className="w-full h-64 object-cover" />
            <button
              type="button"
              onClick={() => setWebcamCapture(null)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              audio={false}
              videoConstraints={{
                width: 500,
                height: 375,
                facingMode: cameraFacingMode,
              }}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-3 w-full flex justify-center gap-4">
              <button
                type="button"
                onClick={captureWebcamPhoto}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {t("register.capture")}
              </button>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                {t("register.switchCamera")}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-md text-white font-medium ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? t("register.form.processing") : t("register.form.submit")}
      </button>
    </form>
  );
};

export default WebcamForm;
