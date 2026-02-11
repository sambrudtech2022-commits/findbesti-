import { Settings, Edit3, Crown, Heart, Star, Gift, ChevronRight, LogOut } from "lucide-react";
import avatar1 from "@/assets/avatar1.jpg";

const menuItems = [
  { icon: Crown, label: "Premium", desc: "Unlock all features", color: "text-accent" },
  { icon: Heart, label: "My Favorites", desc: "12 people", color: "text-primary" },
  { icon: Star, label: "Who Liked Me", desc: "5 new", color: "text-accent" },
  { icon: Gift, label: "Earn Coins", desc: "Watch & earn", color: "text-online" },
  { icon: Settings, label: "Settings", desc: "Privacy, notifications", color: "text-muted-foreground" },
];

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="gradient-primary pt-12 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={avatar1} alt="My Profile" className="w-20 h-20 rounded-full object-cover border-3 border-primary-foreground/30" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card flex items-center justify-center shadow-md">
              <Edit3 size={12} className="text-primary" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary-foreground">Rahul Kumar</h1>
            <p className="text-primary-foreground/70 text-sm">@rahul_k · 24 yrs</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                <Star size={10} className="text-accent" fill="currentColor" />
                <span className="text-[10px] font-bold text-primary-foreground">4.8</span>
              </div>
              <span className="text-[10px] text-primary-foreground/60">128 followers</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-6 bg-primary-foreground/10 rounded-2xl py-3">
          {[
            { label: "Following", value: "245" },
            { label: "Followers", value: "128" },
            { label: "Coins", value: "1.2K" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-extrabold text-primary-foreground">{stat.value}</p>
              <p className="text-[10px] text-primary-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
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

        <button className="w-full flex items-center gap-3 py-3.5 px-3 rounded-xl hover:bg-destructive/10 transition-colors mt-4">
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
