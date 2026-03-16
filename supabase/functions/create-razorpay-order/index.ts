import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProductType = "premium" | "coins";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const badRequest = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Backend configuration missing");
    }
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const amount = Number(body?.amount);
    const planName = typeof body?.plan_name === "string" ? body.plan_name.trim() : "";
    const productType = body?.product_type as ProductType;
    const coins = Number(body?.coins ?? 0);

    if (!["premium", "coins"].includes(productType)) {
      return badRequest("product_type must be premium or coins");
    }
    if (!Number.isInteger(amount) || amount <= 0 || amount > 100000) {
      return badRequest("Invalid amount");
    }
    if (!planName || planName.length > 80) {
      return badRequest("Invalid plan_name");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (productType === "premium") {
      const { data: settings, error: settingsError } = await adminClient
        .from("app_settings")
        .select("subscription_plans")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      const plans = Array.isArray(settings?.subscription_plans)
        ? (settings.subscription_plans as Array<{ name?: string; amount?: number }>)
        : [];

      const validPlan = plans.some(
        (plan) => plan?.name === planName && Number(plan?.amount) === amount
      );

      if (!validPlan) {
        return badRequest("Invalid premium plan or amount");
      }
    } else {
      if (!Number.isInteger(coins) || coins <= 0 || coins > 1000000) {
        return badRequest("Invalid coins value");
      }

      const { data: pack, error: packError } = await adminClient
        .from("coin_packs")
        .select("id")
        .eq("active", true)
        .eq("coins", coins)
        .eq("price", amount)
        .maybeSingle();

      if (packError) throw packError;
      if (!pack) {
        return badRequest("Invalid coin pack or price");
      }
    }

    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: `${productType}_${Date.now()}`,
        notes: {
          user_id: user.id,
          product_type: productType,
          plan_name: planName,
          coins: productType === "coins" ? String(coins) : "0",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Razorpay order creation failed: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
        key_id: razorpayKeyId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
