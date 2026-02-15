import { useState, useEffect } from "react";
import { Search, Sparkles, Flame, MapPin, Clock, TrendingUp, Wallet, Heart, Plus } from "lucide-react";
import UserCard from "@/components/UserCard";
import { mockUsers } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
{ label: "Hot 🔥", icon: Flame },
{ label: "Nearby", icon: MapPin },
{ label: "New", icon: Clock },
{ label: "Popular", icon: TrendingUp }];


const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coins, setCoins] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins ?? 0); });
  }, [user]);

  const filteredUsers = searchQuery
    ? mockUsers.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.country.toLowerCase().includes(searchQuery.toLowerCase()))
    : mockUsers;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3 animate-slide-up">
            <h1 className="text-2xl font-extrabold">
              <span className="text-gradient">FIND BESTI 💫</span>
            </h1>
            <div className="flex items-center gap-2">
              {/* Wallet & Coins Bar */}
              <div
                onClick={() => navigate("/coin-pack")}
                className="flex items-center bg-muted rounded-full px-3 py-1.5 gap-2 cursor-pointer hover:bg-muted/80 transition-all active:scale-95"
              >
                <div className="flex items-center gap-1">
                  <Wallet size={16} className="text-accent" />
                  <span className="text-sm font-bold text-foreground">₹{coins}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1">
                  <Heart size={16} className="text-accent fill-accent" />
                  <span className="text-sm font-bold text-foreground">0</span>
                </div>
                <div
                  onClick={() => navigate("/coin-pack")}
                  className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center cursor-pointer hover:bg-muted-foreground/30"
                >
                  <Plus size={12} className="text-muted-foreground" />
                </div>
              </div>
              <button
                onClick={() => {
                  const searchInput = document.getElementById("home-search");
                  if (searchInput) searchInput.focus();
                  setShowSearch(!showSearch);
                }}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:scale-110 transition-transform duration-200"
              >
                <Search size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab, i) =>
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 animate-stagger-in ${
              activeTab === i ?
              "gradient-primary text-primary-foreground shadow-md scale-105" :
              "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105"}`
              }
              style={{ animationDelay: `${i * 80}ms` }}>

                {tab.label}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Match Banner */}
      <div className="px-4 mt-4 mb-4">
        <div
          className="gradient-warm rounded-2xl p-4 flex items-center gap-3 shadow-lg animate-slide-up cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          style={{ animationDelay: "200ms" }}
          onClick={() => {
            const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            navigate(`/video-call/${randomUser.id}`);
          }}>

          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Sparkles size={24} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-primary-foreground font-bold text-sm">Start Video Chat</h3>
            <p className="text-primary-foreground/80 text-xs">Match with someone new instantly!</p>
          </div>
          <button className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-foreground/30 transition-all duration-200 hover:scale-105 active:scale-95">
            Go Live
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 mb-3 animate-slide-up">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="home-search"
              autoFocus
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* User Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredUsers.map((user, index) =>
          <div
            key={user.id}
            className="animate-stagger-in"
            style={{ animationDelay: `${300 + index * 100}ms` }}>

              <UserCard user={user} />
            </div>
          )}
        </div>
      </div>
    </div>);

};

export default HomePage;