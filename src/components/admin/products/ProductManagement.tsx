
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
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Produtos e Serviços</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie o catálogo de produtos e serviços da barbearia</p>
      </div>

      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-gray-700 text-xs sm:text-sm font-medium transition-all"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Produtos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="services" 
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white text-gray-700 text-xs sm:text-sm font-medium transition-all"
          >
            <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Serviços</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <ProductList />
          </div>
        </TabsContent>
        
        <TabsContent value="services" className="mt-4 sm:mt-6 w-full">
          <div className="w-full overflow-x-auto">
            <ServiceList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;
