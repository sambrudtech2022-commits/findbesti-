import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO } from "date-fns";

const WithdrawalStatsChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["admin-withdrawal-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("created_at, amount, status")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const days: Record<string, { approved: number; pending: number; rejected: number }> = {};
      for (let i = 29; i >= 0; i--) {
        days[format(subDays(new Date(), i), "MMM dd")] = { approved: 0, pending: 0, rejected: 0 };
      }
      data?.forEach((w) => {
        const key = format(parseISO(w.created_at), "MMM dd");
        if (key in days) {
          if (w.status === "completed" || w.status === "approved") days[key].approved += w.amount;
          else if (w.status === "rejected") days[key].rejected += w.amount;
          else days[key].pending += w.amount;
        }
      });
      return Object.entries(days).map(([date, v]) => ({ date, ...v }));
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Withdrawal Stats (Last 30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [`₹${value}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Legend formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
            <Bar dataKey="approved" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} maxBarSize={20} />
            <Bar dataKey="pending" stackId="a" fill="hsl(var(--accent))" maxBarSize={20} />
            <Bar dataKey="rejected" stackId="a" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WithdrawalStatsChart;
