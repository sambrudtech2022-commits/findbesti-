import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ProductType = "premium" | "coins";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toHex = (buffer: Uint8Array) =>
  Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hmacSha256Hex = async (secret: string, payload: string) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  return toHex(new Uint8Array(signature));
};

const getDurationDays = (planName: string, period?: string) => {
  const normalized = `${planName} ${period ?? ""}`.toLowerCase();
  if (normalized.includes("year")) return 365;
  if (normalized.includes("month")) return 30;
  if (normalized.includes("week")) return 7;
  return 30;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !razorpayKeySecret || !razorpayKeyId) {
      throw new Error("Missing backend configuration");
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    const body = await req.json();
    const razorpayOrderId =
      typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
    const razorpayPaymentId =
      typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
    const razorpaySignature =
      typeof body?.razorpay_signature === "string" ? body.razorpay_signature.trim().toLowerCase() : "";
    const productType = body?.product_type as ProductType;
    const requestedPlanName =
      typeof body?.plan_name === "string" ? body.plan_name.trim() : "";
    const requestedCoins = Number(body?.coins ?? 0);

    if (!/^order_[a-zA-Z0-9]+$/.test(razorpayOrderId)) {
      return jsonResponse(400, { error: "Invalid razorpay_order_id" });
    }
    if (!/^pay_[a-zA-Z0-9]+$/.test(razorpayPaymentId)) {
      return jsonResponse(400, { error: "Invalid razorpay_payment_id" });
    }
    if (!/^[a-f0-9]{64}$/.test(razorpaySignature)) {
      return jsonResponse(400, { error: "Invalid razorpay_signature" });
    }
    if (productType !== "premium" && productType !== "coins") {
      return jsonResponse(400, { error: "product_type must be premium or coins" });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingPurchase } = await adminClient
      .from("purchases")
      .select("id, user_id, plan_name, status")
      .eq("payment_id", razorpayPaymentId)
      .maybeSingle();

    if (existingPurchase) {
      if (existingPurchase.user_id !== user.id) {
        return jsonResponse(403, { error: "Payment already linked to another account" });
      }
      return jsonResponse(200, {
        success: true,
        already_processed: true,
        status: existingPurchase.status,
        plan_name: existingPurchase.plan_name,
      });
    }

    const expectedSignature = await hmacSha256Hex(
      razorpayKeySecret,
      `${razorpayOrderId}|${razorpayPaymentId}`
    );

    if (expectedSignature !== razorpaySignature) {
      return jsonResponse(400, { error: "Payment signature verification failed" });
    }

    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const [orderRes, paymentRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`, {
        headers: { Authorization: `Basic ${credentials}` },
      }),
      fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`, {
        headers: { Authorization: `Basic ${credentials}` },
      }),
    ]);

    const order = await orderRes.json();
    const payment = await paymentRes.json();

    if (!orderRes.ok) {
      return jsonResponse(400, { error: `Unable to verify order: ${order?.error?.description ?? "Invalid order"}` });
    }
    if (!paymentRes.ok) {
      return jsonResponse(400, {
        error: `Unable to verify payment: ${payment?.error?.description ?? "Invalid payment"}`,
      });
    }

    if (payment?.order_id !== razorpayOrderId) {
      return jsonResponse(400, { error: "Payment/order mismatch" });
    }
    if (!["authorized", "captured"].includes(payment?.status)) {
      return jsonResponse(400, { error: "Payment is not authorized" });
    }

    const orderOwnerId = typeof order?.notes?.user_id === "string" ? order.notes.user_id : "";
    if (orderOwnerId !== user.id) {
      return jsonResponse(403, { error: "This payment does not belong to current user" });
    }

    const orderProductType = order?.notes?.product_type as ProductType;
    if (orderProductType !== productType) {
      return jsonResponse(400, { error: "Product type mismatch" });
    }

    const paidAmount = Number(payment?.amount);
    const orderAmount = Number(order?.amount);
    if (!Number.isInteger(paidAmount) || !Number.isInteger(orderAmount) || paidAmount <= 0 || paidAmount !== orderAmount) {
      return jsonResponse(400, { error: "Invalid paid amount" });
    }

    const amountInRupees = Math.floor(orderAmount / 100);

    if (productType === "premium") {
      const planName = requestedPlanName || String(order?.notes?.plan_name ?? "").trim();
      if (!planName) {
        return jsonResponse(400, { error: "Invalid premium plan" });
      }

      const { data: settings, error: settingsError } = await adminClient
        .from("app_settings")
        .select("subscription_plans")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      const plans = Array.isArray(settings?.subscription_plans)
        ? (settings.subscription_plans as Array<{ name?: string; amount?: number; period?: string }>)
        : [];
      const matchedPlan = plans.find(
        (plan) => plan?.name === planName && Number(plan?.amount) === amountInRupees
      );

      if (!matchedPlan) {
        return jsonResponse(400, { error: "Plan validation failed" });
      }

      const { error: purchaseError } = await adminClient.from("purchases").insert({
        user_id: user.id,
        plan_name: planName,
        amount: amountInRupees,
        currency: "INR",
        status: "completed",
        payment_id: razorpayPaymentId,
      });

      if (purchaseError) throw purchaseError;

      let insertedSubscriptionId: string | null = null;
      try {
        const now = new Date();

        const { data: activeSubscription } = await adminClient
          .from("premium_subscriptions")
          .select("ends_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("ends_at", now.toISOString())
          .order("ends_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const startsAt =
          activeSubscription?.ends_at && new Date(activeSubscription.ends_at) > now
            ? new Date(activeSubscription.ends_at)
            : now;

        const endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + getDurationDays(planName, matchedPlan.period));

        const { data: subscription, error: subscriptionError } = await adminClient
          .from("premium_subscriptions")
          .insert({
            user_id: user.id,
            plan_name: planName,
            amount: amountInRupees,
            status: "active",
            started_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            payment_id: razorpayPaymentId,
            order_id: razorpayOrderId,
          })
          .select("id")
          .single();

        if (subscriptionError) throw subscriptionError;
        insertedSubscriptionId = subscription.id;

        return jsonResponse(200, {
          success: true,
          product_type: "premium",
          plan_name: planName,
          premium_expires_at: endsAt.toISOString(),
        });
      } catch (premiumError) {
        if (insertedSubscriptionId) {
          await adminClient.from("premium_subscriptions").delete().eq("id", insertedSubscriptionId);
        }
        await adminClient.from("purchases").delete().eq("payment_id", razorpayPaymentId);
        throw premiumError;
      }
    }

    const coinsFromOrder = Number(order?.notes?.coins ?? 0);
    const coinsToCredit = Number.isInteger(requestedCoins) && requestedCoins > 0 ? requestedCoins : coinsFromOrder;

    if (!Number.isInteger(coinsToCredit) || coinsToCredit <= 0 || coinsToCredit > 1000000) {
      return jsonResponse(400, { error: "Invalid coins pack" });
    }
    if (coinsFromOrder !== coinsToCredit) {
      return jsonResponse(400, { error: "Coin pack mismatch" });
    }

    const { data: pack, error: packError } = await adminClient
      .from("coin_packs")
      .select("id")
      .eq("active", true)
      .eq("coins", coinsToCredit)
      .eq("price", amountInRupees)
      .maybeSingle();

    if (packError) throw packError;
    if (!pack) {
      return jsonResponse(400, { error: "Coin pack validation failed" });
    }

    const { error: purchaseError } = await adminClient.from("purchases").insert({
      user_id: user.id,
      plan_name: `${coinsToCredit} Coins Pack`,
      amount: amountInRupees,
      currency: "INR",
      status: "completed",
      payment_id: razorpayPaymentId,
    });

    if (purchaseError) throw purchaseError;

    try {
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("coins")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const currentCoins = Number(profile?.coins ?? 0);
      const { error: updateError } = await adminClient
        .from("profiles")
        .upsert({ user_id: user.id, coins: currentCoins + coinsToCredit }, { onConflict: "user_id" });

      if (updateError) throw updateError;

      return jsonResponse(200, {
        success: true,
        product_type: "coins",
        coins_added: coinsToCredit,
      });
    } catch (coinsError) {
      await adminClient.from("purchases").delete().eq("payment_id", razorpayPaymentId);
      throw coinsError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return jsonResponse(500, { error: message });
  }
});