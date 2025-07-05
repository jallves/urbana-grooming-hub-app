
import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductList from './ProductList';
import ServiceList from './ServiceList';
import ProductForm from './ProductForm';
import ServiceForm from './ServiceForm';

const ProductManagement: React.FC = () => {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header Mobile-First */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
            Produtos & Serviços
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Gerencie produtos e serviços da barbearia
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            onClick={() => setIsProductFormOpen(true)}
            className="bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Produto</span>
            <span className="hidden sm:inline">Novo Produto</span>
          </Button>
          
          <Button 
            onClick={() => setIsServiceFormOpen(true)}
            variant="outline"
            className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sm:hidden">Serviço</span>
            <span className="hidden sm:inline">Novo Serviço</span>
          </Button>
        </div>
      </div>

      {/* Tabs Mobile-Optimized */}
      <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-sm sm:text-base lg:text-lg text-white flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Gestão de Catálogo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-3 sm:px-4 lg:px-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 h-8 sm:h-10">
                <TabsTrigger 
                  value="products" 
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-urbana-gold data-[state=active]:text-black"
                >
                  Produtos
                </TabsTrigger>
                <TabsTrigger 
                  value="services"
                  className="text-xs sm:text-sm text-white data-[state=active]:bg-urbana-gold data-[state=active]:text-black"
                >
                  Serviços
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="overflow-x-auto">
              <TabsContent value="products" className="mt-3 sm:mt-4">
                <ProductList />
              </TabsContent>
              
              <TabsContent value="services" className="mt-3 sm:mt-4">
                <ServiceList />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modais dos Formulários */}
      {isProductFormOpen && (
        <ProductForm
          onClose={() => setIsProductFormOpen(false)}
          onSuccess={() => {
            setIsProductFormOpen(false);
            // Recarregar lista
          }}
        />
      )}

      {isServiceFormOpen && (
        <ServiceForm
          onClose={() => setIsServiceFormOpen(false)}
          onSuccess={() => {
            setIsServiceFormOpen(false);
            // Recarregar lista
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;
