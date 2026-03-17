import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CoinPack {
  id: string;
  coins: number;
  price: number;
  save_percent: string | null;
  popular: boolean;
  sort_order: number;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CoinPackPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const { data: coinPacks = [], isLoading } = useQuery({
    queryKey: ["coin-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packs")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CoinPack[];
    },
  });

  const handleBuy = async (pack: CoinPack) => {
    if (!user) {
      toast.error("पहले login करें");
      return;
    }
    setLoadingPack(pack.id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment SDK load नहीं हुआ। Internet check करें।");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: pack.price,
          plan_name: `${pack.coins} Coins Pack`,
          product_type: "coins",
          coins: pack.coins,
        },
      });

      if (error || !data?.order_id) {
        throw new Error(error?.message || "Order create नहीं हो पाया");
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Coin Pack",
        description: `${pack.coins.toLocaleString()} Coins`,
        order_id: data.order_id,
        prefill: { email: user?.email || "" },
        theme: { color: "#7c3aed" },
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                product_type: "coins",
                coins: pack.coins,
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature,
              },
            });

            if (verifyError || verifyData?.error || !verifyData?.success) {
              throw new Error(verifyError?.message || verifyData?.error || "Payment verification failed");
            }

            toast.success(`🎉 ${pack.coins.toLocaleString()} coins added to your wallet!`);
            navigate("/", { replace: true });
          } catch (verificationError: any) {
            toast.error(verificationError?.message || "Payment verify nahi ho paya");
          }
        },
        modal: {
          ondismiss: () => toast.info("Payment cancelled"),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-primary/20 pb-20">
      {/* Header */}
      <div className="gradient-primary pt-10 pb-8 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
        </div>
        <h1 className="text-2xl font-extrabold text-primary-foreground text-center">Coin Pack</h1>
      </div>

      {/* Packs Grid */}
      <div className="px-3 -mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {coinPacks.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack)}
                disabled={loadingPack !== null}
                className="relative bg-card rounded-2xl p-3 flex flex-col items-center gap-1 border border-border/50 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-60"
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[9px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    POPULAR
                  </span>
                )}
                <div className="text-2xl mt-1">🪙</div>
                {loadingPack === pack.id ? (
                  <Loader2 size={20} className="animate-spin text-primary my-2" />
                ) : (
                  <>
                    <p className="text-lg font-extrabold text-foreground leading-tight">
                      {pack.coins.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">Coins</p>
                    {pack.save_percent && (
                      <span className="bg-primary/15 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Save {pack.save_percent}
                      </span>
                    )}
                    <p className="text-sm font-extrabold text-primary mt-0.5">
                      ₹{pack.price.toLocaleString()}
                    </p>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="px-4 mt-6">
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <h2 className="font-extrabold text-foreground text-center mb-3">Benefits of Coins</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">🎥 <span>Video & Audio calls करें</span></li>
            <li className="flex items-center gap-2">💝 <span>Gifts भेजें अपने friends को</span></li>
            <li className="flex items-center gap-2">⭐ <span>Profile boost करें</span></li>
            <li className="flex items-center gap-2">💰 <span>UPI से withdrawal करें (1 Coin = ₹1)</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoinPackPage;
