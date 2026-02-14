import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Wrench, Megaphone, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

interface AppSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  min_app_version: string;
  announcement_text: string | null;
  announcement_active: boolean;
  announcement_type: string;
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();
    if (!error && data) setSettings(data as unknown as AppSettings);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("app_settings")
        .update({
          maintenance_mode: settings.maintenance_mode,
          maintenance_message: settings.maintenance_message,
          min_app_version: settings.min_app_version,
          announcement_text: settings.announcement_text,
          announcement_active: settings.announcement_active,
          announcement_type: settings.announcement_type,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Settings save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12 text-muted-foreground">Settings not found</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Maintenance Mode */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Maintenance Mode</h2>
            <p className="text-xs text-muted-foreground">App ko temporarily band karo sabhi users ke liye</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/40 rounded-xl p-4">
          <div>
            <p className="font-bold text-sm text-foreground">Maintenance Mode</p>
            <p className="text-xs text-muted-foreground">
              {settings.maintenance_mode ? "App abhi maintenance mein hai" : "App normal chal rahi hai"}
            </p>
          </div>
          <Switch
            checked={settings.maintenance_mode}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, maintenance_mode: checked })
            }
          />
        </div>

        <Textarea
          placeholder="Maintenance message for users..."
          value={settings.maintenance_message || ""}
          onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
          className="min-h-[80px] rounded-xl resize-none"
        />
      </div>

      {/* Minimum Version */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Minimum Version</h2>
            <p className="text-xs text-muted-foreground">Users ko force update ke liye minimum version set karo</p>
          </div>
        </div>

        <Input
          placeholder="e.g. 1.0.0"
          value={settings.min_app_version || ""}
          onChange={(e) => setSettings({ ...settings, min_app_version: e.target.value })}
          className="h-12 rounded-xl"
        />
      </div>

      {/* Announcement Banner */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Announcement Banner</h2>
            <p className="text-xs text-muted-foreground">App ke top pe announcement dikhao</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/40 rounded-xl p-4">
          <div>
            <p className="font-bold text-sm text-foreground">Show Announcement</p>
            <p className="text-xs text-muted-foreground">
              {settings.announcement_active ? "Banner active hai" : "Banner hidden hai"}
            </p>
          </div>
          <Switch
            checked={settings.announcement_active}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, announcement_active: checked })
            }
          />
        </div>

        <Textarea
          placeholder="Announcement text..."
          value={settings.announcement_text || ""}
          onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
          className="min-h-[80px] rounded-xl resize-none"
        />

        <div className="flex gap-2">
          {["info", "warning", "success"].map((type) => (
            <button
              key={type}
              onClick={() => setSettings({ ...settings, announcement_type: type })}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                settings.announcement_type === type
                  ? type === "info"
                    ? "bg-primary text-primary-foreground"
                    : type === "warning"
                    ? "bg-amber-500 text-white"
                    : "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default AdminSettingsPage;
