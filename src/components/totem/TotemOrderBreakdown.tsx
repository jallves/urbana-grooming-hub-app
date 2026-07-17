import React from 'react';
import { Scissors, Plus, Package, Receipt } from 'lucide-react';

interface ExtraItem {
  id?: string;
  produto_id?: string;
  nome: string;
  preco: number;
  duracao?: number;
  quantidade?: number;
  tipo?: 'produto' | string;
}

interface Props {
  mainServiceName?: string | null;
  mainServicePrice?: number | null;
  mainQuantity?: number;
  extras?: ExtraItem[] | null;
  discount?: number | null;
  className?: string;
  compact?: boolean;
}

const money = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

/**
 * Resumo didático (tema escuro do Totem) do pedido do agendamento.
 * Mostra serviço principal, serviços extras (com quantidade), produtos e TOTAL.
 */
const TotemOrderBreakdown: React.FC<Props> = ({
  mainServiceName,
  mainServicePrice,
  mainQuantity = 1,
  extras,
  discount,
  className = '',
  compact = false,
}) => {
  const list = Array.isArray(extras) ? extras : [];
  const products = list.filter((e) => e.tipo === 'produto' || (e as any).produto_id);
  const services = list.filter((e) => !(e.tipo === 'produto' || (e as any).produto_id));

  const svcMap = new Map<string, { nome: string; preco: number; qty: number }>();
  for (const s of services) {
    const key = (s.id || s.nome || '') + '';
    const prev = svcMap.get(key);
    if (prev) prev.qty += 1;
    else svcMap.set(key, { nome: s.nome, preco: Number(s.preco) || 0, qty: 1 });
  }
  const serviceList = Array.from(svcMap.values());
  const productList = products.map((p) => ({
    nome: p.nome,
    preco: Number(p.preco) || 0,
    qty: Math.max(1, Number(p.quantidade) || 1),
  }));

  const mainPrice = Number(mainServicePrice || 0);
  const mainQty = Math.max(1, Number(mainQuantity) || 1);
  const mainSubtotal = mainPrice * mainQty;
  const svcTotal = serviceList.reduce((s, i) => s + i.preco * i.qty, 0);
  const prodTotal = productList.reduce((s, i) => s + i.preco * i.qty, 0);
  const desc = Math.max(0, Number(discount || 0));
  const grandTotal = Math.max(0, mainSubtotal + svcTotal + prodTotal - desc);

  const pad = compact ? 'px-3 py-2' : 'px-4 py-3';
  const titleSize = compact ? 'text-[10px]' : 'text-xs';
  const itemSize = compact ? 'text-sm' : 'text-base';

  return (
    <div
      className={`rounded-xl border-2 border-urbana-gold/30 bg-urbana-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {mainServiceName && (
        <div className={`${pad} border-b border-urbana-gold/20`}>
          <div
            className={`flex items-center gap-1.5 ${titleSize} font-bold uppercase tracking-wider text-urbana-gold mb-1`}
          >
            <Scissors className="h-3.5 w-3.5" /> Serviço principal
          </div>
          <div className={`flex items-start justify-between gap-2 ${itemSize}`}>
            <div className="text-urbana-light font-medium">
              {mainQty}× {mainServiceName}
              <div className="text-[11px] text-urbana-light/50 font-normal">
                {mainQty} × {money(mainPrice)}
              </div>
            </div>
            <div className="font-semibold text-urbana-gold whitespace-nowrap">
              {money(mainSubtotal)}
            </div>
          </div>
        </div>
      )}

      {serviceList.length > 0 && (
        <div className={`${pad} border-b border-urbana-gold/20`}>
          <div
            className={`flex items-center gap-1.5 ${titleSize} font-bold uppercase tracking-wider text-blue-300 mb-1`}
          >
            <Plus className="h-3.5 w-3.5" /> Serviços extras
          </div>
          <ul className="space-y-1">
            {serviceList.map((s, i) => (
              <li
                key={`s-${i}`}
                className={`flex items-start justify-between gap-2 ${itemSize}`}
              >
                <div className="text-urbana-light/90">
                  {s.qty}× {s.nome}
                  <div className="text-[11px] text-urbana-light/50">
                    {s.qty} × {money(s.preco)}
                  </div>
                </div>
                <div className="font-semibold text-blue-300 whitespace-nowrap">
                  {money(s.preco * s.qty)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {productList.length > 0 && (
        <div className={`${pad} border-b border-urbana-gold/20`}>
          <div
            className={`flex items-center gap-1.5 ${titleSize} font-bold uppercase tracking-wider text-amber-300 mb-1`}
          >
            <Package className="h-3.5 w-3.5" /> Produtos
          </div>
          <ul className="space-y-1">
            {productList.map((p, i) => (
              <li
                key={`p-${i}`}
                className={`flex items-start justify-between gap-2 ${itemSize}`}
              >
                <div className="text-urbana-light/90">
                  {p.qty}× {p.nome}
                  <div className="text-[11px] text-urbana-light/50">
                    {p.qty} × {money(p.preco)}
                  </div>
                </div>
                <div className="font-semibold text-amber-300 whitespace-nowrap">
                  {money(p.preco * p.qty)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${pad} flex items-center justify-between bg-urbana-gold/10`}>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-urbana-light">
          <Receipt className="h-4 w-4 text-urbana-gold" /> Total a cobrar
        </div>
        <div className="font-extrabold text-base text-urbana-gold whitespace-nowrap">
          {money(grandTotal)}
        </div>
      </div>
    </div>
  );
};

export default TotemOrderBreakdown;