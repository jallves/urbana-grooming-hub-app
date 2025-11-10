import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedResult {
  success: boolean;
  data?: {
    client: any;
    service: any;
    product: any;
    employee: any;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🌱 Iniciando seed de dados de teste...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const result: SeedResult = { success: false };

    // 1. Criar Cliente
    console.log('📝 Criando cliente de teste...');
    const clientEmail = 'joao.silva@example.com';
    
    // Verificar se cliente já existe
    const { data: existingClient } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', clientEmail)
      .maybeSingle();

    let client;
    if (existingClient) {
      console.log('ℹ️ Cliente já existe, usando existente');
      client = existingClient;
    } else {
      const clientPassword = await bcrypt.hash('cliente123', 10);
      const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          name: 'João Silva',
          email: clientEmail,
          phone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          birth_date: '1990-05-15',
          password_hash: clientPassword,
        })
        .select()
        .single();

      if (clientError) {
        console.error('❌ Erro ao criar cliente:', clientError);
        throw new Error(`Erro ao criar cliente: ${clientError.message}`);
      }
      client = newClient;
      console.log('✅ Cliente criado:', client.id);
    }

    // 2. Criar Serviço
    console.log('📝 Criando serviço de teste...');
    const serviceName = 'Corte Premium';
    
    // Verificar se serviço já existe
    const { data: existingService } = await supabaseClient
      .from('painel_servicos')
      .select('id')
      .eq('nome', serviceName)
      .maybeSingle();

    let service;
    if (existingService) {
      console.log('ℹ️ Serviço já existe, usando existente');
      service = existingService;
    } else {
      const { data: newService, error: serviceError } = await supabaseClient
        .from('painel_servicos')
        .insert({
          nome: serviceName,
          descricao: 'Corte de cabelo premium com acabamento refinado',
          preco: 50.00,
          duracao: 45,
          is_active: true,
          show_on_home: true,
        })
        .select()
        .single();

      if (serviceError) {
        console.error('❌ Erro ao criar serviço:', serviceError);
        throw new Error(`Erro ao criar serviço: ${serviceError.message}`);
      }
      service = newService;
      console.log('✅ Serviço criado:', service.id);
    }

    // 3. Criar Produto
    console.log('📝 Criando produto de teste...');
    const productName = 'Pomada Modeladora';
    
    // Verificar se produto já existe
    const { data: existingProduct } = await supabaseClient
      .from('painel_produtos')
      .select('id')
      .eq('nome', productName)
      .maybeSingle();

    let product;
    if (existingProduct) {
      console.log('ℹ️ Produto já existe, usando existente');
      product = existingProduct;
    } else {
      const { data: newProduct, error: productError } = await supabaseClient
        .from('painel_produtos')
        .insert({
          nome: productName,
          descricao: 'Pomada profissional para modelagem e fixação',
          preco: 35.00,
          estoque: 50,
          estoque_minimo: 10,
          categoria: 'Finalizadores',
          is_active: true,
          destaque: true,
        })
        .select()
        .single();

      if (productError) {
        console.error('❌ Erro ao criar produto:', productError);
        throw new Error(`Erro ao criar produto: ${productError.message}`);
      }
      product = newProduct;
      console.log('✅ Produto criado:', product.id);
    }

    // 4. Criar Funcionário Barbeiro
    console.log('📝 Criando funcionário barbeiro de teste...');
    const employeeEmail = 'carlos.barbosa@barbershop.com';
    
    // Verificar se funcionário já existe
    const { data: existingEmployee } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('email', employeeEmail)
      .maybeSingle();

    let employee;
    if (existingEmployee) {
      console.log('ℹ️ Funcionário já existe, usando existente');
      employee = existingEmployee;
    } else {
      // Criar na tabela employees
      const { data: newEmployee, error: employeeError } = await supabaseClient
        .from('employees')
        .insert({
          name: 'Carlos Barbosa',
          email: employeeEmail,
          phone: '(11) 99876-5432',
          role: 'barber',
          status: 'active',
          commission_rate: 40.00,
        })
        .select()
        .single();

      if (employeeError) {
        console.error('❌ Erro ao criar funcionário:', employeeError);
        throw new Error(`Erro ao criar funcionário: ${employeeError.message}`);
      }
      employee = newEmployee;
      console.log('✅ Funcionário criado:', employee.id);

      // Verificar se já existe na tabela staff
      const { data: existingStaff } = await supabaseClient
        .from('staff')
        .select('id')
        .eq('email', employeeEmail)
        .maybeSingle();

      if (!existingStaff) {
        // Migrar para staff (barbeiro)
        const { error: staffError } = await supabaseClient
          .from('staff')
          .insert({
            name: 'Carlos Barbosa',
            email: employeeEmail,
            phone: '(11) 99876-5432',
            specialties: 'Cortes clássicos, Barbas, Degradês',
            experience: '5 anos',
            commission_rate: 40.00,
            role: 'barber',
            is_active: true,
          });

        if (staffError) {
          console.error('❌ Erro ao migrar barbeiro para staff:', staffError);
          throw new Error(`Erro ao migrar barbeiro: ${staffError.message}`);
        }
        console.log('✅ Barbeiro migrado para staff');
      } else {
        console.log('ℹ️ Barbeiro já existe na tabela staff');
      }
    }

    result.success = true;
    result.data = {
      client,
      service,
      product,
      employee,
    };

    console.log('🎉 Seed de dados concluído com sucesso!');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Erro no seed de dados:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
