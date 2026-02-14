import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, ArrowLeft, Shield, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { initFirebase, setupRecaptcha, sendFirebaseOtp, type ConfirmationResult, type Auth } from "@/lib/firebase";

const AuthPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  const firebaseAuthRef = useRef<Auth | null>(null);
  const recaptchaContainerIdRef = useRef(0);

  useEffect(() => {
    // Pre-init Firebase
    initFirebase().then((auth) => {
      firebaseAuthRef.current = auth;
    }).catch(console.error);
  }, []);

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
    const auth = firebaseAuthRef.current || await initFirebase();
      
      // Always clear old recaptcha
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
      
      // Create a fresh container with unique ID to avoid "already rendered" error
      const oldContainer = document.getElementById("recaptcha-container");
      if (oldContainer) oldContainer.remove();
      
      recaptchaContainerIdRef.current += 1;
      const newContainer = document.createElement("div");
      newContainer.id = "recaptcha-container";
      newContainer.setAttribute("data-key", String(recaptchaContainerIdRef.current));
      document.body.appendChild(newContainer);
      
      recaptchaVerifierRef.current = setupRecaptcha(auth, "recaptcha-container");

      const confirmationResult = await sendFirebaseOtp(fullPhone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;
      setOtpSent(true);
      toast.success("OTP भेजा गया!");
    } catch (error: any) {
      console.error("Send OTP error:", error);
      // Reset recaptcha on error
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
      }
      recaptchaVerifierRef.current = null;
      const container = document.getElementById("recaptcha-container");
      if (container) container.remove();
      toast.error(error.message || "OTP भेजने में error आया");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("कृपया OTP भरें");
      return;
    }
    setLoading(true);
    try {
      if (!confirmationResultRef.current) {
        throw new Error("Please request OTP first");
      }

      // Verify OTP with Firebase
      const result = await confirmationResultRef.current.confirm(otp);
      const firebaseUser = result.user;

      // Get Firebase ID token for server-side verification
      const idToken = await firebaseUser.getIdToken();

      // Now create/login Supabase session via edge function
      const res = await supabase.functions.invoke("verify-otp", {
        body: { firebase_id_token: idToken },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast.success("Login सफल!");
      } else {
        throw new Error("Session not received");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "OTP verify में error आया");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">

      {/* Hero Section */}
      <div className="gradient-primary relative flex-1 flex flex-col px-6 pt-12 pb-8 overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-8 right-6 animate-bounce-in" style={{ animationDelay: "0.3s" }}>
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center rotate-12">
            <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground/50" />
          </div>
        </div>
        <div className="absolute top-32 right-14 animate-bounce-in" style={{ animationDelay: "0.5s" }}>
          <div className="w-8 h-8 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center -rotate-12">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <div className="absolute bottom-16 left-6 w-20 h-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="absolute top-20 left-1/2 w-32 h-32 rounded-full bg-primary-foreground/5 blur-2xl" />

        {/* App Name */}
        <div className="animate-slide-up">
          <h1 className="text-5xl font-black text-primary-foreground italic tracking-tight leading-none">
            FIND
          </h1>
          <h1 className="text-5xl font-black text-primary-foreground italic tracking-tight leading-none mt-1">
            BESTI
          </h1>
        </div>

        {/* Taglines */}
        <div className="mt-8 space-y-2 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-lg font-bold text-primary-foreground/90">100% safe & secure</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-lg font-bold text-primary-foreground/80">Zero fake profiles</p>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      {/* Bottom Auth Card */}
      <div className="bg-card rounded-t-[2rem] -mt-8 relative z-10 px-5 pt-6 pb-5 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] animate-slide-up" style={{ animationDelay: "0.25s" }}>
        {!otpSent ? (
          <div className="space-y-3.5">
            <div className="flex items-center gap-0 h-14 rounded-2xl bg-muted/40 border-2 border-border/40 overflow-hidden focus-within:border-primary/40 transition-colors">
              <span className="pl-4 pr-2 text-base font-bold text-primary shrink-0">+91</span>
              <div className="w-px h-7 bg-border/50" />
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                }}
                className="border-0 bg-transparent h-full text-base font-semibold focus-visible:ring-0 shadow-none pl-3"
              />
            </div>
            <Button
              onClick={() => {
                if (phone.length === 10) {
                  handleSendOtp();
                } else {
                  toast.error("कृपया 10 digit का mobile number भरें");
                }
              }}
              disabled={loading || phone.replace(/\D/g, "").length !== 10}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {loading ? "भेज रहे हैं..." : "Get OTP →"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <button
              onClick={() => { setOtpSent(false); setOtp(""); confirmationResultRef.current = null; }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> नंबर बदलें
            </button>
            <p className="text-sm text-muted-foreground text-center">
              OTP भेजा गया: <span className="font-extrabold text-foreground">+91 {phone}</span>
            </p>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="6-digit OTP दर्ज करें"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="pl-10 h-14 rounded-2xl border-2 border-border/40 bg-muted/40 text-center tracking-[0.5em] font-extrabold text-lg focus-visible:border-primary/40"
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {loading ? "Verify कर रहे हैं..." : "OTP Verify करें ✓"}
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-3.5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-border/50 font-bold text-sm gap-2.5 hover:bg-muted/50 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? "कृपया प्रतीक्षा करें..." : "Continue with Google"}
        </Button>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground mt-3.5 leading-relaxed">
          By proceeding I accept the{" "}
          <span className="font-bold text-foreground underline underline-offset-2">Terms</span> &{" "}
          <span className="font-bold text-foreground underline underline-offset-2">Community Guidelines</span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
