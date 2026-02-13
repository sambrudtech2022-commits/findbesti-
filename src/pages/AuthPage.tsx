import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const fullPhone = `+91${phone}`;

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("कृपया valid phone number भरें");
      return;
    }
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
    if (!otp || otp.length < 4) {
      toast.error("कृपया valid OTP भरें");
      return;
    }
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
        <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">
          JoyMet
        </h1>
        <p className="text-primary-foreground/80 mt-2 text-sm font-medium">
          नए दोस्त बनाओ, Video Call करो 🎉
        </p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 px-5 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6">
          {!otpSent ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-5">Mobile number</h2>

              {/* Phone Input with +91 */}
              <div className="flex items-center bg-muted rounded-xl px-4 py-3 mb-3">
                <span className="text-primary font-bold text-base mr-3">+91</span>
                <div className="w-px h-6 bg-border mr-3" />
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <p className="text-sm font-semibold mb-5" style={{ color: "hsl(142, 70%, 45%)" }}>
                We don't share your number with anyone
              </p>

              {/* Get OTP Button */}
              <Button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="w-full h-14 rounded-full bg-primary/15 text-primary hover:bg-primary/25 text-lg font-bold shadow-none"
              >
                {loading ? "Sending..." : "Get OTP"}
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setOtpSent(false)}
                className="flex items-center gap-1 text-muted-foreground mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="text-xl font-bold text-foreground mb-2">Enter OTP</h2>
              <p className="text-sm text-muted-foreground mb-5">
                OTP sent to +91 {phone}
              </p>

              <Input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-muted rounded-xl px-4 py-3 h-14 text-center text-xl tracking-[0.5em] font-bold border-0 mb-5"
              />

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full h-14 rounded-full text-lg font-bold"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full text-center text-sm text-primary font-semibold mt-4"
              >
                Resend OTP
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 mb-4">
          By proceeding I accept the{" "}
          <span className="font-bold text-foreground">Community Guidelines</span> &{" "}
          <span className="font-bold text-foreground">Terms of Use</span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
