import { useState } from "react";
import { ArrowLeft, Copy, Share2, Users, Coins, Gift, TicketCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const REFERRAL_BONUS = 50;

const ReferralPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enteredCode, setEnteredCode] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, coins, referred_by")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, coins_awarded, created_at")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const referralCode = profile?.referral_code || "";
  const totalEarned = referrals?.reduce((sum, r) => sum + r.coins_awarded, 0) || 0;
  const totalReferred = referrals?.length || 0;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  const shareCode = async () => {
    const text = `Join FindBesti using my referral code: ${referralCode} and get started! 🎉`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FindBesti Referral", text });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Referral message copied!");
    }
  };

  const handleApplyCode = async () => {
    if (!enteredCode.trim()) return;
    setApplyingCode(true);
    try {
      const res = await supabase.functions.invoke("apply-referral", {
        body: { referral_code: enteredCode.trim() },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Referral applied! Your friend earned ${REFERRAL_BONUS} coins 🎉`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEnteredCode("");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply referral code");
    } finally {
      setApplyingCode(false);
    }
  };

  const alreadyReferred = !!profile?.referred_by;
  const isLoading = profileLoading || referralsLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Refer & Earn</h1>
        </div>

        {/* Referral Code Card */}
        <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-2xl p-5">
          <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider mb-2">Your Referral Code</p>
          {isLoading ? (
            <Skeleton className="h-10 w-40 bg-primary-foreground/20" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-primary-foreground tracking-[0.3em]">{referralCode}</span>
              <button onClick={copyCode} className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors">
                <Copy size={16} className="text-primary-foreground" />
              </button>
            </div>
          )}
          <p className="text-primary-foreground/60 text-xs mt-2">
            Share this code. You earn <span className="font-bold text-primary-foreground">{REFERRAL_BONUS} coins</span> per friend!
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-primary-foreground/10 rounded-2xl py-3 px-4 text-center">
            <Users size={18} className="text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-extrabold text-primary-foreground">{totalReferred}</p>
            <p className="text-[10px] text-primary-foreground/60">Friends Joined</p>
          </div>
          <div className="flex-1 bg-primary-foreground/10 rounded-2xl py-3 px-4 text-center">
            <Coins size={18} className="text-primary-foreground mx-auto mb-1" />
            <p className="text-lg font-extrabold text-primary-foreground">{totalEarned}</p>
            <p className="text-[10px] text-primary-foreground/60">Coins Earned</p>
          </div>
        </div>
      </div>

      {/* Share Button */}
      <div className="px-4 mt-6">
        <Button
          onClick={shareCode}
          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg gap-2"
        >
          <Share2 size={18} /> Share Referral Code
        </Button>
      </div>

      {/* Enter Referral Code */}
      {!alreadyReferred && (
        <div className="px-4 mt-4">
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TicketCheck size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Have a referral code?</h3>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="h-10 rounded-xl border-2 border-border/40 bg-background font-bold tracking-widest uppercase"
              />
              <Button
                onClick={handleApplyCode}
                disabled={applyingCode || !enteredCode.trim()}
                className="h-10 rounded-xl gradient-primary text-primary-foreground font-bold px-5"
              >
                {applyingCode ? "..." : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-sm text-foreground mb-3">How it works</h2>
        <div className="space-y-3">
          {[
            { step: "1", text: "Share your referral code with friends" },
            { step: "2", text: "Friend signs up and enters your code" },
            { step: "3", text: `You get ${REFERRAL_BONUS} bonus coins instantly!` },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-extrabold text-primary-foreground">{item.step}</span>
              </div>
              <p className="text-sm text-foreground font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      <div className="px-4 mt-6">
        <h2 className="font-bold text-sm text-foreground mb-3">Referral History</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : referrals && referrals.length > 0 ? (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-online/20 flex items-center justify-center">
                    <Gift size={16} className="text-online" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Friend joined!</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-online">+{r.coins_awarded} 🪙</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={40} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No referrals yet. Start sharing!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralPage;
