
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductList from './ProductList';
import ServiceList from './ServiceList';
import { Package, Scissors } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="products" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 rounded-lg p-1 mb-4 h-auto flex-shrink-0 gap-1">
          <TabsTrigger 
            value="products" 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-raleway font-semibold transition-all duration-300 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">🧴 Produtos</span>
            <span className="sm:hidden">Prod</span>
          </TabsTrigger>
          <TabsTrigger 
            value="services" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-raleway font-semibold transition-all duration-300 rounded-md data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]"
          >
            <Scissors className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">✂️ Serviços</span>
            <span className="sm:hidden">Serv</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="flex-1 min-h-0">
          <div className="h-full border rounded-lg">
            <ProductList />
          </div>
        </TabsContent>

        <TabsContent value="services" className="flex-1 min-h-0">
          <div className="h-full border rounded-lg">
            <ServiceList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;
