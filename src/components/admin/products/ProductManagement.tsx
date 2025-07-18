
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductList from './ProductList';
import ServiceList from './ServiceList';
import { Package, Scissors } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="w-full">
      <Tabs 
        defaultValue="products" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-black border border-urbana-gold/30 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="products" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <Package className="h-4 w-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="services" 
            className="flex items-center gap-2 py-3 text-sm data-[state=active]:bg-urbana-gold data-[state=active]:text-black text-white hover:text-urbana-gold font-raleway font-medium transition-all duration-300"
          >
            <Scissors className="h-4 w-4" />
            <span>Serviços</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="bg-black border border-gray-700 rounded-lg p-6">
            <ProductList />
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <div className="bg-black border border-gray-700 rounded-lg p-6">
            <ServiceList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManagement;
