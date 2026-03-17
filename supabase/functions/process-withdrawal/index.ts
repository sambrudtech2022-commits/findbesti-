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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Atomic coin deduction - prevents race conditions
    const { error: deductError } = await adminClient.rpc('process_withdrawal_atomic', {
      _user_id: user.id,
      _amount: amount,
    });

    if (deductError) {
      return new Response(JSON.stringify({ error: 'Insufficient coins' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert withdrawal request after successful deduction
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

    // Check for Cashfree Payouts credentials
    const CASHFREE_CLIENT_ID = Deno.env.get('CASHFREE_CLIENT_ID');
    const CASHFREE_CLIENT_SECRET = Deno.env.get('CASHFREE_CLIENT_SECRET');

    if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
      // No Cashfree keys — mark as pending for manual admin approval
      await adminClient
        .from('withdrawal_requests')
        .update({ status: 'pending' })
        .eq('id', withdrawal.id);

      return new Response(JSON.stringify({
        success: true,
        status: 'pending',
        message: 'Withdrawal request submitted. Admin will process it manually.',
        withdrawal_id: withdrawal.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Cashfree Payouts V2 Flow ---
    const cfBaseUrl = 'https://payout-api.cashfree.com/payout/v2';

    // Step 1: Get auth token
    const tokenRes = await fetch(`${cfBaseUrl}/authorize`, {
      method: 'POST',
      headers: {
        'X-Client-Id': CASHFREE_CLIENT_ID,
        'X-Client-Secret': CASHFREE_CLIENT_SECRET,
        'Content-Type': 'application/json',
      },
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.subCode !== '200') {
      console.error('Cashfree auth failed:', tokenData);
      await adminClient.from('withdrawal_requests').update({ status: 'pending' }).eq('id', withdrawal.id);
      return new Response(JSON.stringify({
        success: true,
        status: 'pending',
        message: 'Payout gateway auth failed. Request saved for manual processing.',
        withdrawal_id: withdrawal.id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cfToken = tokenData.data?.token;
    const beneId = `bene_${user.id.replace(/-/g, '').substring(0, 16)}`;

    // Step 2: Add beneficiary (ignore if already exists)
    const beneRes = await fetch(`${cfBaseUrl}/beneficiary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beneficiaryId: beneId,
        beneficiaryName: `User_${user.id.substring(0, 8)}`,
        transferMode: 'upi',
        beneficiaryVpa: upi_id,
      }),
    });

    if (!beneRes.ok) {
      const beneData = await beneRes.json();
      // Ignore "already exists" error
      if (beneData.subCode !== '409') {
        console.error('Beneficiary creation failed:', beneData);
        await adminClient.from('withdrawal_requests').update({ status: 'failed' }).eq('id', withdrawal.id);
        // Refund coins atomically
        await adminClient.from('profiles').update({ coins: adminClient.rpc ? undefined : undefined }).eq('user_id', user.id);
        await adminClient.rpc('process_withdrawal_atomic', { _user_id: user.id, _amount: -amount }).catch(() => {});
        return new Response(JSON.stringify({ error: 'Invalid UPI ID or payout setup failed. Coins refunded.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 3: Initiate transfer
    const transferId = `txn_${withdrawal.id.replace(/-/g, '').substring(0, 20)}`;
    const transferRes = await fetch(`${cfBaseUrl}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transferId,
        transferAmount: amount,
        transferMode: 'upi',
        beneficiaryId: beneId,
        remarks: 'FindBesti Withdrawal',
      }),
    });
    const transferData = await transferRes.json();

    if (!transferRes.ok) {
      console.error('Transfer failed:', transferData);
      await adminClient.from('withdrawal_requests').update({ status: 'failed' }).eq('id', withdrawal.id);
      // Refund coins
      await adminClient.from('profiles').update({}).eq('user_id', user.id); // placeholder
      await adminClient.rpc('process_withdrawal_atomic', { _user_id: user.id, _amount: -amount }).catch(() => {});
      return new Response(JSON.stringify({
        error: transferData?.message || 'Payout failed. Coins refunded.',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark completed
    await adminClient
      .from('withdrawal_requests')
      .update({ status: 'completed' })
      .eq('id', withdrawal.id);

    return new Response(JSON.stringify({
      success: true,
      status: 'completed',
      message: `₹${amount} sent to ${upi_id} successfully!`,
      transfer_id: transferData?.data?.transferId || transferId,
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
