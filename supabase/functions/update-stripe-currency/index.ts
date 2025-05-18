import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { currency } = await req.json()

    if (!currency) {
      throw new Error('Currency is required')
    }

    // Get the store's Stripe account ID
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('stripe_account_id')
      .eq('user_id', req.headers.get('x-user-id'))
      .single()

    if (storeError || !store?.stripe_account_id) {
      throw new Error('Store not found or not connected to Stripe')
    }

    // Update Stripe account settings
    const response = await fetch(`https://api.stripe.com/v1/accounts/${store.stripe_account_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'settings[payments][currencies][]': currency,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update Stripe currency settings')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 