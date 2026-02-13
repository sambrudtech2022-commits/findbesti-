import { ArrowLeft, Crown, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Weekly",
    price: "₹99",
    period: "/week",
    features: ["Unlimited likes", "See who liked you", "Priority matching"],
  },
  {
    name: "Monthly",
    price: "₹299",
    period: "/month",
    popular: true,
    features: ["All Weekly features", "Super likes x5", "Profile boost", "Read receipts"],
  },
  {
    name: "Yearly",
    price: "₹1,999",
    period: "/year",
    features: ["All Monthly features", "VIP badge", "Advanced filters", "Undo swipes"],
  },
];

const PremiumPage = () => {
  const navigate = useNavigate();

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
              className={`w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                plan.popular
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumPage;
