import { ArrowLeft, Bell, Shield, Eye, Moon, Globe, HelpCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"} relative`}
    >
      <div className={`w-5 h-5 rounded-full bg-primary-foreground shadow-md absolute top-0.5 transition-transform ${value ? "translate-x-5.5" : "translate-x-0.5"}`} />
    </button>
  );

  const sections = [
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", toggle: true, value: notifications, onChange: setNotifications },
        { icon: Moon, label: "Dark Mode", toggle: true, value: darkMode, onChange: setDarkMode },
        { icon: Eye, label: "Profile Visible", toggle: true, value: profileVisible, onChange: setProfileVisible },
      ],
    },
    {
      title: "General",
      items: [
        { icon: Globe, label: "Language", desc: "English" },
        { icon: Shield, label: "Privacy Policy" },
        { icon: HelpCircle, label: "Help & Support" },
        { icon: Info, label: "About", desc: "v1.0.0" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</h2>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-3.5 px-4">
                  <item.icon size={18} className="text-muted-foreground" />
                  <span className="flex-1 font-medium text-sm text-foreground">{item.label}</span>
                  {"toggle" in item && item.toggle ? (
                    <Toggle value={item.value!} onChange={item.onChange!} />
                  ) : (
                    "desc" in item && <span className="text-xs text-muted-foreground">{item.desc}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
