
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductList from './ProductList';
import ServiceList from './ServiceList';

const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produtos e Serviços</h1>
        <p className="text-gray-500">Gerencie o catálogo de produtos e serviços da barbearia</p>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <ProductList />
        </TabsContent>
        
        <TabsContent value="services" className="mt-6">
          <ServiceList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;
