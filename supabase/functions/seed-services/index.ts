import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceData {
  nome: string;
  preco: number;
  duracao: number;
  show_on_home: boolean;
  is_active: boolean;
  display_order: number;
  descricao: string;
}

interface SeedResult {
  success: boolean;
  data?: {
    servicesRemoved: number;
    servicesInserted: number;
    homeServices: string[];
    barberLinks: number;
  };
  error?: string;
  logs: string[];
}

// Lista oficial de serviços da Barbearia Costa Urbana
const SERVICES_DATA: ServiceData[] = [
  { nome: 'Corte', preco: 50.00, duracao: 30, show_on_home: true, is_active: true, display_order: 1, descricao: 'Corte de cabelo profissional' },
  { nome: 'Barba', preco: 50.00, duracao: 30, show_on_home: true, is_active: true, display_order: 2, descricao: 'Barba completa com acabamento' },
  { nome: 'Corte + Barba', preco: 95.00, duracao: 60, show_on_home: true, is_active: true, display_order: 3, descricao: 'Combo corte e barba' },
  { nome: 'Corte + Barba + Sobrancelha', preco: 110.00, duracao: 60, show_on_home: false, is_active: true, display_order: 4, descricao: 'Combo completo' },
  { nome: 'Corte + Sobrancelha', preco: 70.00, duracao: 30, show_on_home: true, is_active: true, display_order: 5, descricao: 'Corte com design de sobrancelha' },
  { nome: 'Corte + Tonalização', preco: 120.00, duracao: 90, show_on_home: false, is_active: true, display_order: 6, descricao: 'Corte com tonalização capilar' },
  { nome: 'Hidratação', preco: 50.00, duracao: 45, show_on_home: false, is_active: true, display_order: 7, descricao: 'Hidratação capilar profunda' },
  { nome: 'Hidratação V.O', preco: 90.00, duracao: 45, show_on_home: false, is_active: true, display_order: 8, descricao: 'Hidratação V.O premium' },
  { nome: 'Luzes', preco: 130.00, duracao: 120, show_on_home: false, is_active: true, display_order: 9, descricao: 'Luzes e mechas' },
  { nome: 'Platinado', preco: 180.00, duracao: 120, show_on_home: false, is_active: true, display_order: 10, descricao: 'Platinado completo' },
  { nome: 'Selagem', preco: 130.00, duracao: 60, show_on_home: false, is_active: true, display_order: 11, descricao: 'Selagem capilar' },
  { nome: 'Selagem + Corte', preco: 170.00, duracao: 90, show_on_home: false, is_active: true, display_order: 12, descricao: 'Combo selagem e corte' },
  { nome: 'Botox Capilar', preco: 130.00, duracao: 90, show_on_home: false, is_active: true, display_order: 13, descricao: 'Tratamento botox capilar' },
  { nome: 'Sobrancelha', preco: 25.00, duracao: 15, show_on_home: true, is_active: true, display_order: 14, descricao: 'Design de sobrancelha' },
  { nome: 'Sobrancelha Egípcia', preco: 50.00, duracao: 30, show_on_home: false, is_active: true, display_order: 15, descricao: 'Design sobrancelha egípcia' },
  { nome: 'Sobrancelha Pinça', preco: 40.00, duracao: 30, show_on_home: false, is_active: true, display_order: 16, descricao: 'Sobrancelha com pinça' },
  { nome: 'Limpeza de Pele', preco: 120.00, duracao: 60, show_on_home: false, is_active: true, display_order: 17, descricao: 'Limpeza de pele facial' },
  { nome: 'Revitalização Facial', preco: 110.00, duracao: 60, show_on_home: false, is_active: true, display_order: 18, descricao: 'Tratamento revitalizante facial' },
  { nome: 'Detox com Manta + Massagem', preco: 210.00, duracao: 120, show_on_home: false, is_active: true, display_order: 19, descricao: 'Detox completo com manta térmica e massagem' },
  { nome: 'Detox Corporal com Manta Térmica', preco: 120.00, duracao: 60, show_on_home: false, is_active: true, display_order: 20, descricao: 'Detox corporal com manta' },
  { nome: 'Drenagem Linfática', preco: 120.00, duracao: 90, show_on_home: false, is_active: true, display_order: 21, descricao: 'Massagem de drenagem linfática' },
  { nome: 'Massagem Desportiva', preco: 120.00, duracao: 90, show_on_home: false, is_active: true, display_order: 22, descricao: 'Massagem para atletas' },
  { nome: 'Massagem Relaxante', preco: 120.00, duracao: 90, show_on_home: false, is_active: true, display_order: 23, descricao: 'Massagem relaxante completa' },
  { nome: 'Massagem Podal', preco: 60.00, duracao: 60, show_on_home: false, is_active: true, display_order: 24, descricao: 'Massagem nos pés' },
  { nome: 'Quick Massage', preco: 35.00, duracao: 30, show_on_home: false, is_active: true, display_order: 25, descricao: 'Massagem rápida' },
  { nome: 'Spa dos Pés', preco: 80.00, duracao: 60, show_on_home: false, is_active: true, display_order: 26, descricao: 'Tratamento completo para os pés' },
  { nome: 'Tonalização Barba', preco: 80.00, duracao: 60, show_on_home: false, is_active: true, display_order: 27, descricao: 'Tonalização para barba' },
  { nome: 'Tonalização Cabelo', preco: 80.00, duracao: 60, show_on_home: false, is_active: true, display_order: 28, descricao: 'Tonalização capilar' },
  { nome: 'Alisamento + Corte', preco: 140.00, duracao: 90, show_on_home: false, is_active: true, display_order: 29, descricao: 'Combo alisamento e corte' },
  { nome: 'Alisamento EUA', preco: 100.00, duracao: 60, show_on_home: false, is_active: true, display_order: 30, descricao: 'Alisamento estilo americano' },
  { nome: 'Barba + Sobrancelha', preco: 70.00, duracao: 30, show_on_home: false, is_active: true, display_order: 31, descricao: 'Combo barba e sobrancelha' },
  { nome: 'Barba + Tonalização', preco: 110.00, duracao: 60, show_on_home: false, is_active: true, display_order: 32, descricao: 'Combo barba e tonalização' },
  { nome: 'Barbaterapia', preco: 80.00, duracao: 30, show_on_home: false, is_active: true, display_order: 33, descricao: 'Tratamento especial para barba' },
  { nome: 'Pezinho', preco: 20.00, duracao: 30, show_on_home: true, is_active: true, display_order: 34, descricao: 'Acabamento pezinho' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log('🌱 ═══════════════════════════════════════════════════════════');
    log('🌱 SEED DE SERVIÇOS - BARBEARIA COSTA URBANA');
    log('🌱 ═══════════════════════════════════════════════════════════');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const result: SeedResult = { 
      success: false, 
      logs,
      data: {
        servicesRemoved: 0,
        servicesInserted: 0,
        homeServices: [],
        barberLinks: 0,
      }
    };

    // ═══════════════════════════════════════════════════════════════
    // PASSO 1: Verificar e remover serviços existentes
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 1: Verificando serviços existentes...');
    
    const { data: existingServices, error: fetchError } = await supabaseClient
      .from('painel_servicos')
      .select('id, nome');

    if (fetchError) {
      throw new Error(`Erro ao buscar serviços existentes: ${fetchError.message}`);
    }

    const existingCount = existingServices?.length || 0;
    log(`   → Encontrados ${existingCount} serviços no banco`);

    if (existingCount > 0) {
      log('   → Removendo serviços antigos...');
      
      // Remover vínculos de serviços extras primeiro (se houver)
      await supabaseClient
        .from('appointment_extra_services')
        .delete()
        .in('service_id', existingServices.map(s => s.id));
      
      // Remover mapeamentos de serviços (se houver)
      await supabaseClient
        .from('service_id_mapping')
        .delete()
        .in('painel_servicos_id', existingServices.map(s => s.id));

      // Agora remover os serviços
      const { error: deleteError } = await supabaseClient
        .from('painel_servicos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        throw new Error(`Erro ao remover serviços: ${deleteError.message}`);
      }

      result.data!.servicesRemoved = existingCount;
      log(`   ✅ ${existingCount} serviços removidos com sucesso`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASSO 2: Inserir novos serviços
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 2: Inserindo novos serviços...');
    log(`   → Total de serviços a inserir: ${SERVICES_DATA.length}`);

    const { data: insertedServices, error: insertError } = await supabaseClient
      .from('painel_servicos')
      .insert(SERVICES_DATA.map(service => ({
        nome: service.nome,
        preco: service.preco,
        duracao: service.duracao,
        show_on_home: service.show_on_home,
        is_active: service.is_active,
        display_order: service.display_order,
        descricao: service.descricao,
      })))
      .select();

    if (insertError) {
      throw new Error(`Erro ao inserir serviços: ${insertError.message}`);
    }

    result.data!.servicesInserted = insertedServices?.length || 0;
    log(`   ✅ ${result.data!.servicesInserted} serviços inseridos com sucesso`);

    // Listar serviços na Home
    const homeServices = SERVICES_DATA.filter(s => s.show_on_home).map(s => s.nome);
    result.data!.homeServices = homeServices;
    log(`   → Serviços visíveis na Home (${homeServices.length}):`);
    homeServices.forEach(name => log(`      • ${name}`));

    // ═══════════════════════════════════════════════════════════════
    // PASSO 3: Buscar barbeiros ativos
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 3: Buscando barbeiros ativos...');

    const { data: barbers, error: barbersError } = await supabaseClient
      .from('staff')
      .select('id, name')
      .eq('role', 'barber')
      .eq('is_active', true);

    if (barbersError) {
      log(`   ⚠️ Erro ao buscar barbeiros: ${barbersError.message}`);
    } else {
      log(`   → Encontrados ${barbers?.length || 0} barbeiros ativos:`);
      barbers?.forEach(barber => log(`      • ${barber.name} (${barber.id})`));
    }

    // ═══════════════════════════════════════════════════════════════
    // PASSO 4: Criar vínculos barbeiros-serviços (se tabela existir)
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 4: Verificando vínculos barbeiros-serviços...');
    
    // Nota: No sistema atual, os barbeiros têm acesso a todos os serviços por padrão
    // Não há tabela de vínculo específica barbeiro-serviço
    // Os serviços ficam disponíveis automaticamente para agendamento
    
    log('   → Sistema configurado para todos os barbeiros terem acesso a todos os serviços');
    result.data!.barberLinks = (barbers?.length || 0) * (insertedServices?.length || 0);
    log(`   ✅ ${result.data!.barberLinks} vínculos implícitos criados`);

    // ═══════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ═══════════════════════════════════════════════════════════════
    log('\n🎉 ═══════════════════════════════════════════════════════════');
    log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    log('🎉 ═══════════════════════════════════════════════════════════');
    log(`   📊 Serviços removidos: ${result.data!.servicesRemoved}`);
    log(`   📊 Serviços inseridos: ${result.data!.servicesInserted}`);
    log(`   📊 Serviços na Home: ${result.data!.homeServices.length}`);
    log(`   📊 Barbeiros ativos: ${barbers?.length || 0}`);
    log(`   📊 Vínculos criados: ${result.data!.barberLinks}`);

    result.success = true;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log(`\n💥 ERRO: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        logs,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
