import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Wrench, Megaphone, Smartphone, Save, Phone, Video, Crown, Plus, Trash2, Shield, FileText } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  name: string;
  price: string;
  amount: number;
  period: string;
  popular: boolean;
  features: string[];
}

interface AppSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  min_app_version: string;
  announcement_text: string | null;
  announcement_active: boolean;
  announcement_type: string;
  video_call_rate: number;
  audio_call_rate: number;
  subscription_plans: SubscriptionPlan[];
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
    if (!error && data) {
      setSettings({
        ...data,
        subscription_plans: (data.subscription_plans as unknown as SubscriptionPlan[]) || [],
      } as AppSettings);
    }
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
          video_call_rate: settings.video_call_rate,
          audio_call_rate: settings.audio_call_rate,
          subscription_plans: settings.subscription_plans as unknown as any,
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

  const updatePlan = (index: number, field: keyof SubscriptionPlan, value: any) => {
    if (!settings) return;
    const plans = [...settings.subscription_plans];
    plans[index] = { ...plans[index], [field]: value };
    setSettings({ ...settings, subscription_plans: plans });
  };

  const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    if (!settings) return;
    const plans = [...settings.subscription_plans];
    const features = [...plans[planIndex].features];
    features[featureIndex] = value;
    plans[planIndex] = { ...plans[planIndex], features };
    setSettings({ ...settings, subscription_plans: plans });
  };

  const addFeature = (planIndex: number) => {
    if (!settings) return;
    const plans = [...settings.subscription_plans];
    plans[planIndex] = { ...plans[planIndex], features: [...plans[planIndex].features, ""] };
    setSettings({ ...settings, subscription_plans: plans });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    if (!settings) return;
    const plans = [...settings.subscription_plans];
    const features = plans[planIndex].features.filter((_, i) => i !== featureIndex);
    plans[planIndex] = { ...plans[planIndex], features };
    setSettings({ ...settings, subscription_plans: plans });
  };

  const addPlan = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      subscription_plans: [
        ...settings.subscription_plans,
        { name: "New Plan", price: "₹0", amount: 0, period: "/month", popular: false, features: ["Feature 1"] },
      ],
    });
  };

  const removePlan = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      subscription_plans: settings.subscription_plans.filter((_, i) => i !== index),
    });
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
      {/* Call Rates */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Call Rates</h2>
            <p className="text-xs text-muted-foreground">Video aur Audio call ki per-minute rate set karo (₹/min)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Video size={14} className="text-primary" /> Video Call Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                value={settings.video_call_rate}
                onChange={(e) => setSettings({ ...settings, video_call_rate: parseInt(e.target.value) || 0 })}
                className="h-12 rounded-xl pl-7"
                min={0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/min</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Phone size={14} className="text-green-500" /> Audio Call Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                value={settings.audio_call_rate}
                onChange={(e) => setSettings({ ...settings, audio_call_rate: parseInt(e.target.value) || 0 })}
                className="h-12 rounded-xl pl-7"
                min={0}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Subscription Plans</h2>
              <p className="text-xs text-muted-foreground">Premium plans ki price aur features edit karo</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addPlan} className="gap-1 rounded-xl">
            <Plus size={14} /> Add Plan
          </Button>
        </div>

        {settings.subscription_plans.map((plan, planIndex) => (
          <div key={planIndex} className="bg-muted/40 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  value={plan.name}
                  onChange={(e) => updatePlan(planIndex, "name", e.target.value)}
                  className="h-9 rounded-lg w-32 font-bold"
                  placeholder="Plan name"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Switch
                    checked={plan.popular}
                    onCheckedChange={(v) => updatePlan(planIndex, "popular", v)}
                  />
                  Popular
                </label>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removePlan(planIndex)} className="text-destructive hover:text-destructive h-8 w-8">
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Price Display</label>
                <Input value={plan.price} onChange={(e) => updatePlan(planIndex, "price", e.target.value)} className="h-9 rounded-lg text-sm" placeholder="₹99" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Amount (₹)</label>
                <Input type="number" value={plan.amount} onChange={(e) => updatePlan(planIndex, "amount", parseInt(e.target.value) || 0)} className="h-9 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Period</label>
                <Input value={plan.period} onChange={(e) => updatePlan(planIndex, "period", e.target.value)} className="h-9 rounded-lg text-sm" placeholder="/month" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Features</label>
              {plan.features.map((feature, fIndex) => (
                <div key={fIndex} className="flex gap-1.5">
                  <Input
                    value={feature}
                    onChange={(e) => updatePlanFeature(planIndex, fIndex, e.target.value)}
                    className="h-8 rounded-lg text-xs flex-1"
                    placeholder="Feature..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFeature(planIndex, fIndex)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addFeature(planIndex)} className="text-xs gap-1 h-7 text-primary">
                <Plus size={12} /> Add Feature
              </Button>
            </div>
          </div>
        ))}
      </div>

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

      {/* Legal Pages */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Legal Pages</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-xl gap-2 font-medium"
            onClick={() => window.open("/privacy-policy", "_blank")}
          >
            <FileText className="w-4 h-4" />
            Privacy Policy
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-xl gap-2 font-medium"
            onClick={() => window.open("/terms", "_blank")}
          >
            <FileText className="w-4 h-4" />
            Terms & Conditions
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">These pages are live and accessible to users from the Auth page and Settings.</p>
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
