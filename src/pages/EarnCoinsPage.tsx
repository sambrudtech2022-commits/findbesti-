import { useState, useEffect } from "react";
import { ArrowLeft, Gift, Play, Share2, Users, CheckCircle, Wallet, IndianRupee, Loader2, Clock, CircleDot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TASKS = [
{ id: "watch_video", icon: Play, label: "Watch a Video", coins: 10, desc: "Watch a 30s ad", daily: true },
{ id: "share_app", icon: Share2, label: "Share App", coins: 50, desc: "Share with a friend", daily: false },
{ id: "invite_friends", icon: Users, label: "Invite Friends", coins: 100, desc: "Invite 3 friends", daily: false },
{ id: "daily_login", icon: CheckCircle, label: "Daily Login", coins: 5, desc: "Login everyday", daily: true },
{ id: "watch_ad", icon: Play, label: "Watch Ad", coins: 10, desc: "Watch another ad", daily: true }];


const EarnCoinsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upiId, setUpiId] = useState("");
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const rupees = earnedCoins;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const [giftsRes, tasksRes, referralsRes, completionsRes, withdrawalsRes] = await Promise.all([
      supabase.from("gift_transactions").select("coins_spent").eq("receiver_id", user.id),
      supabase.from("task_completions").select("coins_earned").eq("user_id", user.id),
      supabase.from("referrals").select("coins_awarded").eq("referrer_id", user.id),
      supabase.from("task_completions").select("task_id").eq("user_id", user.id).eq("completed_date", today),
      supabase.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const giftEarnings = (giftsRes.data ?? []).reduce((s, g) => s + (g.coins_spent ?? 0), 0);
    const taskEarnings = (tasksRes.data ?? []).reduce((s, t) => s + (t.coins_earned ?? 0), 0);
    const referralEarnings = (referralsRes.data ?? []).reduce((s, r) => s + (r.coins_awarded ?? 0), 0);
    const totalWithdrawn = (withdrawalsRes.data ?? [])
      .filter((w: any) => w.status === "completed" || w.status === "pending")
      .reduce((s: number, w: any) => s + (w.amount ?? 0), 0);

    setEarnedCoins(Math.max(0, giftEarnings + taskEarnings + referralEarnings - totalWithdrawn));
    if (completionsRes.data) setCompletedTasks(completionsRes.data.map((t: any) => t.task_id));
    if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data);
    setLoading(false);
  };

  const handleCompleteTask = async (taskId: string, taskCoins: number) => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    setTaskLoading(taskId);
    try {
      const { error } = await supabase.rpc("complete_task", {
        _task_id: taskId
      });
      if (error) {
        if (error.message?.includes("duplicate") || error.code === "23505") {
          toast.error("This task is already completed today!");
        } else {
          throw error;
        }
      } else {
        setEarnedCoins((prev) => prev + taskCoins);
        setCompletedTasks((prev) => [...prev, taskId]);
        toast.success(`+${taskCoins} coins earned! 🎉`);
      }
    } catch (error: any) {
      toast.error(error.message || "Task could not be completed");
    } finally {
      setTaskLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (!upiId || !upiId.includes("@")) {
      toast.error("Enter valid UPI ID (e.g. name@upi)");
      return;
    }
    if (earnedCoins < 100) {
      toast.error("Minimum 100 coins required for withdrawal");
      return;
    }
    setWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: { upi_id: upiId, amount: earnedCoins },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      if (data?.status === 'completed') {
        toast.success(`₹${earnedCoins} sent to your UPI ${upiId}! 🎉`);
      } else {
        toast.success(data?.message || `₹${earnedCoins} withdrawal request submitted!`);
      }
      
      setUpiId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>);
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="gradient-primary pt-10 pb-6 px-4 rounded-b-3xl shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Earnings</h1>
        </div>

        {/* Balance Card */}
        <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Wallet size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-primary-foreground/60 text-xs font-medium">Your Earnings</p>
                <div className="flex items-center gap-1">
                  <IndianRupee size={20} className="text-primary-foreground" />
                  <p className="text-2xl font-extrabold text-primary-foreground">{rupees}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/60 text-xs font-medium">From</p>
              <p className="text-xs text-primary-foreground/80">Gifts, Tasks &amp; Referrals</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Button
            onClick={() => setShowWithdraw(!showWithdraw)}
            className="w-full h-11 rounded-xl bg-accent text-accent-foreground font-bold text-sm gap-2 hover:bg-accent/90">
            <Wallet size={16} />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {showWithdraw &&
        <div className="bg-card border border-border/50 rounded-2xl p-4 mb-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">UPI Withdrawal</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: <span className="font-bold text-foreground">₹100</span>
            </p>
            <Input
            type="text"
            placeholder="Enter UPI ID (e.g. name@upi)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="h-10 rounded-xl text-sm border-border/60" />

            <div className="flex gap-2">
              <Button
              onClick={handleWithdraw}
              disabled={earnedCoins < 100 || withdrawLoading}
              className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground font-bold text-sm">
                {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Withdraw ₹${rupees}`}
              </Button>
              <Button onClick={() => setShowWithdraw(false)} variant="outline" className="h-10 rounded-xl border-border/60 text-sm">
                Cancel
              </Button>
            </div>
          </div>
        }

        <h2 className="font-bold text-foreground mb-3">Complete Tasks to Earn</h2>
        <div className="space-y-2">
          {TASKS.map((task) => {
            const isDone = completedTasks.includes(task.id);
            const isLoading = taskLoading === task.id;
            return (
              <button
                key={task.id}
                onClick={() => !isDone && !isLoading && handleCompleteTask(task.id, task.coins)}
                disabled={isDone || isLoading}
                className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-all ${
                isDone ? "bg-muted/30 opacity-60" : "bg-card hover:bg-muted/50 active:scale-[0.98]"} border border-border/50`
                }>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDone ? "bg-online/10" : "bg-primary/10"}`}>
                  {isLoading ?
                  <Loader2 size={18} className="text-primary animate-spin" /> :
                  <task.icon size={18} className={isDone ? "text-online" : "text-primary"} />
                  }
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-sm text-foreground">{task.label}</h3>
                  <p className="text-[10px] text-muted-foreground">{task.desc}</p>
                </div>
                <div className={`text-sm font-extrabold ${isDone ? "text-online" : "text-accent"}`}>
                  {isDone ? "✓ Done" : `+${task.coins}`}
                </div>
              </button>);
          })}
        </div>

        <div className="mt-4 bg-muted/30 rounded-xl p-3 border border-border/30">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Coins will be transferred to your UPI account instantly. Minimum withdrawal ₹100.
          </p>
        </div>

        {/* Withdrawal History */}
        {withdrawals.length > 0 &&
        <div className="mt-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              Withdrawal History
            </h2>
            <div className="space-y-2">
              {withdrawals.map((w) => {
              const statusColor = w.status === "completed" ? "text-online" : w.status === "failed" ? "text-destructive" : "text-accent";
              const statusBg = w.status === "completed" ? "bg-online/10" : w.status === "failed" ? "bg-destructive/10" : "bg-accent/10";
              const date = new Date(w.created_at);
              const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={w.id} className="flex items-center gap-3 py-3 px-3 rounded-xl bg-card border border-border/50">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusBg}`}>
                      <IndianRupee size={16} className={statusColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-foreground">₹{w.amount}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBg} ${statusColor} capitalize`}>
                          {w.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] text-muted-foreground">{w.upi_id}</p>
                        <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                      </div>
                    </div>
                  </div>);
            })}
            </div>
          </div>
        }
      </div>
    </div>);
};

export default EarnCoinsPage;
