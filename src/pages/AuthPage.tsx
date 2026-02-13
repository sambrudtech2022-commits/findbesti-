import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google Sign In failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const fullPhone = "+91" + phone;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtpSent(true);
      toast.success("OTP भेजा गया!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("कृपया OTP भरें");
      return;
    }
    const fullPhone = "+91" + phone;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Login सफल!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-16 px-6 text-center rounded-b-[2.5rem]">
        <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">FIND BESTI 🫶

        </h1>
        <p className="text-primary-foreground/80 mt-2 text-sm font-medium">
          नए दोस्त बनाओ, Video Call करो 🎉
        </p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 px-5 -mt-8">
        <div className="glass-card rounded-2xl p-6 shadow-xl">
          {!otpSent ?
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Mobile number</h3>
              </div>
              <div className="flex items-center gap-0 h-14 rounded-xl bg-muted/50 border border-border/60 overflow-hidden">
                <span className="pl-4 pr-2 text-base font-semibold text-primary shrink-0">+91</span>
                <div className="w-px h-6 bg-border/60" />
                <Input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                }}
                className="border-0 bg-transparent h-full text-base font-medium focus-visible:ring-0 shadow-none pl-3" />

              </div>
              <p className="text-xs font-medium text-online">
                We don't share your number with anyone
              </p>
              <Button
              onClick={() => {
                if (phone.length === 10) {
                  handleSendOtp();
                } else {
                  toast.error("कृपया 10 digit का mobile number भरें");
                }
              }}
              disabled={loading || phone.replace(/\D/g, "").length !== 10}
              className="w-full h-14 rounded-full bg-accent/20 text-accent font-bold text-lg shadow-none hover:bg-accent/30 transition-colors">

                {loading ? "भेज रहे हैं..." : "Get OTP"}
              </Button>
            </div> :

          <div className="space-y-4">
              <button
              onClick={() => {setOtpSent(false);setOtp("");}}
              className="flex items-center gap-1 text-sm text-muted-foreground mb-2">

                <ArrowLeft className="w-4 h-4" /> नंबर बदलें
              </button>
              <p className="text-sm text-muted-foreground text-center">
                OTP भेजा गया: <span className="font-bold text-foreground">+91{phone}</span>
              </p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                type="text"
                placeholder="6-digit OTP दर्ज करें"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="pl-10 h-12 rounded-xl border-border/60 bg-background text-center tracking-[0.5em] font-bold" />

              </div>
              <Button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity">

                {loading ? "Verify कर रहे हैं..." : "OTP Verify करें"}
              </Button>
            </div>
          }
          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground font-medium">या</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            variant="outline"
            className="w-full h-12 rounded-xl border-border/60 font-bold text-sm gap-2">

            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "कृपया प्रतीक्षा करें..." : "Google से Login करें"}
          </Button>
        </div>
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 mb-4">
          By proceeding I accept the{" "}
          <span className="font-bold text-foreground">Community Guidelines</span> &{" "}
          <span className="font-bold text-foreground">Terms of Use</span>
        </p>
      </div>
    </div>);

};

export default AuthPage;