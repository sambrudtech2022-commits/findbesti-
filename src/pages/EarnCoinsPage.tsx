import { useState } from "react";
import { ArrowLeft, Gift, Play, Share2, Users, CheckCircle, Wallet, IndianRupee, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tasks = [
  { icon: Play, label: "Watch a Video", coins: 10, desc: "Watch a 30s ad", done: false },
  { icon: Share2, label: "Share App", coins: 50, desc: "Share with a friend", done: false },
  { icon: Users, label: "Invite Friends", coins: 100, desc: "Invite 3 friends", done: false },
  { icon: CheckCircle, label: "Daily Login", coins: 5, desc: "Login everyday", done: true },
  { icon: Play, label: "Watch Ad", coins: 10, desc: "Watch another ad", done: false },
];

const EarnCoinsPage = () => {
  const navigate = useNavigate();
  const [upiId, setUpiId] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const coins = 250;
  const rupees = coins; // 1 coin = 1 rupee

  const handleWithdraw = () => {
    if (!upiId || !upiId.includes("@")) {
      toast.error("सही UPI ID डालें (e.g. name@upi)");
      return;
    }
    if (coins < 100) {
      toast.error("Minimum 100 coins चाहिए withdrawal के लिए");
      return;
    }
    toast.success(`₹${rupees} withdrawal request भेजा गया! UPI: ${upiId}`);
    setShowWithdraw(false);
    setUpiId("");
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="gradient-primary pt-10 pb-6 px-4 rounded-b-3xl shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Earn Coins</h1>
        </div>

        {/* Balance Card */}
        <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Gift size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs font-medium">Your Balance</p>
                <p className="text-2xl font-extrabold text-primary-foreground">{coins} <span className="text-xs font-normal">coins</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/60 text-xs font-medium">Value</p>
              <div className="flex items-center gap-0.5">
                <IndianRupee size={16} className="text-accent" />
                <span className="text-xl font-extrabold text-accent">{rupees}</span>
              </div>
            </div>
          </div>

          {/* 1 coin = 1 rupee badge */}
          <div className="mt-3 flex items-center justify-center gap-1.5 bg-primary-foreground/10 rounded-full py-1.5 px-3">
            <span className="text-[10px] font-bold text-primary-foreground/80">1 Coin = ₹1</span>
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={() => setShowWithdraw(!showWithdraw)}
          className="w-full mt-3 h-11 rounded-xl bg-accent text-accent-foreground font-bold text-sm gap-2 hover:bg-accent/90"
        >
          <Wallet size={16} />
          Withdraw to UPI
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {/* Withdraw Section */}
        {showWithdraw && (
          <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">UPI Withdrawal</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: <span className="font-bold text-foreground">100 coins (₹100)</span>
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter UPI ID (e.g. name@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="h-10 rounded-xl text-sm border-border/60"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleWithdraw}
                disabled={coins < 100}
                className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground font-bold text-sm"
              >
                Withdraw ₹{rupees}
              </Button>
              <Button
                onClick={() => setShowWithdraw(false)}
                variant="outline"
                className="h-10 rounded-xl border-border/60 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tasks */}
        <h2 className="font-bold text-foreground mb-3">Complete Tasks to Earn</h2>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-all ${
                task.done ? "bg-muted/30 opacity-60" : "bg-card hover:bg-muted/50 active:scale-[0.98]"
              } border border-border/50`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.done ? "bg-online/10" : "bg-primary/10"}`}>
                <task.icon size={18} className={task.done ? "text-online" : "text-primary"} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-sm text-foreground">{task.label}</h3>
                <p className="text-[10px] text-muted-foreground">{task.desc}</p>
              </div>
              <div className={`text-sm font-extrabold ${task.done ? "text-online" : "text-accent"}`}>
                {task.done ? "✓ Done" : `+${task.coins}`}
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-4 bg-muted/30 rounded-xl p-3 border border-border/30">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Coins 24-48 hours में आपके UPI account में transfer हो जाएंगे। Minimum withdrawal ₹100 है।
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarnCoinsPage;
