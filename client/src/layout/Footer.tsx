import ApiStatus from "./ApiStatus";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation("footer");
  const date = new Date(); // Get current date
  const year = date.toLocaleDateString("en-EG", {
    // Format date to show only the year in numeric format using Egypt locale
    year: "numeric",
  });

  return (
    <>
      <ApiStatus />
      <footer className="w-full bg-white mt-4 border-t border-gray-200 shadow-sm">
        {/* Footer with top gray border, white background and light shadow */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Set maximum width for footer, center it horizontally with padding */}
          <ul className="flex flex-col md:flex-row items-center justify-between p-4 font-semibold gap-2 text-center text-sm md:text-base">
            {/* Vertical list on small devices, horizontal on larger ones using flex */}
            <li>
              <p>
                {t("supervision", "الإشراف")} <br />
                {t("supervisor", "العقيد / محمد مجدي حسنين")}
              </p>
              {/* First list item showing supervisor name */}
            </li>
            <li>
              {t("appName", "Smart ID Face")} {year}
            </li>
            <li>
              <p>
                {t("development", "برمجة")} <br />
                {t("developer", "المهندس / عبد الحميد رضا")}
              </p>
              {/* List item showing developer name */}
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}

export default Footer;
