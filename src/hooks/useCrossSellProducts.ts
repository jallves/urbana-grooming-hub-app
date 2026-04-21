import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CrossSellProduct {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url: string | null;
  descricao: string | null;
}

// Palavras-chave que indicam produto de estética/cuidados (whitelist prioritária)
const ESTETICA_KEYWORDS = [
  'balm', 'pomada', 'shampoo', 'xampu', 'condicionador', 'loção', 'locao',
  'óleo', 'oleo', 'gel', 'cera', 'barba', 'cabelo', 'creme', 'tônico', 'tonico',
  'pós-barba', 'pos-barba', 'aftershave', 'after shave', 'hidratante',
  'finalizador', 'modelador', 'mascara', 'máscara', 'spray', 'perfume', 'colônia', 'colonia'
];

// Palavras-chave que indicam bebidas/snacks (blacklist)
const BEBIDA_KEYWORDS = [
  'cerveja', 'refrigerante', 'água', 'agua', 'energético', 'energetico',
  'whey', 'yopro', 'suco', 'café', 'cafe', 'capuccino', 'cappuccino',
  'toddynho', 'achocolatado', 'chá', 'cha', 'isotônico', 'isotonico', 'leite', 'coca', 'guaraná', 'guarana'
];

const isEstetica = (nome: string) => {
  const n = nome.toLowerCase();
  if (BEBIDA_KEYWORDS.some(k => n.includes(k))) return false;
  return ESTETICA_KEYWORDS.some(k => n.includes(k));
};

const isBebida = (nome: string) => {
  const n = nome.toLowerCase();
  return BEBIDA_KEYWORDS.some(k => n.includes(k));
};

const parseImagem = (raw: any): string | null => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        return Array.isArray(arr) ? arr[0] || null : trimmed;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  return null;
};

export const useCrossSellProducts = (limit: number = 3) => {
  const [products, setProducts] = useState<CrossSellProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Busca produtos ativos + ranking de mais vendidos em paralelo
        const [productsRes, salesRes] = await Promise.all([
          supabase
            .from('painel_produtos')
            .select('id, nome, preco, estoque, imagem_url, descricao')
            .eq('ativo', true)
            .gt('estoque', 0)
            .gt('preco', 0),
          supabase
            .from('vendas_itens')
            .select('item_id, quantidade')
            .eq('tipo', 'produto')
            .limit(2000),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (cancelled) return;

        // Ranking de vendas por produto
        const salesRank = new Map<string, number>();
        (salesRes.data || []).forEach((row: any) => {
          if (!row.item_id) return;
          salesRank.set(row.item_id, (salesRank.get(row.item_id) || 0) + (Number(row.quantidade) || 1));
        });

        const all = (productsRes.data || []).map(p => ({
          id: p.id,
          nome: p.nome,
          preco: Number(p.preco) || 0,
          estoque: Number(p.estoque) || 0,
          imagem_url: parseImagem(p.imagem_url),
          descricao: p.descricao,
          _sales: salesRank.get(p.id) || 0,
        }));

        // 1. PRIORIDADE: produtos de estética/cuidados (ordenados por mais vendidos)
        const estetica = all
          .filter(p => isEstetica(p.nome))
          .sort((a, b) => b._sales - a._sales || b.estoque - a.estoque);

        // 2. COMPLEMENTO: TOP mais vendidos de qualquer tipo (não-estética, não-bebida)
        const outrosTopVendidos = all
          .filter(p => !isEstetica(p.nome) && !isBebida(p.nome))
          .sort((a, b) => b._sales - a._sales || b.estoque - a.estoque);

        // 3. ÚLTIMO RECURSO: bebidas/snacks também por mais vendidos (caso ainda falte)
        const bebidas = all
          .filter(p => isBebida(p.nome) && !isEstetica(p.nome))
          .sort((a, b) => b._sales - a._sales || b.estoque - a.estoque);

        // Preenche até o limit: estética primeiro, depois outros mais vendidos, depois bebidas
        const selected: CrossSellProduct[] = [];
        const seen = new Set<string>();
        for (const p of [...estetica, ...outrosTopVendidos, ...bebidas]) {
          if (selected.length >= limit) break;
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          const { _sales, ...rest } = p as any;
          selected.push(rest);
        }

        setProducts(selected);
      } catch (err) {
        console.error('[useCrossSellProducts] Erro ao carregar:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { products, loading };
};