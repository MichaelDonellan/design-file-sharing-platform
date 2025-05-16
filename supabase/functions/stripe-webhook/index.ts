import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { designId, userId, storeId } = session.metadata

      // Create purchase record
      const { error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          design_id: designId,
          user_id: userId,
          store_id: storeId,
          amount: session.amount_total / 100, // Convert from cents
          currency: session.currency,
          stripe_session_id: session.id,
          status: 'completed'
        })

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError)
        throw purchaseError
      }

      // Increment download count
      const { error: designError } = await supabaseClient
        .from('designs')
        .update({ downloads: supabaseClient.rpc('increment_downloads', { design_id: designId }) })
        .eq('id', designId)

      if (designError) {
        console.error('Error updating download count:', designError)
        throw designError
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 