import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface CoinPack {
  id: string;
  coins: number;
  price: number;
  save_percent: string | null;
  popular: boolean;
  active: boolean;
  sort_order: number;
}

const emptyPack = {
  coins: 0,
  price: 0,
  save_percent: "",
  popular: false,
  active: true,
  sort_order: 0,
};

const AdminCoinPacksPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<CoinPack | null>(null);
  const [form, setForm] = useState(emptyPack);

  const { data: packs, isLoading } = useQuery({
    queryKey: ["admin-coin-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CoinPack[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        coins: values.coins,
        price: values.price,
        save_percent: values.save_percent || null,
        popular: values.popular,
        active: values.active,
        sort_order: values.sort_order,
      };
      if (values.id) {
        const { error } = await supabase.from("coin_packs").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coin_packs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coin-packs"] });
      toast.success(editingPack ? "Pack updated" : "Pack added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coin_packs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coin-packs"] });
      toast.success("Pack deleted");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = () => {
    setEditingPack(null);
    setForm({ ...emptyPack, sort_order: (packs?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (pack: CoinPack) => {
    setEditingPack(pack);
    setForm({
      coins: pack.coins,
      price: pack.price,
      save_percent: pack.save_percent ?? "",
      popular: pack.popular,
      active: pack.active,
      sort_order: pack.sort_order,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPack(null);
    setForm(emptyPack);
  };

  const handleSubmit = () => {
    if (form.coins <= 0 || form.price <= 0) {
      toast.error("Coins aur Price 0 se zyada hona chahiye");
      return;
    }
    saveMutation.mutate(editingPack ? { ...form, id: editingPack.id } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-foreground">Coin Packs</h2>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} /> Add Pack
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead>Save</TableHead>
                  <TableHead>Popular</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs?.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-medium">{pack.sort_order}</TableCell>
                    <TableCell className="font-bold">{pack.coins.toLocaleString()}</TableCell>
                    <TableCell>₹{pack.price.toLocaleString()}</TableCell>
                    <TableCell>{pack.save_percent || "—"}</TableCell>
                    <TableCell>
                      {pack.popular && <Star size={16} className="text-primary fill-primary" />}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pack.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {pack.active ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(pack)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(pack.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {packs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No coin packs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPack ? "Edit Coin Pack" : "Add Coin Pack"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coins</Label>
                <Input type="number" value={form.coins} onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Price (paise mein)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Save %</Label>
                <Input placeholder="e.g. 50%" value={form.save_percent} onChange={(e) => setForm({ ...form, save_percent: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.popular} onCheckedChange={(v) => setForm({ ...form, popular: v })} />
                <Label>Popular</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              {editingPack ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this coin pack?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCoinPacksPage;
