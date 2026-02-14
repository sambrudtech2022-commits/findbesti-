import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, CheckCircle2, XCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SecretStatus {
  name: string;
  category: string;
  description: string;
  configured: boolean;
}

const AdminSecretsPage = () => {
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("check-secrets", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      setSecrets(res.data.secrets || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load secrets status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const configured = secrets.filter((s) => s.configured);
  const missing = secrets.filter((s) => !s.configured);

  // Group by category
  const categories = secrets.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, SecretStatus[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Secrets Status</h2>
            <p className="text-xs text-muted-foreground">
              Configured: {configured.length}/{secrets.length} — ye read-only view hai
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSecrets} className="gap-1.5 rounded-xl">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-green-600">{configured.length}</p>
          <p className="text-xs text-muted-foreground font-semibold">Configured</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${missing.length > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted/40 border-border"}`}>
          <XCircle className={`w-6 h-6 mx-auto mb-1 ${missing.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          <p className={`text-2xl font-extrabold ${missing.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{missing.length}</p>
          <p className="text-xs text-muted-foreground font-semibold">Missing</p>
        </div>
      </div>

      {/* Warning */}
      {missing.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Missing secrets detected!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Missing secrets wale features kaam nahi karenge. Lovable Cloud → Secrets section se configure karo.
            </p>
          </div>
        </div>
      )}

      {/* Secrets by Category */}
      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-foreground">{category}</h3>
          <div className="space-y-2">
            {items.map((secret) => (
              <div
                key={secret.name}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  secret.configured ? "bg-green-500/5" : "bg-destructive/5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground font-mono">{secret.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{secret.description}</p>
                </div>
                <div className="shrink-0 ml-3">
                  {secret.configured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={12} /> Set
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-lg">
                      <XCircle size={12} /> Missing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="bg-muted/40 rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">
          🔒 Ye page sirf status dikhata hai — secret values kisi ko visible nahi hain.
          <br />Secrets manage karne ke liye Lovable Cloud → Secrets section use karo.
        </p>
      </div>
    </div>
  );
};

export default AdminSecretsPage;
