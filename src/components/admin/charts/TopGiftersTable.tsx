import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

const TopGiftersTable = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-top-gifters"],
    queryFn: async () => {
      const { data: gifts, error } = await supabase
        .from("gift_transactions")
        .select("sender_id, coins_spent");
      if (error) throw error;

      const totals: Record<string, number> = {};
      gifts?.forEach((g) => {
        totals[g.sender_id] = (totals[g.sender_id] || 0) + g.coins_spent;
      });

      const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (!sorted.length) return [];

      const userIds = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return sorted.map(([id, coins], i) => ({
        rank: i + 1,
        userId: id,
        name: profileMap.get(id)?.display_name || "User",
        avatar: profileMap.get(id)?.avatar_url,
        totalCoins: coins,
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-accent" />
        <h3 className="text-sm font-bold text-foreground">Top 10 Gifters</h3>
      </div>

      {!data?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">No gift data yet</p>
      ) : (
        <div className="space-y-2">
          {data.map((g) => (
            <div
              key={g.userId}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  g.rank === 1
                    ? "bg-accent text-accent-foreground"
                    : g.rank === 2
                    ? "bg-muted text-foreground"
                    : g.rank === 3
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {g.rank}
              </span>

              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                {g.avatar ? (
                  <img src={g.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {g.name.charAt(0)}
                  </div>
                )}
              </div>

              <span className="flex-1 text-sm font-semibold text-foreground truncate">
                {g.name}
              </span>

              <span className="text-sm font-bold text-accent">🪙 {g.totalCoins.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopGiftersTable;
