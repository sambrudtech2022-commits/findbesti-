import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    // Validate Indian mobile number (must start with 6-9)
    if (!phone || !/^\+91[6-9]\d{9}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Valid Indian mobile number required (+91XXXXXXXXXX)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store OTP in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting: check for recent OTP requests (1 per 60 seconds)
    const { data: recentOtps } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentOtps && recentOtps.length > 0) {
      return new Response(
        JSON.stringify({ error: "Please wait 60 seconds before requesting another OTP" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    // Invalidate previous OTPs for this phone
    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone", phone)
      .eq("verified", false);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({ phone, code: otp, expires_at: expiresAt });

    if (insertError) throw insertError;

    // Send SMS via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");


    if (!accountSid || !authToken || !twilioPhone) {
      return new Response(
        JSON.stringify({ error: "Missing Twilio credentials. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: `Your FindBesti verification code is: ${otp}. Valid for 5 minutes.`,
      }),
    });

    if (!twilioRes.ok) {
      const twilioError = await twilioRes.text();
      console.error("Twilio error:", twilioError);
      throw new Error("Failed to send SMS");
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
