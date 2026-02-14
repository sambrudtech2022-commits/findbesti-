import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firebase_id_token } = await req.json();

    if (!firebase_id_token) {
      return new Response(
        JSON.stringify({ error: "firebase_id_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the Firebase ID token server-side using Google's Identity Toolkit API
    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY");
    if (!firebaseApiKey) {
      throw new Error("Firebase API key not configured");
    }

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: firebase_id_token }),
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData.error) {
      return new Response(
        JSON.stringify({ error: "Invalid Firebase token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firebaseUser = verifyData.users?.[0];
    if (!firebaseUser) {
      return new Response(
        JSON.stringify({ error: "Firebase user not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract phone from the VERIFIED Firebase token - never trust client-provided phone
    const phone = firebaseUser.phoneNumber;
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "No phone number associated with Firebase account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firebase_uid = firebaseUser.localId;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists with this phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === phone || u.user_metadata?.phone === phone
    );

    let session;
    const email = `${phone.replace("+", "")}@phone.findbesti.app`;
    const tempPassword = crypto.randomUUID();

    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
        phone,
        user_metadata: { ...existingUser.user_metadata, firebase_uid },
      });

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: existingUser.email || email,
        password: tempPassword,
      });

      if (loginError) throw loginError;
      session = loginData.session;
    } else {
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, display_name: "User", firebase_uid },
      });

      if (createError) throw createError;

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });

      if (loginError) throw loginError;
      session = loginData.session;
    }

    return new Response(
      JSON.stringify({ success: true, session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
