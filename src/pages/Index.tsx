import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import UserCard from "@/components/UserCard";
import { mockUsers } from "@/data/mockData";

const tabs = ["Hot 🔥", "Nearby", "New", "Popular"];

const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-extrabold">
              <span className="text-gradient">JoyMet</span>
            </h1>
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Search size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === i
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Match Banner */}
      <div className="px-4 mt-4 mb-4">
        <div className="gradient-warm rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Sparkles size={24} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-primary-foreground font-bold text-sm">Start Video Chat</h3>
            <p className="text-primary-foreground/80 text-xs">Match with someone new instantly!</p>
          </div>
          <button className="bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-foreground/30 transition-colors">
            Go Live
          </button>
        </div>
      </div>

      {/* User Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {mockUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
