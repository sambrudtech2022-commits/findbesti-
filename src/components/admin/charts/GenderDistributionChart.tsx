import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(340, 82%, 52%)",
  "hsl(220, 70%, 55%)",
  "hsl(280, 60%, 50%)",
  "hsl(24, 95%, 53%)",
];

const GenderDistributionChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-gender-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("gender");
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        const g = p.gender?.toLowerCase() || "not set";
        counts[g] = (counts[g] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Gender Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {data?.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GenderDistributionChart;
