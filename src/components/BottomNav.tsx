import { Home, MessageCircle, Video, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const tabs = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: MessageCircle, label: t("nav.chat"), path: "/chat" },
    { icon: Video, label: t("nav.call"), path: "/call" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];

  if (!user || location.pathname.startsWith("/video-call") || location.pathname.startsWith("/audio-call") || location.pathname === "/auth" || location.pathname.startsWith("/x-panel")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
