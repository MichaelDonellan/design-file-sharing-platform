import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or your Netlify URL
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-application-name, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { designId } = await req.json()

    if (!designId) {
      return new Response(
        JSON.stringify({ error: 'Design ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get the design details
    const { data: design, error: designError } = await supabaseClient
      .from('designs')
      .select('*, stores!inner(currency)')
      .eq('id', designId)
      .single()

    if (designError || !design) {
      return new Response(
        JSON.stringify({ error: 'Design not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Create a Stripe checkout session using fetch
    const frontendUrl = Deno.env.get('FRONTEND_URL');
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    // Ensure price is sent as the smallest currency unit (e.g., pence for GBP, cents for USD)
    const unitAmount = Math.round(Number(design.price) * 100).toString();
    const storeCurrency = design.stores.currency || 'gbp'; // Use store's currency, fallback to GBP
    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "mode": "payment",
      "success_url": `${frontendUrl}/design/${designId}?success=true`,
      "cancel_url": `${frontendUrl}/design/${designId}?canceled=true`,
      "line_items[0][price_data][currency]": storeCurrency,
      "line_items[0][price_data][product_data][name]": design.name,
      "line_items[0][price_data][product_data][description]": design.description,
      "line_items[0][price_data][unit_amount]": unitAmount,
      "line_items[0][quantity]": "1",
      "metadata[designId]": designId,
      "metadata[storeId]": design.store_id, // Add store ID to metadata for webhook
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await sessionRes.json();

    if (!session.url) {
      return new Response(
        JSON.stringify({ error: 'Failed to create Stripe session', details: session }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : error }),
      { status: 500, headers: corsHeaders }
    )
  }
}) 