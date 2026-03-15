import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { subscription_id, amount, payment_date, payment_method, period_start, period_end, notes } = await req.json()

    // Check if already exists
    const { data: existing } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('subscription_id', subscription_id)
      .eq('period_start', period_start)
      .eq('amount', amount)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already exists', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id,
        amount,
        payment_date,
        payment_method,
        status: 'paid',
        period_start,
        period_end,
        notes
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
