import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error("कृपया email और password भरें");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || "User" },
          },
        });
        if (error) throw error;
        toast.success("Signup सफल! कृपया अपना email verify करें।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login सफल!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error("कृपया phone number भरें");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
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
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
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
        <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">
          JoyMet
        </h1>
        <p className="text-primary-foreground/80 mt-2 text-sm font-medium">
          नए दोस्त बनाओ, Video Call करो 🎉
        </p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 px-5 -mt-8">
        <div className="glass-card rounded-2xl p-6 shadow-xl">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "login"
                  ? "gradient-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "signup"
                  ? "gradient-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Method Tabs */}
          <Tabs value={method} onValueChange={(v) => { setMethod(v as AuthMethod); setOtpSent(false); }}>
            <TabsList className="w-full mb-5 bg-muted/60">
              <TabsTrigger value="email" className="flex-1 gap-1.5 text-xs font-semibold">
                <Mail className="w-3.5 h-3.5" /> Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1 gap-1.5 text-xs font-semibold">
                <Phone className="w-3.5 h-3.5" /> Mobile OTP
              </TabsTrigger>
            </TabsList>

            {/* Email Auth */}
            <TabsContent value="email" className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="नाम दर्ज करें"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-border/60 bg-background"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email दर्ज करें"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/60 bg-background"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password दर्ज करें"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-border/60 bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
              >
                {loading ? "कृपया प्रतीक्षा करें..." : mode === "login" ? "Login करें" : "Sign Up करें"}
              </Button>
            </TabsContent>

            {/* Phone OTP Auth */}
            <TabsContent value="phone" className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+91XXXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border/60 bg-background"
                    />
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
                  >
                    {loading ? "भेज रहे हैं..." : "OTP भेजें"}
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="flex items-center gap-1 text-sm text-muted-foreground mb-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> नंबर बदलें
                  </button>
                  <p className="text-sm text-muted-foreground text-center">
                    OTP भेजा गया: <span className="font-bold text-foreground">{phone}</span>
                  </p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="6-digit OTP दर्ज करें"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="pl-10 h-12 rounded-xl border-border/60 bg-background text-center tracking-[0.5em] font-bold"
                    />
                  </div>
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
                  >
                    {loading ? "Verify कर रहे हैं..." : "OTP Verify करें"}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 mb-4">
          जारी रखकर, आप हमारी Terms of Service और Privacy Policy से सहमत हैं।
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
