import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, CreditCard, Users, ShoppingBag, Coffee, Crown, BarChart3 } from 'lucide-react';
import RelatorioPagamentos from './RelatorioPagamentos';
import RelatorioBarbeiros from './RelatorioBarbeiros';
import RelatorioServicos from './RelatorioServicos';
import RelatorioProdutos from './RelatorioProdutos';
import RelatorioAssinaturas from './RelatorioAssinaturas';
import RelatorioCafe from './RelatorioCafe';
import RelatorioResumo from './RelatorioResumo';

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
        <TabsList className="flex flex-wrap h-auto bg-gray-100 border border-gray-200 p-1 gap-1">
          {[
            { value: 'resumo', label: 'Resumo', icon: BarChart3 },
            { value: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
            { value: 'barbeiros', label: 'Barbeiros', icon: Users },
            { value: 'servicos', label: 'Serviços', icon: ShoppingBag },
            { value: 'produtos', label: 'Produtos', icon: ShoppingBag },
            { value: 'assinaturas', label: 'Assinaturas', icon: Crown },
            { value: 'cafe', label: 'Café', icon: Coffee },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
            >
              <tab.icon className="h-3.5 w-3.5 hidden sm:block" />
              {tab.label}
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
      </Tabs>
    </div>
  );
};

export default RelatoriosGerenciais;
