import { Users, CreditCard, AlertTriangle, TrendingUp, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, withdrawalsRes, reportsRes, purchasesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("purchases").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: usersRes.count ?? 0,
        pendingWithdrawals: withdrawalsRes.count ?? 0,
        pendingReports: reportsRes.count ?? 0,
        totalPurchases: purchasesRes.count ?? 0,
      };
    },
  });

  const cards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-primary", path: "/admin/users" },
    { icon: CreditCard, label: "Pending Withdrawals", value: stats?.pendingWithdrawals ?? 0, color: "text-accent", path: "/admin/withdrawals" },
    { icon: AlertTriangle, label: "Pending Reports", value: stats?.pendingReports ?? 0, color: "text-destructive", path: "/admin/reports" },
    { icon: ShoppingBag, label: "Total Purchases", value: stats?.totalPurchases ?? 0, color: "text-primary", path: "/admin/purchases" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => navigate(card.path)}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <card.icon size={22} className={card.color} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-extrabold text-foreground">{card.value}</p>
            )}
          </div>
          <TrendingUp size={18} className="text-muted-foreground" />
        </button>
      ))}
    </div>
  );
};

export default AdminDashboard;
