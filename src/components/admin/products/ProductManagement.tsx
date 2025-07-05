
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductList from './ProductList';
import ServiceList from './ServiceList';
import { Package, Scissors } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Produtos e Serviços</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Gerencie o catálogo de produtos e serviços da barbearia</p>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 h-auto">
          <TabsTrigger value="products" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500">
            <Package className="h-4 w-4" />
            <span className="text-sm">Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
            <Scissors className="h-4 w-4" />
            <span className="text-sm">Serviços</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4 sm:mt-6 w-full">
          <ProductList />
        </TabsContent>
        
        <TabsContent value="services" className="mt-4 sm:mt-6 w-full">
          <ServiceList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;
