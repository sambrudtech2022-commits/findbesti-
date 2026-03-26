import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO } from "date-fns";

const GiftAnalyticsChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["admin-gift-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("created_at, coins_spent")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const days: Record<string, { coins: number; count: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const key = format(subDays(new Date(), i), "MMM dd");
        days[key] = { coins: 0, count: 0 };
      }
      data?.forEach((g) => {
        const key = format(parseISO(g.created_at), "MMM dd");
        if (key in days) {
          days[key].coins += g.coins_spent;
          days[key].count += 1;
        }
      });
      return Object.entries(days).map(([date, v]) => ({ date, coins: v.coins, gifts: v.count }));
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Gift Coins Flow (Last 30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [value, name === "coins" ? "Coins Spent" : "Gifts Sent"]}
            />
            <Bar dataKey="coins" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GiftAnalyticsChart;
