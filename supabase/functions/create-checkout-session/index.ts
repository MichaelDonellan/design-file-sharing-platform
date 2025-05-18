import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or your Netlify URL
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-application-name",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req);
    const { designId } = await req.json()
    console.log('Design ID:', designId);

    if (!designId) {
      console.error('No design ID provided');
      return new Response(
        JSON.stringify({ error: 'Design ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get the design details
    console.log('Fetching design details...');
    const { data: design, error: designError } = await supabaseClient
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single()

    if (designError) {
      console.error('Error fetching design:', designError);
      return new Response(
        JSON.stringify({ error: 'Design not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    if (!design) {
      console.error('No design found');
      return new Response(
        JSON.stringify({ error: 'Design not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    console.log('Design found:', design);

    // Create a Stripe checkout session
    console.log('Creating Stripe checkout session...');
    const frontendUrl = Deno.env.get('FRONTEND_URL');
    console.log('Frontend URL:', frontendUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: design.currency || 'usd',
            product_data: {
              name: design.name,
              description: design.description,
            },
            unit_amount: design.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/design/${designId}?success=true`,
      cancel_url: `${frontendUrl}/design/${designId}?canceled=true`,
      metadata: {
        designId,
      },
    })

    console.log('Stripe session created:', session);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200,
        headers: corsHeaders
      }
    )
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
}) 