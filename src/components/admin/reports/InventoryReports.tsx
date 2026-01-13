import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  categoria: string | null;
  ativo: boolean;
}

const InventoryReports: React.FC = () => {
  // Fetch products data from painel_produtos
  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*');
      
      if (error) throw error;
      return (data || []) as Product[];
    }
  });

  // Process low stock products
  const lowStockProducts = React.useMemo(() => {
    if (!products) return [];
    
    return products
      .filter(product => (product.estoque || 0) < 10)
      .sort((a, b) => (a.estoque || 0) - (b.estoque || 0))
      .slice(0, 10);
  }, [products]);

  // Process inventory by category
  const categoryData = React.useMemo(() => {
    if (!products) return [];
    
    const categoryStats: Record<string, { productCount: number; totalValue: number }> = {};
    
    products.forEach(product => {
      const categoryName = product.categoria || 'Sem Categoria';
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { productCount: 0, totalValue: 0 };
      }
      
      categoryStats[categoryName].productCount++;
      categoryStats[categoryName].totalValue += (Number(product.preco) || 0) * (product.estoque || 0);
    });
    
    return Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      productCount: stats.productCount,
      totalValue: stats.totalValue
    }));
  }, [products]);

  // Process stock value distribution
  const stockValueData = React.useMemo(() => {
    if (!products) return [];
    
    return products
      .map(product => ({
        name: product.nome,
        value: (Number(product.preco) || 0) * (product.estoque || 0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!products) return {};
    
    const totalProducts = products.length;
    const totalStockValue = products.reduce((total, product) => {
      return total + ((Number(product.preco) || 0) * (product.estoque || 0));
    }, 0);
    const lowStockCount = products.filter(p => (p.estoque || 0) < 10).length;
    const outOfStockCount = products.filter(p => (p.estoque || 0) === 0).length;
    
    return {
      totalProducts,
      totalStockValue,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{summaryMetrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total de Produtos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              R$ {Number(summaryMetrics.totalStockValue).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Valor Total do Estoque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{summaryMetrics.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{summaryMetrics.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Sem Estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos por Categoria</CardTitle>
            <CardDescription>
              Distribuição de produtos e valor por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span>{category.productCount} produto{category.productCount !== 1 ? 's' : ''} | R$ {category.totalValue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((category.productCount / Math.max(...categoryData.map(c => c.productCount))) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria encontrada.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Maior Valor em Estoque</CardTitle>
            <CardDescription>
              Top 5 produtos por valor total em estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockValueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stockValueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos com Estoque Baixo</CardTitle>
          <CardDescription>
            Produtos que precisam de reposição (menos de 10 unidades)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {Number(product.preco).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      (product.estoque || 0) === 0 ? 'text-red-600' : 
                      (product.estoque || 0) < 5 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {product.estoque || 0} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Todos os produtos têm estoque adequado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReports;
