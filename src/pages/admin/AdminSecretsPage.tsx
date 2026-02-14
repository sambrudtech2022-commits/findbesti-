import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, CheckCircle2, XCircle, RefreshCw, ShieldAlert, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SecretStatus {
  name: string;
  category: string;
  description: string;
  configured: boolean;
}

const AdminSecretsPage = () => {
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<string>("");
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretCategory, setNewSecretCategory] = useState("");
  const [newSecretDesc, setNewSecretDesc] = useState("");

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

  const handleDeleteClick = (name: string) => {
    setSelectedSecret(name);
    setDeleteDialogOpen(true);
  };

  const handleAddSubmit = () => {
    if (!newSecretName.trim()) {
      toast.error("Secret name required");
      return;
    }
    toast.info(
      `"${newSecretName}" add karne ke liye Lovable Cloud → Secrets section mein jaao aur wahan se add karo.`,
      { duration: 6000 }
    );
    setAddDialogOpen(false);
    setNewSecretName("");
    setNewSecretCategory("");
    setNewSecretDesc("");
  };

  const handleDeleteConfirm = () => {
    toast.info(
      `"${selectedSecret}" delete karne ke liye Lovable Cloud → Secrets section mein jaao aur wahan se remove karo.`,
      { duration: 6000 }
    );
    setDeleteDialogOpen(false);
    setSelectedSecret("");
  };

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
              Configured: {configured.length}/{secrets.length}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5 rounded-xl">
            <Plus size={14} /> Add
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSecrets} className="gap-1.5 rounded-xl">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-primary">{configured.length}</p>
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
              Missing secrets wale features kaam nahi karenge. Lovable Cloud → Secrets se configure karo.
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
                  secret.configured ? "bg-primary/5" : "bg-destructive/5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground font-mono">{secret.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{secret.description}</p>
                </div>
                <div className="shrink-0 ml-3 flex items-center gap-2">
                  {secret.configured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 size={12} /> Set
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-lg">
                      <XCircle size={12} /> Missing
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(secret.name)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Manage Info */}
      <div className="bg-muted/40 rounded-xl p-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          🔒 Ye page sirf status dikhata hai — secret values kisi ko visible nahi hain.
        </p>
        <p className="text-xs text-muted-foreground">
          Secrets add/delete/update karne ke liye <strong>Lovable Cloud → Secrets</strong> section use karo.
        </p>
      </div>

      {/* Add Secret Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} className="text-primary" /> Add New Secret
            </DialogTitle>
            <DialogDescription>
              Naya secret add karne ki details dalo. Actual value Lovable Cloud → Secrets se set hogi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Secret Name *</label>
              <Input
                placeholder="e.g. STRIPE_API_KEY"
                value={newSecretName}
                onChange={(e) => setNewSecretName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                className="h-10 rounded-xl font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Category</label>
              <Input
                placeholder="e.g. Stripe (Payments)"
                value={newSecretCategory}
                onChange={(e) => setNewSecretCategory(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Description</label>
              <Input
                placeholder="e.g. Stripe secret key for payment processing"
                value={newSecretDesc}
                onChange={(e) => setNewSecretDesc(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddSubmit} className="rounded-xl gradient-primary text-primary-foreground gap-1.5">
              <ExternalLink size={14} /> Open Cloud to Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Secret Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={18} /> Delete Secret
            </DialogTitle>
            <DialogDescription>
              <strong className="font-mono text-foreground">{selectedSecret}</strong> ko delete karna hai?
              <br />Actual deletion Lovable Cloud → Secrets section se hogi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-xl gap-1.5">
              <ExternalLink size={14} /> Open Cloud to Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSecretsPage;
