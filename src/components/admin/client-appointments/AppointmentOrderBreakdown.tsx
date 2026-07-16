import React from 'react';
import { Scissors, Plus, Package, Ticket, Receipt } from 'lucide-react';

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
  mainQuantity?: number; // default 1
  extras?: ExtraItem[] | null;
  couponCode?: string | null;
  discount?: number | null;
  className?: string;
}

const money = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

/**
 * Resumo didático do pedido usado nos cards do painel de agendamentos.
 * Mostra serviço principal (com quantidade), extras agregados por nome,
 * produtos com quantidade, desconto de cupom e TOTAL GERAL destacado.
 */
const AppointmentOrderBreakdown: React.FC<Props> = ({
  mainServiceName,
  mainServicePrice,
  mainQuantity = 1,
  extras,
  couponCode,
  discount,
  className = '',
}) => {
  const list = Array.isArray(extras) ? extras : [];
  const products = list.filter((e) => e.tipo === 'produto');
  const services = list.filter((e) => e.tipo !== 'produto');

  // Agrega serviços repetidos por id/nome
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

  return (
    <div className={`rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* Serviço principal */}
      {mainServiceName && (
        <div className="px-3 py-2 bg-emerald-50/60 border-b border-emerald-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Scissors className="h-3 w-3" /> Serviço Principal
          </div>
          <div className="flex items-start justify-between gap-2 text-xs">
            <div className="text-gray-900 font-medium">
              {mainQty}× {mainServiceName}
              <div className="text-[10px] text-gray-500 font-normal">
                {mainQty} × {money(mainPrice)}
              </div>
            </div>
            <div className="font-semibold text-emerald-700 whitespace-nowrap">
              {money(mainSubtotal)}
            </div>
          </div>
        </div>
      )}

      {/* Serviços extras */}
      {serviceList.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
            <Plus className="h-3 w-3" /> Serviços Extras
          </div>
          <ul className="space-y-1">
            {serviceList.map((s, i) => (
              <li key={`s-${i}`} className="flex items-start justify-between gap-2 text-xs">
                <div className="text-gray-800">
                  {s.qty}× {s.nome}
                  <div className="text-[10px] text-gray-500">
                    {s.qty} × {money(s.preco)}
                  </div>
                </div>
                <div className="font-semibold text-blue-700 whitespace-nowrap">
                  {money(s.preco * s.qty)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Produtos */}
      {productList.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
            <Package className="h-3 w-3" /> Produtos
          </div>
          <ul className="space-y-1">
            {productList.map((p, i) => (
              <li key={`p-${i}`} className="flex items-start justify-between gap-2 text-xs">
                <div className="text-gray-800">
                  {p.qty}× {p.nome}
                  <div className="text-[10px] text-gray-500">
                    {p.qty} × {money(p.preco)}
                  </div>
                </div>
                <div className="font-semibold text-amber-700 whitespace-nowrap">
                  {money(p.preco * p.qty)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Desconto cupom */}
      {couponCode && desc > 0 && (
        <div className="px-3 py-2 flex items-center justify-between text-xs border-b border-gray-100 bg-green-50/60">
          <div className="inline-flex items-center gap-1 text-green-700 font-medium">
            <Ticket className="h-3 w-3" /> Cupom {couponCode}
          </div>
          <div className="font-semibold text-green-700 whitespace-nowrap">
            − {money(desc)}
          </div>
        </div>
      )}

      {/* Total geral */}
      <div className="px-3 py-2 flex items-center justify-between bg-gray-900 text-white">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
          <Receipt className="h-3.5 w-3.5 text-urbana-gold" /> Total a cobrar
        </div>
        <div className="font-extrabold text-sm text-urbana-gold whitespace-nowrap">
          {money(grandTotal)}
        </div>
      </div>
    </div>
  );
};

export default AppointmentOrderBreakdown;