import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO } from "date-fns";

const ActiveUsersTrendChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["admin-active-users-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Active = users who sent messages or gifts in the period
      const [msgsRes, giftsRes] = await Promise.all([
        supabase.from("messages").select("sender_id, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("gift_transactions").select("sender_id, created_at").gte("created_at", thirtyDaysAgo),
      ]);

      const days: Record<string, Set<string>> = {};
      for (let i = 29; i >= 0; i--) {
        days[format(subDays(new Date(), i), "MMM dd")] = new Set();
      }

      msgsRes.data?.forEach((m) => {
        const key = format(parseISO(m.created_at), "MMM dd");
        if (key in days) days[key].add(m.sender_id);
      });
      giftsRes.data?.forEach((g) => {
        const key = format(parseISO(g.created_at), "MMM dd");
        if (key in days) days[key].add(g.sender_id);
      });

      return Object.entries(days).map(([date, users]) => ({ date, activeUsers: users.size }));
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Active Users (Last 30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="activeUsers" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#activeUsersGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActiveUsersTrendChart;
