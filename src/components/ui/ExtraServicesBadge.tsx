import React from 'react';
import { Plus, Package, Scissors } from 'lucide-react';

interface ExtraItem {
  id?: string;
  produto_id?: string;
  nome: string;
  preco: number;
  duracao?: number;
  quantidade?: number;
  tipo?: 'produto' | string;
}

interface ExtraServicesBadgeProps {
  extras: ExtraItem[] | null | undefined;
  /** 'dark' for barber/totem panels, 'light' for admin panel */
  variant?: 'dark' | 'light';
  /** Show compact (just count) or full (list names) */
  compact?: boolean;
}

const ExtraServicesBadge: React.FC<ExtraServicesBadgeProps> = ({ 
  extras, 
  variant = 'dark',
  compact = false 
}) => {
  if (!extras || !Array.isArray(extras) || extras.length === 0) return null;

  // Split services vs products
  const products = extras.filter((e) => e.tipo === 'produto');
  const services = extras.filter((e) => e.tipo !== 'produto');

  // Aggregate services by name (client bookings expand quantity into duplicate entries)
  const serviceMap = new Map<string, { nome: string; preco: number; qty: number }>();
  for (const s of services) {
    const key = (s.id || s.nome || '') + '';
    const prev = serviceMap.get(key);
    if (prev) {
      prev.qty += 1;
    } else {
      serviceMap.set(key, { nome: s.nome, preco: Number(s.preco) || 0, qty: 1 });
    }
  }
  const serviceList = Array.from(serviceMap.values());

  const productList = products.map((p) => ({
    nome: p.nome,
    preco: Number(p.preco) || 0,
    qty: Number(p.quantidade) || 1,
  }));

  const totalServices = serviceList.reduce((s, i) => s + i.preco * i.qty, 0);
  const totalProducts = productList.reduce((s, i) => s + i.preco * i.qty, 0);
  const totalExtra = totalServices + totalProducts;

  if (compact) {
    const svcNames = serviceList.map((s) => (s.qty > 1 ? `${s.qty}× ${s.nome}` : s.nome));
    const prodNames = productList.map((p) => (p.qty > 1 ? `${p.qty}× ${p.nome}` : p.nome));
    const parts = [...svcNames, ...prodNames].filter(Boolean);
    const names = parts.join(', ');
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          variant === 'dark'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}
        title={`+ R$ ${totalExtra.toFixed(2)}`}
      >
        <Plus className="h-2.5 w-2.5" />
        {names || `${extras.length} item${extras.length > 1 ? 'ns' : ''}`}
      </span>
    );
  }

  return (
    <div className={`rounded-lg p-2 space-y-1 ${
      variant === 'dark' 
        ? 'bg-emerald-500/10 border border-emerald-500/20' 
        : 'bg-emerald-50 border border-emerald-200'
    }`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
        variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
      }`}>
        <Plus className="h-3 w-3" />
        Serviços Extras
      </div>
      {serviceList.map((s, idx) => (
        <div key={`svc-${idx}`} className="flex items-center justify-between text-xs">
          <span className={`inline-flex items-center gap-1 ${variant === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}`}>
            <Scissors className="h-3 w-3 opacity-70" />
            {s.qty > 1 ? `${s.qty}× ` : ''}{s.nome}
          </span>
          <span className={`font-semibold ${variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
            R$ {(s.preco * s.qty).toFixed(2)}
          </span>
        </div>
      ))}
      {productList.length > 0 && (
        <div className={`pt-1 mt-1 border-t ${variant === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${variant === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
            <Package className="h-3 w-3" />
            Produtos
          </div>
          {productList.map((p, idx) => (
            <div key={`prd-${idx}`} className="flex items-center justify-between text-xs">
              <span className={variant === 'dark' ? 'text-blue-300' : 'text-blue-800'}>
                {p.qty > 1 ? `${p.qty}× ` : ''}{p.nome}
              </span>
              <span className={`font-semibold ${variant === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                R$ {(p.preco * p.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className={`flex items-center justify-between text-xs pt-1 border-t ${
        variant === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200'
      }`}>
        <span className={`font-bold ${variant === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}`}>
          Total adicionais
        </span>
        <span className={`font-bold ${variant === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
          + R$ {totalExtra.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ExtraServicesBadge;
