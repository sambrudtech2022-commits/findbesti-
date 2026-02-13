import { Search, ShoppingBag, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import avatar1 from "@/assets/avatar1.jpg";

const AdminPurchasesPage = () => {
  const [search, setSearch] = useState("");

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, phone")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return data.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id),
      }));
    },
  });

  const totalRevenue = purchases?.reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0) ?? 0;

  const filtered = purchases?.filter((p) =>
    (p.profile?.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.plan_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.payment_id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Purchases</p>
          <p className="text-2xl font-extrabold text-foreground">{purchases?.length ?? 0}</p>
        </div>
        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-extrabold text-foreground flex items-center gap-1">
            <IndianRupee size={18} />
            {totalRevenue}
          </p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, plan or payment ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No purchases found</p>
          </div>
        ) : (
          filtered?.map((purchase) => (
            <div key={purchase.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
              <img
                src={purchase.profile?.avatar_url || avatar1}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {purchase.profile?.display_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {purchase.plan_name} · ₹{purchase.amount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(purchase.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <Badge variant={statusColor(purchase.status) as any} className="text-[10px] capitalize">
                {purchase.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPurchasesPage;
