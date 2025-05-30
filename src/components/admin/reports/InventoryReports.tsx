
import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryReports: React.FC = () => {
  // Fetch products and categories data
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory-reports'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      const { data: categories, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*');
        
      const { data: categoryRelations, error: relationsError } = await supabase
        .from('product_category_relations')
        .select('*');
      
      if (productsError || categoriesError || relationsError) {
        throw new Error(productsError?.message || categoriesError?.message || relationsError?.message);
      }
      
      return { products, categories, categoryRelations };
    }
  });

  // Process stock levels data
  const stockLevels = React.useMemo(() => {
    if (!inventoryData?.products) return [];
    
    const levels = {
      'Sem Estoque': 0,
      'Estoque Baixo (1-5)': 0,
      'Estoque Normal (6-20)': 0,
      'Estoque Alto (21+)': 0
    };
    
    inventoryData.products.forEach(product => {
      const stock = product.stock_quantity || 0;
      
      if (stock === 0) {
        levels['Sem Estoque']++;
      } else if (stock <= 5) {
        levels['Estoque Baixo (1-5)']++;
      } else if (stock <= 20) {
        levels['Estoque Normal (6-20)']++;
      } else {
        levels['Estoque Alto (21+)']++;
      }
    });
    
    return Object.entries(levels).map(([level, count]) => ({
      name: level,
      value: count
    }));
  }, [inventoryData]);

  // Process products by category
  const categoryData = React.useMemo(() => {
    if (!inventoryData?.products || !inventoryData?.categories || !inventoryData?.categoryRelations) return [];
    
    const categoryStats = {};
    
    // Initialize categories
    inventoryData.categories.forEach(category => {
      categoryStats[category.id] = {
        name: category.name,
        totalValue: 0,
        productCount: 0
      };
    });
    
    // Add uncategorized
    categoryStats['uncategorized'] = {
      name: 'Sem Categoria',
      totalValue: 0,
      productCount: 0
    };
    
    inventoryData.products.forEach(product => {
      const relations = inventoryData.categoryRelations.filter(rel => rel.product_id === product.id);
      const productValue = Number(product.price) * Number(product.stock_quantity || 0);
      
      if (relations.length === 0) {
        // Uncategorized product
        categoryStats['uncategorized'].totalValue += productValue;
        categoryStats['uncategorized'].productCount++;
      } else {
        relations.forEach(relation => {
          if (categoryStats[relation.category_id]) {
            categoryStats[relation.category_id].totalValue += productValue;
            categoryStats[relation.category_id].productCount++;
          }
        });
      }
    });
    
    return Object.values(categoryStats)
      .filter(category => category.productCount > 0)
      .map(category => ({
        name: category.name,
        value: Math.round(category.totalValue),
        products: category.productCount
      }));
  }, [inventoryData]);

  // Calculate low stock products
  const lowStockProducts = React.useMemo(() => {
    if (!inventoryData?.products) return [];
    
    return inventoryData.products
      .filter(product => (product.stock_quantity || 0) <= 5)
      .sort((a, b) => (a.stock_quantity || 0) - (b.stock_quantity || 0))
      .slice(0, 10);
  }, [inventoryData]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!inventoryData?.products) return {};
    
    const totalProducts = inventoryData.products.length;
    const activeProducts = inventoryData.products.filter(p => p.is_active).length;
    const totalValue = inventoryData.products.reduce((sum, product) => {
      return sum + (Number(product.price) * Number(product.stock_quantity || 0));
    }, 0);
    const outOfStock = inventoryData.products.filter(p => (p.stock_quantity || 0) === 0).length;
    
    return {
      totalProducts,
      activeProducts,
      totalValue,
      outOfStock
    };
  }, [inventoryData]);

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
            <div className="text-2xl font-bold text-green-600">{summaryMetrics.activeProducts}</div>
            <p className="text-xs text-muted-foreground">Produtos Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              R$ {summaryMetrics.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Valor Total do Estoque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{summaryMetrics.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Produtos em Falta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Níveis de Estoque</CardTitle>
            <CardDescription>
              Distribuição de produtos por nível de estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockLevels}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stockLevels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Value */}
        <Card>
          <CardHeader>
            <CardTitle>Valor por Categoria</CardTitle>
            <CardDescription>
              Valor total em estoque por categoria de produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria de produto encontrada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos com Estoque Baixo</CardTitle>
          <CardDescription>
            Produtos que precisam de reposição (estoque ≤ 5 unidades)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Produto</th>
                    <th className="text-left py-3 px-2">Estoque Atual</th>
                    <th className="text-left py-3 px-2">Preço Unitário</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{product.name}</td>
                      <td className="py-3 px-2">
                        <span className={`font-bold ${
                          (product.stock_quantity || 0) === 0 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={(product.stock_quantity || 0) === 0 ? "destructive" : "secondary"}>
                          {(product.stock_quantity || 0) === 0 ? "Sem Estoque" : "Estoque Baixo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Todos os produtos estão com estoque adequado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReports;
