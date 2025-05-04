import React from "react";
import { useTranslation } from "react-i18next";

interface PersonTypeSelectorProps {
  personType: "man" | "child";
  setPersonType: React.Dispatch<React.SetStateAction<"man" | "child">>;
}

const PersonTypeSelector: React.FC<PersonTypeSelectorProps> = ({ personType, setPersonType }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{t("register.form.personType")}</label>
      <div className="flex gap-6">
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="man"
            checked={personType === "man"}
            onChange={() => setPersonType("man")}
            className="form-radio"
          />
          <span className="ml-2">{t("register.form.man")}</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="child"
            checked={personType === "child"}
            onChange={() => setPersonType("child")}
            className="form-radio"
          />
          <span className="ml-2">{t("register.form.child")}</span>
        </label>
      </div>
    </div>
  );
};

export default PersonTypeSelector;
