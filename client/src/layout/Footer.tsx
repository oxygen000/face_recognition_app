import ApiStatus from "./ApiStatus";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();
  const date = new Date(); // الحصول على تاريخ اليوم الحالي
  const year = date.toLocaleDateString("en-EG", { // تنسيق التاريخ ليعرض السنة فقط بصيغة "رقمية" باستخدام التواريخ الخاصة بمنطقة "مصر"
    year: "numeric",
  });

  return (
    <>
    <ApiStatus/>
      <footer className="w-full  bg-white  mt-4 border-t border-gray-200 shadow-sm"> {/* الشريط السفلي مع حدود علوية رمادية وخلفية بيضاء وظل خفيف */}
      <div className="max-w-7xl mx-auto px-4"> {/* تحديد العرض الأقصى للشريط السفلي، وتوسيطه أفقياً داخل الصفحة مع إضافة مسافات داخلية */}
        <ul className="flex flex-col md:flex-row items-center justify-between p-4 font-semibold gap-2 text-center text-sm md:text-base"> 
          {/* قائمة عمودية على الأجهزة الصغيرة، تتحول إلى أفقية على الأجهزة الكبيرة باستخدام flex */}
          <li>
            <p>{t("footer.supervision", "الإشراف")} <br/>
                {t("footer.supervisor", "العقيد / محمد مجدي حسنين")}</p> {/* أول عنصر في القائمة يعرض نص (اسم الشخص المشرف) */}
          </li>
          <li>
            Smart ID Face {year} {/* عرض النص "Smart ID Facr Police Edition" مع السنة الحالية */}
          </li>
          <li>
            <p>{t("footer.development", "برمجة")} <br/>
            {t("footer.developer", "المندس / مهندس / عبد الحميد رضا")}</p> {/* عنصر يعرض اسم الشخص المبرمج */}
          </li>
        </ul>
      </div>
    </footer>
    </>
  
  );
}

export default Footer;
