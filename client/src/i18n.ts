import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Comprehensive translations
const resources = {
  en: {
    translation: {
      // App general
      "app.name": "Face Recognition",
      "app.title": "Face Recognition App",
      "app.loading": "Loading...",

      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.recognize": "Recognize",
      "nav.register": "Register",
      "nav.users": "Users",
      "nav.settings": "Settings",
      "nav.about": "About",
      "nav.login": "Login",
      "nav.logout": "Logout",
      "nav.profile": "Profile",
      "nav.switchToArabic": "Switch to Arabic",
      "nav.switchToEnglish": "Switch to English",
      "nav.darkMode": "Switch to Dark Mode",
      "nav.lightMode": "Switch to Light Mode",

      // User menu
      "userMenu.profile": "Your Profile",
      "userMenu.settings": "Settings",
      "userMenu.signOut": "Sign out",

      // Login page
      "login.title": "Sign in to your account",
      "login.subtitle": "Access the face recognition system",
      "login.username": "Username",
      "login.usernamePlaceholder": "Enter your username",
      "login.password": "Password",
      "login.passwordPlaceholder": "Enter your password",
      "login.rememberMe": "Remember me",
      "login.forgotPassword": "Forgot your password?",
      "login.signIn": "Sign in",
      "login.signingIn": "Signing in...",
      "login.orContinueWith": "Or continue with",
      "login.demoCredentials": "Demo credentials:",
      "login.or": "or",

      // Profile page
      "profile.title": "User Profile",
      "profile.subtitle": "Manage your account information",
      "profile.notLoggedIn": "You must be logged in to view this page",
      "profile.saveSuccess": "Profile updated successfully!",
      "profile.personalInfo": "Personal Information",
      "profile.personalInfoDesc": "Update your personal details",
      "profile.username": "Username",
      "profile.usernameReadOnly": "Username cannot be changed",
      "profile.name": "Full Name",
      "profile.email": "Email Address",
      "profile.security": "Security",
      "profile.securityDesc": "Manage your password and security settings",
      "profile.changePassword": "Change Password",
      "profile.editProfile": "Edit Profile",
      "profile.cancelEdit": "Cancel Editing",
      "profile.saveChanges": "Save Changes",

      // Unauthorized page
      "unauthorized.title": "Access Denied",
      "unauthorized.message": "You don't have permission to access this page.",
      "unauthorized.loggedInAs": "You are logged in as:",
      "unauthorized.currentRole": "Current role:",
      "unauthorized.goHome": "Go to Home",
      "unauthorized.goBack": "Go Back",

      // Settings page
      "settings.title": "System Settings",
      "settings.subtitle":
        "Configure your facial recognition system preferences",
      "settings.appearance": "Appearance",
      "settings.darkMode": "Dark Mode",
      "settings.darkModeDescription": "Enable dark mode for the interface",
      "settings.language": "Language",
      "settings.recognition": "Recognition Settings",
      "settings.threshold": "Recognition Threshold",
      "settings.thresholdDescription":
        "Lower values increase sensitivity but may cause false positives",
      "settings.saveSettings": "Save Settings",
      "settings.resetDefaults": "Reset to Defaults",

      // Registration
      "register.title": "Register Your Face",
      "register.description": "Register your face for quick recognition",
      "register.form.name": "Full Name",
      "register.form.namePlaceholder": "Enter your full name",
      "register.form.employeeId": "Employee ID",
      "register.form.employeeIdPlaceholder":
        "Enter your employee ID (optional)",
      "register.form.photo": "Photo",
      "register.form.photoDesc": "Please upload a clear photo of your face",
      "register.form.processing": "Processing...",
      "register.form.submit": "Register Face",
      "register.newspaper.intro":
        "Face recognition technology is now available for secure access to our facilities.",
      "register.newspaper.benefits":
        "Benefits include faster access, improved security, and contactless verification.",
      "register.newspaper.formTitle": "Registration Form",
      "register.newspaper.privacy":
        "Your privacy is important to us. Face data is securely stored and only used for verification purposes.",
    },
  },
  ar: {
    translation: {
      // App general
      "app.name": "التعرف على الوجه",
      "app.title": "تطبيق التعرف على الوجه",
      "app.loading": "جار التحميل...",

      // Navigation
      "nav.dashboard": "لوحة التحكم",
      "nav.recognize": "التعرف",
      "nav.register": "التسجيل",
      "nav.users": "المستخدمون",
      "nav.settings": "الإعدادات",
      "nav.about": "حول",
      "nav.login": "تسجيل الدخول",
      "nav.logout": "تسجيل الخروج",
      "nav.profile": "الملف الشخصي",
      "nav.switchToArabic": "التبديل إلى العربية",
      "nav.switchToEnglish": "التبديل إلى الإنجليزية",
      "nav.darkMode": "التبديل إلى الوضع الداكن",
      "nav.lightMode": "التبديل إلى الوضع الفاتح",

      // User menu
      "userMenu.profile": "ملفك الشخصي",
      "userMenu.settings": "الإعدادات",
      "userMenu.signOut": "تسجيل الخروج",

      // Login page
      "login.title": "تسجيل الدخول إلى حسابك",
      "login.subtitle": "الوصول إلى نظام التعرف على الوجه",
      "login.username": "اسم المستخدم",
      "login.usernamePlaceholder": "أدخل اسم المستخدم",
      "login.password": "كلمة المرور",
      "login.passwordPlaceholder": "أدخل كلمة المرور",
      "login.rememberMe": "تذكرني",
      "login.forgotPassword": "نسيت كلمة المرور؟",
      "login.signIn": "تسجيل الدخول",
      "login.signingIn": "جاري تسجيل الدخول...",
      "login.orContinueWith": "أو تابع باستخدام",
      "login.demoCredentials": "بيانات اعتماد تجريبية:",
      "login.or": "أو",

      // Profile page
      "profile.title": "الملف الشخصي",
      "profile.subtitle": "إدارة معلومات حسابك",
      "profile.notLoggedIn": "يجب تسجيل الدخول لعرض هذه الصفحة",
      "profile.saveSuccess": "تم تحديث الملف الشخصي بنجاح!",
      "profile.personalInfo": "المعلومات الشخصية",
      "profile.personalInfoDesc": "تحديث بياناتك الشخصية",
      "profile.username": "اسم المستخدم",
      "profile.usernameReadOnly": "لا يمكن تغيير اسم المستخدم",
      "profile.name": "الاسم الكامل",
      "profile.email": "البريد الإلكتروني",
      "profile.security": "الأمان",
      "profile.securityDesc": "إدارة كلمة المرور وإعدادات الأمان",
      "profile.changePassword": "تغيير كلمة المرور",
      "profile.editProfile": "تعديل الملف الشخصي",
      "profile.cancelEdit": "إلغاء التعديل",
      "profile.saveChanges": "حفظ التغييرات",

      // Unauthorized page
      "unauthorized.title": "تم رفض الوصول",
      "unauthorized.message": "ليس لديك إذن للوصول إلى هذه الصفحة.",
      "unauthorized.loggedInAs": "أنت مسجل الدخول باسم:",
      "unauthorized.currentRole": "الدور الحالي:",
      "unauthorized.goHome": "الذهاب إلى الصفحة الرئيسية",
      "unauthorized.goBack": "الرجوع",

      // Settings page
      "settings.title": "إعدادات النظام",
      "settings.subtitle": "تكوين تفضيلات نظام التعرف على الوجه",
      "settings.appearance": "المظهر",
      "settings.darkMode": "الوضع الداكن",
      "settings.darkModeDescription": "تمكين الوضع الداكن للواجهة",
      "settings.language": "اللغة",
      "settings.recognition": "إعدادات التعرف",
      "settings.threshold": "عتبة التعرف",
      "settings.thresholdDescription":
        "القيم المنخفضة تزيد الحساسية ولكن قد تسبب إيجابيات خاطئة",
      "settings.saveSettings": "حفظ الإعدادات",
      "settings.resetDefaults": "إعادة تعيين الإعدادات الافتراضية",

      // Registration
      "register.title": "تسجيل وجهك",
      "register.description": "سجل وجهك للتعرف السريع",
      "register.form.name": "الاسم الكامل",
      "register.form.namePlaceholder": "أدخل اسمك الكامل",
      "register.form.employeeId": "رقم الموظف",
      "register.form.employeeIdPlaceholder": "أدخل رقم الموظف (اختياري)",
      "register.form.photo": "الصورة",
      "register.form.photoDesc": "يرجى تحميل صورة واضحة لوجهك",
      "register.form.processing": "جاري المعالجة...",
      "register.form.submit": "تسجيل الوجه",
      "register.newspaper.intro":
        "تقنية التعرف على الوجه متاحة الآن للوصول الآمن إلى منشآتنا.",
      "register.newspaper.benefits":
        "تشمل المزايا وصولًا أسرع وأمانًا محسنًا وتحققًا بدون تلامس.",
      "register.newspaper.formTitle": "نموذج التسجيل",
      "register.newspaper.privacy":
        "خصوصيتك مهمة بالنسبة لنا. يتم تخزين بيانات الوجه بشكل آمن وتستخدم فقط لأغراض التحقق.",
    },
  },
};

// Function to get initial language
const getInitialLanguage = () => {
  // Check for stored language preference
  const storedLang = localStorage.getItem("i18nextLng");
  if (storedLang && ["en", "ar"].includes(storedLang)) {
    return storedLang;
  }

  return "en";
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Language detection options
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },

    // React-specific options
    react: {
      useSuspense: true,
    },
  });

// Set document direction on initialization
const setInitialDirection = () => {
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = i18n.language;
  document.body.className = `lang-${i18n.language}`;
};

setInitialDirection();

export default i18n;
