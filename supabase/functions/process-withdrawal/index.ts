import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the user from the auth token
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { upi_id, amount } = await req.json();

    if (!upi_id || !upi_id.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid UPI ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: 'Minimum withdrawal is 100 coins' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check user's coin balance
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((profile.coins ?? 0) < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient coins' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert withdrawal request as pending first
    const { data: withdrawal, error: insertError } = await adminClient
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount,
        upi_id,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct coins from user's balance
    await adminClient
      .from('profiles')
      .update({ coins: (profile.coins ?? 0) - amount })
      .eq('user_id', user.id);

    // Now process payout via Razorpay Payouts (RazorpayX)
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      // If Razorpay not configured, mark as pending for manual processing
      await adminClient
        .from('withdrawal_requests')
        .update({ status: 'pending' })
        .eq('id', withdrawal.id);

      return new Response(JSON.stringify({
        success: true,
        status: 'pending',
        message: 'Withdrawal request submitted. Will be processed manually.',
        withdrawal_id: withdrawal.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Step 1: Create a Contact
    const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `User_${user.id.substring(0, 8)}`,
        type: 'customer',
        reference_id: user.id,
      }),
    });
    const contactData = await contactRes.json();
    
    if (!contactRes.ok) {
      console.error('Contact creation failed:', contactData);
      await adminClient
        .from('withdrawal_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      // Refund coins
      await adminClient
        .from('profiles')
        .update({ coins: (profile.coins ?? 0) })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ error: 'Payout setup failed. Coins refunded.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Create a Fund Account (UPI)
    const fundRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_id: contactData.id,
        account_type: 'vpa',
        vpa: { address: upi_id },
      }),
    });
    const fundData = await fundRes.json();

    if (!fundRes.ok) {
      console.error('Fund account creation failed:', fundData);
      await adminClient
        .from('withdrawal_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      await adminClient
        .from('profiles')
        .update({ coins: (profile.coins ?? 0) })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ error: 'Invalid UPI ID or payout setup failed. Coins refunded.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Create Payout
    const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_number: Deno.env.get('RAZORPAY_ACCOUNT_NUMBER') || '',
        fund_account_id: fundData.id,
        amount: amount * 100, // paise
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: withdrawal.id,
        narration: 'FindBesti Withdrawal',
      }),
    });
    const payoutData = await payoutRes.json();

    if (!payoutRes.ok) {
      console.error('Payout failed:', payoutData);
      await adminClient
        .from('withdrawal_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      await adminClient
        .from('profiles')
        .update({ coins: (profile.coins ?? 0) })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        error: payoutData?.error?.description || 'Payout failed. Coins refunded.',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update withdrawal status to completed
    await adminClient
      .from('withdrawal_requests')
      .update({ status: 'completed' })
      .eq('id', withdrawal.id);

    return new Response(JSON.stringify({
      success: true,
      status: 'completed',
      message: `₹${amount} sent to ${upi_id} successfully!`,
      payout_id: payoutData.id,
      withdrawal_id: withdrawal.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
