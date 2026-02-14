import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_SECRETS = [
  { name: "AGORA_APP_ID", category: "Agora (Video/Audio Calls)", description: "Agora App ID for real-time communication" },
  { name: "AGORA_APP_CERTIFICATE", category: "Agora (Video/Audio Calls)", description: "Agora App Certificate for token generation" },
  { name: "FIREBASE_API_KEY", category: "Firebase (Phone Auth)", description: "Firebase API Key for authentication" },
  { name: "FIREBASE_AUTH_DOMAIN", category: "Firebase (Phone Auth)", description: "Firebase Auth Domain" },
  { name: "FIREBASE_PROJECT_ID", category: "Firebase (Phone Auth)", description: "Firebase Project ID" },
  { name: "TWILIO_ACCOUNT_SID", category: "Twilio (OTP/SMS)", description: "Twilio Account SID for SMS" },
  { name: "TWILIO_AUTH_TOKEN", category: "Twilio (OTP/SMS)", description: "Twilio Auth Token" },
  { name: "TWILIO_PHONE_NUMBER", category: "Twilio (OTP/SMS)", description: "Twilio Phone Number for sending SMS" },
  { name: "RAZORPAY_KEY_ID", category: "Razorpay (Payments)", description: "Razorpay Key ID for payments" },
  { name: "RAZORPAY_KEY_SECRET", category: "Razorpay (Payments)", description: "Razorpay Key Secret" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check each secret (only report if set or not, never reveal values)
    const secrets = REQUIRED_SECRETS.map((s) => {
      const value = Deno.env.get(s.name);
      return {
        name: s.name,
        category: s.category,
        description: s.description,
        configured: !!value && value.trim().length > 0,
      };
    });

    return new Response(JSON.stringify({ secrets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
