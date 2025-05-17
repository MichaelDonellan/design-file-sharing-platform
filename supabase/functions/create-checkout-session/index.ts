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

serve(async (req) => {
  try {
    const { designId } = await req.json()

    if (!designId) {
      return new Response(
        JSON.stringify({ error: 'Design ID is required' }),
        { status: 400 }
      )
    }

    // Get the design details
    const { data: design, error: designError } = await supabaseClient
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single()

    if (designError || !design) {
      return new Response(
        JSON.stringify({ error: 'Design not found' }),
        { status: 404 }
      )
    }

    // Create a Stripe checkout session
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
      success_url: `${Deno.env.get('FRONTEND_URL')}/design/${designId}?success=true`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/design/${designId}?canceled=true`,
      metadata: {
        designId,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}) 