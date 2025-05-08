
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Badge } from '@/components/ui/badge';

const mockInventoryData = [
  { name: 'Shampoo Profissional', stock: 28, minStock: 10, maxStock: 50, category: 'Cabelo' },
  { name: 'Condicionador Hidratante', stock: 22, minStock: 10, maxStock: 50, category: 'Cabelo' },
  { name: 'Óleo para Barba', stock: 15, minStock: 15, maxStock: 40, category: 'Barba' },
  { name: 'Pomada Modeladora', stock: 8, minStock: 12, maxStock: 30, category: 'Styling' },
  { name: 'Cera para Cabelo', stock: 5, minStock: 10, maxStock: 25, category: 'Styling' },
  { name: 'Balm Pós-Barba', stock: 18, minStock: 8, maxStock: 30, category: 'Barba' },
  { name: 'Tesoura Profissional', stock: 6, minStock: 5, maxStock: 15, category: 'Equipamento' },
  { name: 'Máquina de Corte', stock: 4, minStock: 3, maxStock: 10, category: 'Equipamento' },
];

const mockSalesData = [
  { month: 'Jan', sales: 32 },
  { month: 'Fev', sales: 38 },
  { month: 'Mar', sales: 30 },
  { month: 'Abr', sales: 35 },
  { month: 'Mai', sales: 40 },
  { month: 'Jun', sales: 45 },
];

const mockCategoryData = [
  { name: 'Cabelo', value: 42 },
  { name: 'Barba', value: 28 },
  { name: 'Styling', value: 18 },
  { name: 'Equipamento', value: 12 },
];

const InventoryReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status do Estoque</CardTitle>
          <CardDescription>
            Situação atual dos produtos em estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Produto</th>
                  <th className="text-left py-3 px-2">Categoria</th>
                  <th className="text-left py-3 px-2">Estoque Atual</th>
                  <th className="text-left py-3 px-2">Estoque Mínimo</th>
                  <th className="text-left py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockInventoryData.map((item, index) => {
                  let status = "default";
                  let statusText = "Normal";
                  
                  if (item.stock <= item.minStock) {
                    status = "destructive";
                    statusText = "Baixo";
                  } else if (item.stock >= item.maxStock) {
                    status = "success";
                    statusText = "Excesso";
                  }
                  
                  return (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{item.name}</td>
                      <td className="py-3 px-2">{item.category}</td>
                      <td className="py-3 px-2">{item.stock} unid.</td>
                      <td className="py-3 px-2">{item.minStock} unid.</td>
                      <td className="py-3 px-2">
                        <Badge variant={status}>
                          {statusText}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas de Produtos (Unidades)</CardTitle>
            <CardDescription>
              Evolução das vendas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mockSalesData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name="Unidades Vendidas" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Produtos em estoque por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockCategoryData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Quantidade" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Métricas de Estoque</CardTitle>
          <CardDescription>
            Principais indicadores de gestão de inventário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Giro de Estoque</div>
              <div className="text-2xl font-bold">4.8x</div>
              <div className="text-xs text-green-600 mt-1">▲ 0.3 em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Produtos com Estoque Baixo</div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-red-600 mt-1">▲ 2 em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Valor do Inventário</div>
              <div className="text-2xl font-bold">R$ 12.450</div>
              <div className="text-xs text-green-600 mt-1">▲ 5% em relação ao mês anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReports;
