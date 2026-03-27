import { Users, CreditCard, AlertTriangle, TrendingUp, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import GenderDistributionChart from "@/components/admin/charts/GenderDistributionChart";
import GiftAnalyticsChart from "@/components/admin/charts/GiftAnalyticsChart";
import ActiveUsersTrendChart from "@/components/admin/charts/ActiveUsersTrendChart";
import WithdrawalStatsChart from "@/components/admin/charts/WithdrawalStatsChart";
import TopGiftersTable from "@/components/admin/charts/TopGiftersTable";
import TopReceiversTable from "@/components/admin/charts/TopReceiversTable";

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

  const { data: signupData } = useQuery({
    queryKey: ["admin-signups-chart"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ["admin-revenue-chart"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("purchases")
        .select("created_at, amount")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const signupChartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "MMM dd");
      days[key] = 0;
    }
    signupData?.forEach((p) => {
      const key = format(parseISO(p.created_at), "MMM dd");
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, signups: count }));
  }, [signupData]);

  const revenueChartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "MMM dd");
      days[key] = 0;
    }
    revenueData?.forEach((p) => {
      const key = format(parseISO(p.created_at), "MMM dd");
      if (key in days) days[key] += p.amount;
    });
    return Object.entries(days).map(([date, revenue]) => ({ date, revenue }));
  }, [revenueData]);

  const cards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-primary", path: "/x-panel/users" },
    { icon: CreditCard, label: "Pending Withdrawals", value: stats?.pendingWithdrawals ?? 0, color: "text-accent", path: "/x-panel/withdrawals" },
    { icon: AlertTriangle, label: "Pending Reports", value: stats?.pendingReports ?? 0, color: "text-destructive", path: "/x-panel/reports" },
    { icon: ShoppingBag, label: "Total Purchases", value: stats?.totalPurchases ?? 0, color: "text-primary", path: "/x-panel/purchases" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Signups Chart */}
        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Daily Signups (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChartData}>
                <defs>
                  <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  tickCount={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#signupGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Revenue (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  tickCount={6}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`₹${value}`, "Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveUsersTrendChart />
        <GenderDistributionChart />
        <GiftAnalyticsChart />
        <WithdrawalStatsChart />
        <TopGiftersTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
