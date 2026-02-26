import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, error: 'clientId é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Buscar o user_id do cliente
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('painel_clientes')
      .select('id, user_id, nome, email')
      .eq('id', clientId)
      .single();

    if (fetchError || !client) {
      console.error('❌ Cliente não encontrado:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Cliente não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`🗑️ Deletando cliente: ${client.nome} (${client.email})`);

    // 2. Deletar registros relacionados (em ordem de dependência)
    // Agendamentos
    await supabaseAdmin.from('painel_agendamentos').delete().eq('cliente_id', clientId);
    // Avaliações
    await supabaseAdmin.from('appointment_ratings').delete().eq('client_id', clientId);
    // Perfil do cliente
    await supabaseAdmin.from('client_profiles').delete().eq('client_id', clientId);
    // Contas a receber
    await supabaseAdmin.from('contas_receber').delete().eq('cliente_id', clientId);
    // Financial records
    await supabaseAdmin.from('financial_records').delete().eq('client_id', clientId);

    // 3. Deletar de painel_clientes
    const { error: deleteError } = await supabaseAdmin
      .from('painel_clientes')
      .delete()
      .eq('id', clientId);

    if (deleteError) {
      console.error('❌ Erro ao deletar perfil:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao deletar perfil: ${deleteError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Perfil deletado de painel_clientes');

    // 4. Deletar do auth.users (se existir)
    if (client.user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(client.user_id);
      
      if (authDeleteError) {
        console.warn('⚠️ Erro ao deletar do auth (pode já ter sido removido):', authDeleteError.message);
      } else {
        console.log('✅ Usuário deletado do auth.users:', client.user_id);
      }
    } else {
      console.log('ℹ️ Cliente sem user_id, pulando auth.users');
    }

    console.log(`🎉 Cliente ${client.nome} completamente removido do sistema`);

    return new Response(
      JSON.stringify({ success: true, message: `Cliente ${client.nome} excluído completamente` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro inesperado ao excluir cliente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
