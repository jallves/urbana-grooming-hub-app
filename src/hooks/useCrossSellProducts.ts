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
        const { data, error } = await supabase
          .from('painel_produtos')
          .select('id, nome, preco, estoque, imagem_url, descricao')
          .eq('ativo', true)
          .gt('estoque', 0)
          .gt('preco', 0)
          .order('estoque', { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        const all = (data || []).map(p => ({
          id: p.id,
          nome: p.nome,
          preco: Number(p.preco) || 0,
          estoque: Number(p.estoque) || 0,
          imagem_url: parseImagem(p.imagem_url),
          descricao: p.descricao,
        }));

        // 1. prioriza produtos de estética
        const estetica = all.filter(p => isEstetica(p.nome));
        // 2. fallback: produtos que não são bebidas
        const naoBebida = all.filter(p => !isBebida(p.nome) && !isEstetica(p.nome));

        const selected: CrossSellProduct[] = [];
        const seen = new Set<string>();
        for (const p of [...estetica, ...naoBebida]) {
          if (selected.length >= limit) break;
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          selected.push(p);
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