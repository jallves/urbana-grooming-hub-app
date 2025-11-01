import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resetting appointment:', appointment_id);

    // 1. Get session ID
    const { data: sessions } = await supabase
      .from('totem_sessions')
      .select('id')
      .eq('appointment_id', appointment_id);

    if (sessions && sessions.length > 0) {
      const sessionId = sessions[0].id;

      // 2. Delete payments
      await supabase
        .from('totem_payments')
        .delete()
        .eq('session_id', sessionId);

      // 3. Reset session
      await supabase
        .from('totem_sessions')
        .update({
          status: 'idle',
          check_in_time: null,
          check_out_time: null
        })
        .eq('id', sessionId);
    }

    // 4. Delete extra services
    await supabase
      .from('appointment_extra_services')
      .delete()
      .eq('appointment_id', appointment_id);

    // 5. Reset appointment status
    await supabase
      .from('painel_agendamentos')
      .update({ status: 'confirmado' })
      .eq('id', appointment_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agendamento resetado com sucesso!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error resetting appointment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
