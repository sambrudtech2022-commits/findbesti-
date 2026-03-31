import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "hi";

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  // Bottom Nav
  "nav.home": { en: "Home", hi: "होम" },
  "nav.chat": { en: "Chat", hi: "चैट" },
  "nav.call": { en: "Call", hi: "कॉल" },
  "nav.profile": { en: "Profile", hi: "प्रोफ़ाइल" },

  // Auth Page
  "auth.getOtp": { en: "Get OTP →", hi: "OTP प्राप्त करें →" },
  "auth.sending": { en: "Sending...", hi: "भेज रहे हैं..." },
  "auth.verifyOtp": { en: "Verify OTP ✓", hi: "OTP सत्यापित करें ✓" },
  "auth.verifying": { en: "Verifying...", hi: "सत्यापित हो रहा है..." },
  "auth.changeNumber": { en: "Change Number", hi: "नंबर बदलें" },
  "auth.otpSentTo": { en: "OTP sent to:", hi: "OTP भेजा गया:" },
  "auth.enterOtp": { en: "Enter 6-digit OTP", hi: "6-अंकों का OTP दर्ज करें" },
  "auth.enterMobile": { en: "Enter mobile number", hi: "मोबाइल नंबर दर्ज करें" },
  "auth.continueGoogle": { en: "Continue with Google", hi: "Google से जारी रखें" },
  "auth.pleaseWait": { en: "Please wait...", hi: "कृपया प्रतीक्षा करें..." },
  "auth.or": { en: "or", hi: "या" },
  "auth.terms": { en: "By proceeding I accept the", hi: "आगे बढ़कर मैं स्वीकार करता/करती हूँ" },
  "auth.termsLink": { en: "Terms", hi: "शर्तें" },
  "auth.guidelinesLink": { en: "Community Guidelines", hi: "सामुदायिक दिशानिर्देश" },
  "auth.privacyLink": { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  "auth.safe": { en: "100% safe & secure", hi: "100% सुरक्षित" },
  "auth.noFake": { en: "Zero fake profiles", hi: "कोई फर्जी प्रोफ़ाइल नहीं" },

  // Toast messages
  "toast.otpSent": { en: "OTP sent successfully!", hi: "OTP सफलतापूर्वक भेजा गया!" },
  "toast.otpFailed": { en: "Failed to send OTP", hi: "OTP भेजने में विफल" },
  "toast.enterOtp": { en: "Please enter OTP", hi: "कृपया OTP दर्ज करें" },
  "toast.loginSuccess": { en: "Login successful!", hi: "लॉगिन सफल!" },
  "toast.otpVerifyFailed": { en: "OTP verification failed", hi: "OTP सत्यापन विफल" },
  "toast.invalidMobile": { en: "Please enter a valid mobile number", hi: "कृपया वैध मोबाइल नंबर दर्ज करें" },

  // Settings
  "settings.title": { en: "Settings", hi: "सेटिंग्स" },
  "settings.preferences": { en: "Preferences", hi: "प्राथमिकताएँ" },
  "settings.general": { en: "General", hi: "सामान्य" },
  "settings.notifications": { en: "Notifications", hi: "सूचनाएँ" },
  "settings.darkMode": { en: "Dark Mode", hi: "डार्क मोड" },
  "settings.profileVisible": { en: "Profile Visible", hi: "प्रोफ़ाइल दृश्य" },
  "settings.language": { en: "Language", hi: "भाषा" },
  "settings.privacyPolicy": { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  "settings.helpSupport": { en: "Help & Support", hi: "सहायता" },
  "settings.about": { en: "About", hi: "जानकारी" },
  "settings.purchaseHistory": { en: "Purchase History", hi: "खरीद इतिहास" },
  "settings.noPurchases": { en: "No purchases yet", hi: "अभी तक कोई खरीदारी नहीं" },
  "settings.premiumActive": { en: "Premium Active", hi: "प्रीमियम सक्रिय" },
  "settings.expires": { en: "Expires", hi: "समाप्ति" },

  // Language names
  "lang.en": { en: "English", hi: "English" },
  "lang.hi": { en: "Hindi", hi: "हिन्दी" },

  // Common
  "common.comingSoon": { en: "Coming soon!", hi: "जल्द आ रहा है!" },

  // Home / Index
  "home.online": { en: "Online", hi: "ऑनलाइन" },
  "home.followers": { en: "Followers", hi: "फॉलोअर्स" },

  // Profile
  "profile.editProfile": { en: "Edit Profile", hi: "प्रोफ़ाइल संपादित करें" },
  "profile.coins": { en: "Coins", hi: "सिक्के" },
  "profile.premium": { en: "Premium", hi: "प्रीमियम" },
  "profile.favorites": { en: "Favorites", hi: "पसंदीदा" },
  "profile.settings": { en: "Settings", hi: "सेटिंग्स" },
  "profile.logout": { en: "Log Out", hi: "लॉग आउट" },
  "profile.earnCoins": { en: "Earn Coins", hi: "सिक्के कमाएँ" },
  "profile.referral": { en: "Referral", hi: "रेफ़रल" },
  "profile.whoLikedMe": { en: "Who Liked Me", hi: "किसने पसंद किया" },
  "profile.leaderboard": { en: "Leaderboard", hi: "लीडरबोर्ड" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved === "hi" ? "hi" : "en") as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
