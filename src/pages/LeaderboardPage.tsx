import { useState } from "react";
import { ArrowLeft, Trophy, Users, Coins, Crown, Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import avatar1 from "@/assets/avatar1.jpg";

type Tab = "earners" | "referrers" | "popular";
type TimeFilter = "all" | "weekly";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  rank: number;
}

const tabs: { key: Tab; label: string; icon: typeof Coins; unit: string }[] = [
  { key: "earners", label: "Top Earners", icon: Coins, unit: "coins" },
  { key: "referrers", label: "Top Referrers", icon: Users, unit: "referrals" },
  { key: "popular", label: "Most Popular", icon: Crown, unit: "followers" },
];

const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const rankBgs = ["bg-yellow-500/15", "bg-gray-400/15", "bg-amber-700/15"];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("earners");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const rpcName = `get_leaderboard_${activeTab}` as
    | "get_leaderboard_earners"
    | "get_leaderboard_referrers"
    | "get_leaderboard_popular";

  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard", activeTab, timeFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(rpcName, {
        _time_filter: timeFilter === "weekly" ? "weekly" : "all",
      });
      if (error) throw error;
      return (data as LeaderboardEntry[]) || [];
    },
  });

  const currentTab = tabs.find((t) => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-6 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={22} className="text-primary-foreground" />
            <h1 className="text-xl font-extrabold text-primary-foreground">Leaderboard</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-primary-foreground text-primary shadow-md"
                  : "bg-primary-foreground/15 text-primary-foreground/80"
              }`}
            >
              <tab.icon size={14} />
              {tab.label.split(" ")[1]}
            </button>
          ))}
        </div>

        {/* Time Filter */}
        <div className="flex gap-2 mt-3">
          {(["all", "weekly"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                timeFilter === filter
                  ? "bg-primary-foreground/30 text-primary-foreground"
                  : "bg-primary-foreground/10 text-primary-foreground/60"
              }`}
            >
              {filter === "all" ? "All Time" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {!isLoading && entries && entries.length >= 3 && (
        <div className="px-4 -mt-1 flex items-end justify-center gap-3 py-4">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            if (!entry) return null;
            const isFirst = idx === 0;
            return (
              <div key={entry.user_id} className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                <div className={`relative ${isFirst ? "mb-1" : ""}`}>
                  {isFirst && (
                    <Crown size={20} className="text-yellow-500 absolute -top-5 left-1/2 -translate-x-1/2" />
                  )}
                  <img
                    src={entry.avatar_url || avatar1}
                    alt={entry.display_name}
                    className={`rounded-full object-cover border-2 ${isFirst ? "w-16 h-16 border-yellow-500" : "w-12 h-12 border-muted-foreground/30"}`}
                  />
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${rankBgs[entry.rank - 1]} ${rankColors[entry.rank - 1]}`}>
                    {entry.rank}
                  </div>
                </div>
                <p className={`mt-3 font-bold text-foreground truncate max-w-[80px] ${isFirst ? "text-sm" : "text-xs"}`}>
                  {entry.display_name}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold">
                  {entry.score} {currentTab.unit}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="px-4 mt-4 space-y-1.5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))
        ) : entries && entries.length > 0 ? (
          entries.slice(3).map((entry) => {
            const isMe = entry.user_id === user?.id;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 py-3 px-3 rounded-xl transition-colors ${
                  isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                }`}
              >
                <span className="w-7 text-center text-sm font-extrabold text-muted-foreground">
                  {entry.rank}
                </span>
                <img
                  src={entry.avatar_url || avatar1}
                  alt={entry.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {entry.display_name} {isMe && <span className="text-primary text-xs">(You)</span>}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-primary">
                  {entry.score} <span className="text-[10px] text-muted-foreground font-bold">{currentTab.unit}</span>
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Medal size={40} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No data yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
