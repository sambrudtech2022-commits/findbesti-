import { ArrowLeft, Gift, Play, Share2, Users, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tasks = [
  { icon: Play, label: "Watch a Video", coins: 10, desc: "Watch a 30s ad", done: false },
  { icon: Share2, label: "Share App", coins: 50, desc: "Share with a friend", done: false },
  { icon: Users, label: "Invite Friends", coins: 100, desc: "Invite 3 friends", done: false },
  { icon: CheckCircle, label: "Daily Login", coins: 5, desc: "Login everyday", done: true },
  { icon: Play, label: "Watch Ad", coins: 10, desc: "Watch another ad", done: false },
];

const EarnCoinsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary pt-12 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Earn Coins</h1>
        </div>
        <div className="flex items-center gap-3">
          <Gift size={32} className="text-accent" />
          <div>
            <p className="text-primary-foreground/70 text-sm">Your Balance</p>
            <p className="text-3xl font-extrabold text-primary-foreground">250 <span className="text-sm font-normal">coins</span></p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-2">
        <h2 className="font-bold text-foreground mb-2">Complete Tasks</h2>
        {tasks.map((task, i) => (
          <button
            key={i}
            className={`w-full flex items-center gap-3 py-3.5 px-3 rounded-xl transition-colors ${
              task.done ? "bg-muted/30 opacity-60" : "bg-card hover:bg-muted/50"
            } border border-border/50`}
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <task.icon size={18} className={task.done ? "text-online" : "text-primary"} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-sm text-foreground">{task.label}</h3>
              <p className="text-[10px] text-muted-foreground">{task.desc}</p>
            </div>
            <div className={`text-sm font-extrabold ${task.done ? "text-online" : "text-accent"}`}>
              {task.done ? "Done" : `+${task.coins}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EarnCoinsPage;
