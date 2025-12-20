import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  estoque_minimo: number;
  categoria: string;
  imagens: string[];
  is_active: boolean;
  destaque: boolean;
  commission_percentage: number;
}

// Lista dos 6 produtos mais vendidos em barbearias com preços de mercado
const PRODUCTS_DATA: ProductData[] = [
  {
    nome: 'Pomada Modeladora Premium',
    descricao: 'Pomada profissional de alta fixação com acabamento matte. Ideal para criar penteados modernos e estilosos que duram o dia todo. Fórmula não oleosa.',
    preco: 45.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Finalizadores',
    imagens: ['/products/pomada-modeladora.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
  {
    nome: 'Óleo para Barba',
    descricao: 'Óleo hidratante premium para barba com blend de óleos essenciais. Amacia os fios, reduz coceira e deixa a barba com brilho saudável. Fragrância amadeirada.',
    preco: 55.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Barba',
    imagens: ['/products/oleo-barba.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
  {
    nome: 'Pós-Barba Hidratante',
    descricao: 'Bálsamo pós-barba que acalma e hidrata a pele após o barbear. Fórmula com aloe vera e vitamina E. Previne irritações e deixa a pele macia.',
    preco: 38.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Barba',
    imagens: ['/products/pos-barba.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
  {
    nome: 'Shampoo Cabelo e Barba',
    descricao: 'Shampoo 2 em 1 desenvolvido especialmente para homens. Limpa profundamente cabelo e barba, sem ressecar. Fórmula com mentol refrescante.',
    preco: 42.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Cabelo',
    imagens: ['/products/shampoo-cabelo-barba.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
  {
    nome: 'Cera Capilar Matte',
    descricao: 'Cera modeladora de alta performance com efeito matte natural. Fixação forte e flexível, permite retoques ao longo do dia. Não deixa resíduos.',
    preco: 48.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Finalizadores',
    imagens: ['/products/cera-capilar.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
  {
    nome: 'Balm para Barba',
    descricao: 'Bálsamo nutritivo que modela e hidrata a barba. Controla fios rebeldes e proporciona fixação leve. Enriquecido com manteiga de karité.',
    preco: 52.00,
    estoque: 100,
    estoque_minimo: 10,
    categoria: 'Barba',
    imagens: ['/products/balm-barba.jpg'],
    is_active: true,
    destaque: true,
    commission_percentage: 15,
  },
];

Deno.serve(async (req) => {
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
    log('🌱 SEED DE PRODUTOS - BARBEARIA COSTA URBANA');
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

    // ═══════════════════════════════════════════════════════════════
    // PASSO 1: Verificar e remover produtos existentes
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 1: Verificando produtos existentes...');
    
    const { data: existingProducts, error: fetchError } = await supabaseClient
      .from('painel_produtos')
      .select('id, nome');

    if (fetchError) {
      throw new Error(`Erro ao buscar produtos existentes: ${fetchError.message}`);
    }

    const existingCount = existingProducts?.length || 0;
    log(`   → Encontrados ${existingCount} produtos no banco`);

    let productsRemoved = 0;
    if (existingCount > 0) {
      log('   → Removendo produtos antigos...');
      
      // Remover vendas relacionadas primeiro (se houver)
      await supabaseClient
        .from('totem_product_sales')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Agora remover os produtos
      const { error: deleteError } = await supabaseClient
        .from('painel_produtos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        throw new Error(`Erro ao remover produtos: ${deleteError.message}`);
      }

      productsRemoved = existingCount;
      log(`   ✅ ${productsRemoved} produtos removidos com sucesso`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASSO 2: Inserir novos produtos
    // ═══════════════════════════════════════════════════════════════
    log('\n📋 PASSO 2: Inserindo novos produtos...');
    log(`   → Total de produtos a inserir: ${PRODUCTS_DATA.length}`);

    const { data: insertedProducts, error: insertError } = await supabaseClient
      .from('painel_produtos')
      .insert(PRODUCTS_DATA.map(product => ({
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco,
        estoque: product.estoque,
        estoque_minimo: product.estoque_minimo,
        categoria: product.categoria,
        imagens: product.imagens,
        is_active: product.is_active,
        destaque: product.destaque,
        commission_percentage: product.commission_percentage,
      })))
      .select();

    if (insertError) {
      throw new Error(`Erro ao inserir produtos: ${insertError.message}`);
    }

    const productsInserted = insertedProducts?.length || 0;
    log(`   ✅ ${productsInserted} produtos inseridos com sucesso`);

    // Listar produtos inseridos
    log('\n📦 Produtos cadastrados:');
    PRODUCTS_DATA.forEach((p, i) => {
      log(`   ${i + 1}. ${p.nome} - R$ ${p.preco.toFixed(2)} (${p.estoque} un.)`);
    });

    // ═══════════════════════════════════════════════════════════════
    // RESUMO FINAL
    // ═══════════════════════════════════════════════════════════════
    log('\n🎉 ═══════════════════════════════════════════════════════════');
    log('🎉 SEED DE PRODUTOS CONCLUÍDO COM SUCESSO!');
    log('🎉 ═══════════════════════════════════════════════════════════');
    log(`   📊 Produtos removidos: ${productsRemoved}`);
    log(`   📊 Produtos inseridos: ${productsInserted}`);
    log(`   📊 Estoque total: ${PRODUCTS_DATA.reduce((acc, p) => acc + p.estoque, 0)} unidades`);
    log(`   📊 Valor total em estoque: R$ ${PRODUCTS_DATA.reduce((acc, p) => acc + (p.preco * p.estoque), 0).toFixed(2)}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        productsRemoved,
        productsInserted,
        products: PRODUCTS_DATA.map(p => ({ nome: p.nome, preco: p.preco, estoque: p.estoque })),
      },
      logs,
    }), {
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
