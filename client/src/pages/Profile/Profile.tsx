import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiUser,
  FiMail,
  FiEdit,
  FiSave,
  FiKey,
  FiShield,
} from "react-icons/fi";
import { Card, Button, Alert } from "../../components/common";
import { useAuth } from "../../contexts/AuthContext";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert
          variant="error"
          message={t("profile.notLoggedIn", "You must be logged in to view this page")}
        />
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <FiUser className="mr-2" />
          {t("profile.title", "User Profile")}
        </h1>
        <p className="text-lg text-gray-600">
          {t("profile.subtitle", "Manage your account information")}
        </p>
      </header>

      {saveSuccess && (
        <Alert
          variant="success"
          message={t("profile.saveSuccess", "Profile updated successfully!")}
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <Card className="text-center p-6">
            <div className="mb-4">
              {user.avatar ? (
              <div className="w-32 h-32 rounded-full mx-auto bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-white shadow-lg">
              AD
            </div>
            
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold border-4 border-white shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600 mt-1">{user.email}</p>

            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <FiShield className="mr-1" />
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>

            <div className="mt-6">
              <Button onClick={() => setIsEditing(!isEditing)} className="w-full">
                {isEditing ? (
                  <>
                    <FiKey className="mr-2" />
                    {t("profile.cancelEdit", "Cancel Editing")}
                  </>
                ) : (
                  <>
                    <FiEdit className="mr-2" />
                    {t("profile.editProfile", "Edit Profile")}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </aside>

        {/* Main content */}
        <main className="md:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {t("profile.personalInfo", "Personal Information")}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("profile.personalInfoDesc", "Update your personal details")}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Username */}
                <FormField
                  label={t("profile.username", "Username")}
                  icon={<FiUser />}
                  value={user.username}
                  disabled
                  note={t("profile.usernameReadOnly", "Username cannot be changed")}
                />

                {/* Name */}
                <FormField
                  label={t("profile.name", "Full Name")}
                  icon={<FiUser />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />

                {/* Email */}
                <FormField
                  label={t("profile.email", "Email Address")}
                  icon={<FiMail />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="px-6 py-3 bg-gray-50 text-right border-t border-gray-200">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <FiSave className="mr-2" />
                    {t("profile.saveChanges", "Save Changes")}
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Security section */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t("profile.security", "Security")}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {t("profile.securityDesc", "Manage your password and security settings")}
              </p>
            </div>
            <div className="p-6">
              <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                <FiKey className="mr-2" />
                {t("profile.changePassword", "Change Password")}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

type FormFieldProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  note?: string;
};

const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  value,
  type = "text",
  disabled = false,
  onChange,
  note,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1 flex rounded-md shadow-sm">
      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-white text-black"
        }`}
      />
    </div>
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
  </div>
);

export default Profile;
