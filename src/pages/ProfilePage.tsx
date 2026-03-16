import { Settings, Edit3, Crown, Heart, Star, Gift, ChevronRight, LogOut, Shield, Users, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import avatar1 from "@/assets/avatar1.jpg";

const menuItems = [
  { icon: Crown, label: "Premium", desc: "Unlock all features", color: "text-accent", path: "/premium" },
  { icon: Heart, label: "My Favorites", desc: "12 people", color: "text-primary", path: "/favorites" },
  { icon: Star, label: "Who Liked Me", desc: "5 new", color: "text-accent", path: "/who-liked-me" },
  { icon: Gift, label: "Earn Coins", desc: "Watch & earn", color: "text-online", path: "/earn-coins" },
  { icon: Users, label: "Refer & Earn", desc: "Invite friends, get coins", color: "text-primary", path: "/referral" },
  { icon: Trophy, label: "Leaderboard", desc: "Top earners & referrers", color: "text-accent", path: "/leaderboard" },
  { icon: Settings, label: "Settings", desc: "Privacy, notifications", color: "text-muted-foreground", path: "/settings" },
];

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || avatar1;
  const coins = profile?.coins ?? 0;
  const followers = profile?.followers ?? 0;
  const following = profile?.following ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="gradient-primary pt-12 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            {isLoading ? (
              <Skeleton className="w-20 h-20 rounded-full" />
            ) : (
              <img src={avatarUrl} alt="My Profile" className="w-20 h-20 rounded-full object-cover border-3 border-primary-foreground/30" />
            )}
            <button
              onClick={() => navigate("/profile/edit")}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card flex items-center justify-center shadow-md"
            >
              <Edit3 size={12} className="text-primary" />
            </button>
          </div>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <h1 className="text-xl font-extrabold text-primary-foreground">{displayName}</h1>
                <p className="text-primary-foreground/70 text-sm">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-primary-foreground/60 text-xs mt-1">{profile.bio}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-6 bg-primary-foreground/10 rounded-2xl py-3">
          {[
            { label: "Following", value: String(following) },
            { label: "Followers", value: String(followers) },
            { label: "Coins", value: coins >= 1000 ? `${(coins / 1000).toFixed(1)}K` : String(coins) },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-extrabold text-primary-foreground">{stat.value}</p>
              <p className="text-[10px] text-primary-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Panel Shortcut */}
      {isAdmin && (
        <div className="px-4 mt-6">
          <button
            onClick={() => navigate("/x-panel")}
            className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-sm text-primary">Admin Panel</h3>
              <p className="text-[10px] text-muted-foreground">Manage users, reports & more</p>
            </div>
            <ChevronRight size={16} className="text-primary" />
          </button>
        </div>
      )}

      {/* Menu */}
      <div className="px-4 mt-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <item.icon size={18} className={item.color} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-sm text-foreground">{item.label}</h3>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}

        <button
          onClick={async () => {
            await signOut();
            navigate("/auth");
          }}
          className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl hover:bg-destructive/10 transition-colors mt-4"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut size={18} className="text-destructive" />
          </div>
          <span className="font-bold text-sm text-destructive">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
