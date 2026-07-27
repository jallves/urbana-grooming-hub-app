import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

// Roda a cada 30 min via pg_cron. Idempotente: só repara vendas 'pago'
// nas últimas 24h que NÃO possuem financial_records associados.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1) Vendas pagas nas últimas 24h
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('id, updated_at, created_at')
      .eq('status', 'pago')
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(200)

    if (vendasError) throw vendasError
    if (!vendas || vendas.length === 0) {
      return new Response(JSON.stringify({ success: true, checked: 0, repaired: 0, skipped: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const vendaIds = vendas.map((v) => v.id)

    // 2) Financial records já existentes p/ essas vendas
    const { data: existing, error: frError } = await supabase
      .from('financial_records')
      .select('reference_id')
      .in('reference_id', vendaIds)

    if (frError) throw frError
    const hasFr = new Set((existing || []).map((r: any) => r.reference_id))

    // 3) Candidatas: vendas sem nenhum financial_record
    const candidates = vendas.filter((v) => !hasFr.has(v.id))

    let repaired = 0
    const errors: any[] = []
    const results: any[] = []

    for (const v of candidates) {
      try {
        const { data, error } = await supabase.functions.invoke('repair-last-checkout', {
          body: { venda_id: v.id },
        })
        if (error) throw error
        if (data?.success) {
          repaired++
          results.push({ venda_id: v.id, ok: true })
        } else {
          errors.push({ venda_id: v.id, error: data?.error || 'unknown' })
        }
      } catch (e: any) {
        errors.push({ venda_id: v.id, error: e?.message || String(e) })
      }
    }

    console.log('🩹 auto-repair-checkouts', {
      checked: vendas.length,
      candidates: candidates.length,
      repaired,
      errors: errors.length,
    })

    return new Response(
      JSON.stringify({
        success: true,
        checked: vendas.length,
        candidates: candidates.length,
        repaired,
        skipped: vendas.length - candidates.length,
        errors,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('❌ auto-repair-checkouts error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error?.message || String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})