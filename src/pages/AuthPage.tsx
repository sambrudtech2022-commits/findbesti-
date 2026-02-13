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
            data: { display_name: displayName || "User" }
          }
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