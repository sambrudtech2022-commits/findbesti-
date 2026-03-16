import { ArrowLeft, Bell, Shield, Eye, Moon, Globe, HelpCircle, Info, Receipt, Crown, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [profileVisible, setProfileVisible] = useState(true);

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["my-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const activeSub = subscriptions?.find(s => s.status === "active" && new Date(s.ends_at) > new Date());

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatAmount = (amount: number) => `₹${amount}`;

  const isPremiumPurchase = (planName: string) =>
    ["weekly", "monthly", "yearly"].some(k => planName.toLowerCase().includes(k));

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
        {/* Active Subscription Banner */}
        {activeSub && (
          <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl border border-accent/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Crown size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-foreground">Premium Active</h3>
                <p className="text-[10px] text-muted-foreground">
                  {activeSub.plan_name} • Expires {formatDate(activeSub.ends_at)}
                </p>
              </div>
            </div>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{section.title}</h2>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if ("toggle" in item && item.toggle && item.onChange) {
                      item.onChange(!item.value!);
                    } else if (item.label === "Privacy Policy") {
                      toast("Privacy Policy page coming soon!");
                    } else if (item.label === "Help & Support") {
                      toast("Help & Support page coming soon!");
                    } else if (item.label === "Language") {
                      toast("Language selection coming soon!");
                    }
                  }}
                  className="w-full flex items-center gap-3 py-3.5 px-4 hover:bg-muted/30 transition-colors"
                >
                  <item.icon size={18} className="text-muted-foreground" />
                  <span className="flex-1 font-medium text-sm text-foreground text-left">{item.label}</span>
                  {"toggle" in item && item.toggle ? (
                    <Toggle value={item.value!} onChange={item.onChange!} />
                  ) : (
                    "desc" in item && <span className="text-xs text-muted-foreground">{item.desc}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Purchase History */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Receipt size={12} /> Purchase History
          </h2>
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {purchasesLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
            ) : !purchases?.length ? (
              <div className="py-8 text-center">
                <Coins size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No purchases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {purchases.map((p) => {
                  const isPremium = isPremiumPurchase(p.plan_name);
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3 px-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPremium ? "bg-accent/15" : "bg-primary/15"}`}>
                        {isPremium ? <Crown size={16} className="text-accent" /> : <Coins size={16} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.plan_name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatAmount(p.amount)}</p>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          p.status === "completed" ? "bg-online/15 text-online" : "bg-muted text-muted-foreground"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;