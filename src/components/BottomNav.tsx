import { Home, MessageCircle, Video, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
{ icon: Home, label: "Home", path: "/" },
{ icon: MessageCircle, label: "Chat", path: "/chat" },
{ icon: Video, label: "Call", path: "/call" },
{ icon: User, label: "Profile", path: "/profile" }];


const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on video call screen
  if (location.pathname.startsWith("/video-call")) return null;

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
    </nav>);

};

export default BottomNav;