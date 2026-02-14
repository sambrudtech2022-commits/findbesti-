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

    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY");
    if (!firebaseApiKey) {
      throw new Error("Firebase API key not configured");
    }

    // Verify Firebase ID token
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: firebase_id_token }),
      }
    );

    const verifyData = await verifyRes.json();
    console.log("Firebase verify response:", JSON.stringify(verifyData));

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

    const phone = firebaseUser.phoneNumber;
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "No phone number associated with Firebase account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firebase_uid = firebaseUser.localId;
    const email = `${phone.replace("+", "")}@phone.findbesti.app`;
    const tempPassword = crypto.randomUUID();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to sign in first (existing user)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: "dummy", // Will fail, but we check if user exists
    });

    let session;

    // Check if user exists by trying to get by email
    const { data: userList } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Use getUserByEmail-like approach: search by generated email
    let existingUser = null;
    try {
      // Try direct lookup - search users with the email
      const { data: lookupData, error: lookupError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', phone)
        .maybeSingle();
      
      if (lookupData?.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(lookupData.user_id);
        existingUser = userData?.user;
      }
    } catch (e) {
      console.log("Profile lookup failed, will try to create user:", e);
    }

    if (existingUser) {
      console.log("Existing user found:", existingUser.id);
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
        phone,
        user_metadata: { ...existingUser.user_metadata, firebase_uid },
      });

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: existingUser.email || email,
        password: tempPassword,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }
      session = signInData.session;
    } else {
      console.log("Creating new user with email:", email);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, display_name: "User", firebase_uid },
      });

      if (createError) {
        // User might already exist with this email
        console.error("Create user error:", createError);
        // Try to update and login
        if (createError.message?.includes("already been registered")) {
          const { data: existingByEmail } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
          const found = existingByEmail?.users?.find(u => u.email === email);
          if (found) {
            await supabase.auth.admin.updateUserById(found.id, { password: tempPassword });
            const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
              email, password: tempPassword,
            });
            if (retryError) throw retryError;
            session = retryLogin.session;
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else {
        const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword,
        });

        if (newLoginError) {
          console.error("New user login error:", newLoginError);
          throw newLoginError;
        }
        session = newLoginData.session;
      }
    }

    console.log("Login successful, session created");
    return new Response(
      JSON.stringify({ success: true, session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
