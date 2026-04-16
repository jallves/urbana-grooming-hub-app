import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, CreditCard, Users, Scissors, ShoppingBag, Coffee, Crown, BarChart3, ClipboardList, Receipt, Wallet } from 'lucide-react';
import RelatorioPagamentos from './RelatorioPagamentos';
import RelatorioBarbeiros from './RelatorioBarbeiros';
import RelatorioServicos from './RelatorioServicos';
import RelatorioProdutos from './RelatorioProdutos';
import RelatorioAssinaturas from './RelatorioAssinaturas';
import RelatorioCafe from './RelatorioCafe';
import RelatorioResumo from './RelatorioResumo';
import RelatorioAnalitico from './RelatorioAnalitico';
import RelatorioContasPagar from './RelatorioContasPagar';

const TAB_CONFIGS = [
  { value: 'resumo', label: 'Resumo', icon: BarChart3, bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', activeBg: 'bg-slate-600', activeHex: '#475569' },
  { value: 'pagamentos', label: 'Pagamentos', icon: CreditCard, bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', activeBg: 'bg-emerald-600', activeHex: '#059669' },
  { value: 'barbeiros', label: 'Barbeiros', icon: Users, bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', activeBg: 'bg-blue-600', activeHex: '#2563eb' },
  { value: 'servicos', label: 'Serviços', icon: Scissors, bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', activeBg: 'bg-violet-600', activeHex: '#7c3aed' },
  { value: 'produtos', label: 'Produtos', icon: ShoppingBag, bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', activeBg: 'bg-orange-600', activeHex: '#ea580c' },
  { value: 'assinaturas', label: 'Assinaturas', icon: Crown, bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', activeBg: 'bg-purple-600', activeHex: '#9333ea' },
  { value: 'cafe', label: 'Café', icon: Coffee, bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', activeBg: 'bg-amber-600', activeHex: '#d97706' },
  { value: 'analitico', label: 'Analítico (Receber)', icon: ClipboardList, bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', activeBg: 'bg-teal-600', activeHex: '#0d9488' },
  { value: 'contas-pagar', label: 'Analítico (Pagar)', icon: Wallet, bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', activeBg: 'bg-rose-600', activeHex: '#e11d48' },
];

const RelatoriosGerenciais: React.FC = () => {
  const now = new Date();
  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [ano, setAno] = useState(now.getFullYear().toString());

  const meses = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];
  const anos = Array.from({ length: 11 }, (_, i) => (2025 + i).toString());

  const filters = { mes: parseInt(mes), ano: parseInt(ano) };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-white border-gray-300">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-32 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {meses.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-24 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {anos.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-white border border-gray-200 p-1.5 gap-1.5 rounded-xl justify-start">
          {TAB_CONFIGS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4 lg:px-5 py-2 rounded-lg border transition-all font-medium whitespace-nowrap
                ${tab.bg} ${tab.border} ${tab.text}
                data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-md`}
              ref={(el) => {
                if (!el) return;
                const observer = new MutationObserver(() => {
                  const isActive = el.getAttribute('data-state') === 'active';
                  if (isActive) {
                    el.style.backgroundColor = tab.activeHex;
                    el.style.color = '#ffffff';
                    el.style.borderColor = 'transparent';
                  } else {
                    el.style.backgroundColor = '';
                    el.style.color = '';
                    el.style.borderColor = '';
                  }
                });
                observer.observe(el, { attributes: true, attributeFilter: ['data-state'] });
                const isActive = el.getAttribute('data-state') === 'active';
                if (isActive) {
                  el.style.backgroundColor = tab.activeHex;
                  el.style.color = '#ffffff';
                  el.style.borderColor = 'transparent';
                }
              }}
            >
              <tab.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              {/* Mobile: rótulo curto / Desktop: rótulo completo */}
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.label.split(' ')[0].slice(0, 6)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo" className="mt-4"><RelatorioResumo filters={filters} /></TabsContent>
        <TabsContent value="pagamentos" className="mt-4"><RelatorioPagamentos filters={filters} /></TabsContent>
        <TabsContent value="barbeiros" className="mt-4"><RelatorioBarbeiros filters={filters} /></TabsContent>
        <TabsContent value="servicos" className="mt-4"><RelatorioServicos filters={filters} /></TabsContent>
        <TabsContent value="produtos" className="mt-4"><RelatorioProdutos filters={filters} /></TabsContent>
        <TabsContent value="assinaturas" className="mt-4"><RelatorioAssinaturas filters={filters} /></TabsContent>
        <TabsContent value="cafe" className="mt-4"><RelatorioCafe filters={filters} /></TabsContent>
        <TabsContent value="analitico" className="mt-4"><RelatorioAnalitico filters={filters} /></TabsContent>
        <TabsContent value="contas-pagar" className="mt-4"><RelatorioContasPagar filters={filters} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosGerenciais;
