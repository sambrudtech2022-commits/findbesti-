import { useState, useEffect, useRef } from "react";
import { Search, Sparkles, Flame, MapPin, Clock, TrendingUp, Wallet, Plus, X } from "lucide-react";
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

const allCountries = [
  { name: "All", flag: "🌍" },
  { name: "India", flag: "🇮🇳" },
  { name: "USA", flag: "🇺🇸" },
  { name: "UK", flag: "🇬🇧" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "France", flag: "🇫🇷" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Russia", flag: "🇷🇺" },
  { name: "China", flag: "🇨🇳" },
  { name: "Pakistan", flag: "🇵🇰" },
  { name: "Bangladesh", flag: "🇧🇩" },
  { name: "Nepal", flag: "🇳🇵" },
  { name: "Sri Lanka", flag: "🇱🇰" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Philippines", flag: "🇵🇭" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "UAE", flag: "🇦🇪" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Egypt", flag: "🇪🇬" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Ukraine", flag: "🇺🇦" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "New Zealand", flag: "🇳🇿" },
];


const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [countrySearch, setCountrySearch] = useState("");
  const [coins, setCoins] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch coin balance
    supabase.from("profiles").select("coins").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins ?? 0); });

    // Fetch total earnings (gifts received + tasks completed)
    const fetchEarnings = async () => {
      const [giftsRes, tasksRes, referralsRes] = await Promise.all([
        supabase.from("gift_transactions").select("coins_spent").eq("receiver_id", user.id),
        supabase.from("task_completions").select("coins_earned").eq("user_id", user.id),
        supabase.from("referrals").select("coins_awarded").eq("referrer_id", user.id),
      ]);
      const giftEarnings = (giftsRes.data ?? []).reduce((s, g) => s + (g.coins_spent ?? 0), 0);
      const taskEarnings = (tasksRes.data ?? []).reduce((s, t) => s + (t.coins_earned ?? 0), 0);
      const referralEarnings = (referralsRes.data ?? []).reduce((s, r) => s + (r.coins_awarded ?? 0), 0);
      setEarnings(giftEarnings + taskEarnings + referralEarnings);
    };
    fetchEarnings();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    };
    if (showCountryPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountryPicker]);

  const filteredCountries = countrySearch
    ? allCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : allCountries;

  const selectedFlag = allCountries.find(c => c.name === selectedCountry)?.flag || "🌍";

  const filteredUsers = selectedCountry !== "All"
    ? mockUsers.filter((u) => {
        const countryData = allCountries.find(c => c.name === selectedCountry);
        return countryData ? u.country === countryData.flag : true;
      })
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
              <div className="flex items-center bg-card rounded-full px-3 py-1.5 gap-2 border border-border">
                <div
                  onClick={() => navigate("/earn-coins")}
                  className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all active:scale-95"
                >
                  <Wallet size={18} className="text-accent" />
                  <span className="text-sm font-bold text-foreground">₹{earnings}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div
                  onClick={() => navigate("/coin-pack")}
                  className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all active:scale-95"
                >
                  <span className="text-base">🪙</span>
                  <span className="text-sm font-bold text-foreground">{coins}</span>
                </div>
                <div
                  onClick={() => navigate("/coin-pack")}
                  className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center cursor-pointer hover:bg-muted-foreground/30"
                >
                  <Plus size={12} className="text-muted-foreground" />
                </div>
              </div>
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:scale-110 transition-transform duration-200 text-lg"
                >
                  {selectedFlag}
                </button>

                {/* Country Dropdown */}
                {showCountryPicker && (
                  <div className="absolute right-0 top-12 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-muted rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.name}
                          onClick={() => {
                            setSelectedCountry(country.name);
                            setShowCountryPicker(false);
                            setCountrySearch("");
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                            selectedCountry === country.name ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                          }`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span>{country.name}</span>
                          {selectedCountry === country.name && (
                            <span className="ml-auto text-primary">✓</span>
                          )}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">No country found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Selected Country Indicator */}
      {selectedCountry !== "All" && (
        <div className="px-4 mb-3 animate-slide-up">
          <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
            <span className="text-lg">{selectedFlag}</span>
            <span className="text-sm font-medium text-primary">{selectedCountry}</span>
            <button onClick={() => setSelectedCountry("All")} className="ml-auto">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* User Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3.5">
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