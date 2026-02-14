import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<{
    text: string;
    type: string;
    active: boolean;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("announcement_text, announcement_type, announcement_active")
        .limit(1)
        .single();
      if (data && data.announcement_active && data.announcement_text) {
        setAnnouncement({
          text: data.announcement_text,
          type: data.announcement_type || "info",
          active: data.announcement_active,
        });
      }
    };
    fetch();
  }, []);

  if (!announcement || !announcement.active || dismissed) return null;

  const Icon =
    announcement.type === "warning"
      ? AlertTriangle
      : announcement.type === "success"
      ? CheckCircle
      : Info;

  return (
    <div
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-2 text-sm font-semibold",
        announcement.type === "warning" && "bg-amber-500/15 text-amber-700",
        announcement.type === "success" && "bg-green-500/15 text-green-700",
        announcement.type === "info" && "bg-primary/10 text-primary"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <p className="flex-1 text-xs">{announcement.text}</p>
      <button onClick={() => setDismissed(true)} className="shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
