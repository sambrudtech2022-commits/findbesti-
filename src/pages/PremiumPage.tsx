import { ArrowLeft, Crown, Check, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Plan {
  name: string;
  price: string;
  amount: number;
  period: string;
  popular?: boolean;
  features: string[];
}

const fallbackPlans: Plan[] = [
  { name: "Weekly", price: "₹99", amount: 99, period: "/week", features: ["Unlimited likes", "See who liked you", "Priority matching"] },
  { name: "Monthly", price: "₹299", amount: 299, period: "/month", popular: true, features: ["All Weekly features", "Super likes x5", "Profile boost", "Read receipts"] },
  { name: "Yearly", price: "₹1,999", amount: 1999, period: "/year", features: ["All Monthly features", "VIP badge", "Advanced filters", "Undo swipes"] },
];

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

const PremiumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from("app_settings").select("subscription_plans").limit(1).single();
      if (data?.subscription_plans) {
        setPlans(data.subscription_plans as unknown as Plan[]);
      }
    };
    fetchPlans();
  }, []);

  const handlePayment = async (plan: Plan) => {
    setLoadingPlan(plan.name);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK load nahi hua. Internet check karein.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          amount: plan.amount,
          plan_name: plan.name,
          product_type: "premium",
        },
      });

      if (error || !data?.order_id) {
        throw new Error(error?.message || "Order create nahi ho paya");
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Premium Plan",
        description: `${plan.name} Subscription`,
        order_id: data.order_id,
        prefill: {
          email: user?.email || "",
        },
        theme: { color: "#7c3aed" },
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                product_type: "premium",
                plan_name: plan.name,
                razorpay_order_id: response?.razorpay_order_id,
                razorpay_payment_id: response?.razorpay_payment_id,
                razorpay_signature: response?.razorpay_signature,
              },
            });

            if (verifyError || verifyData?.error || !verifyData?.success) {
              throw new Error(verifyError?.message || verifyData?.error || "Payment verification failed");
            }

            toast.success(`🎉 ${plan.name} plan activated! Welcome to Premium!`);
          } catch (verificationError: any) {
            toast.error(verificationError?.message || "Payment verify nahi ho paya");
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary pt-12 pb-8 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Premium</h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Crown size={28} className="text-accent" />
          <div>
            <h2 className="text-lg font-bold text-primary-foreground">Unlock All Features</h2>
            <p className="text-primary-foreground/70 text-sm">Get more matches & connections</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border-2 p-4 transition-all ${
              plan.popular ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> Most Popular
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-lg text-foreground">{plan.name}</h3>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-primary">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check size={14} className="text-online" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePayment(plan)}
              disabled={loadingPlan !== null}
              className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                plan.popular
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              } disabled:opacity-50`}
            >
              {loadingPlan === plan.name ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : (
                `Choose ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumPage;
