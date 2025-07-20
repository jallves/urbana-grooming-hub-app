
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Plus, MoreVertical, Package } from 'lucide-react';
import ProductForm from './ProductForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product } from '@/types/product';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  async function fetchProducts() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos', {
        description: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleCreateProduct() {
    setSelectedProduct(null);
    setIsFormOpen(true);
  }

  function handleEditProduct(productId: string) {
    setSelectedProduct(productId);
    setIsFormOpen(true);
  }

  function confirmDeleteProduct(productId: string) {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  }

  async function handleDeleteProduct() {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productToDelete));
      toast.success('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto', {
        description: (error as Error).message
      });
    } finally {
      setProductToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Header compacto */}
      <div className="p-2 sm:p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-urbana-gold" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-8 sm:pl-10 bg-gray-700 border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold text-xs sm:text-sm h-8 sm:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateProduct} 
            className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Lista de produtos - Grid responsivo */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum produto encontrado</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                    <div className="p-2 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white text-xs sm:text-base truncate mr-2">
                          {product.name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                            <DropdownMenuItem 
                              onClick={() => handleEditProduct(product.id)}
                              className="text-white hover:bg-gray-700 text-xs sm:text-sm"
                            >
                              <Edit className="h-3 w-3 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => confirmDeleteProduct(product.id)}
                              className="text-red-400 hover:bg-gray-700 text-xs sm:text-sm"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Preço:</span>
                          <span className="text-urbana-gold font-medium">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                        
                        {product.cost_price && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Custo:</span>
                            <span className="text-white">
                              R$ {product.cost_price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estoque:</span>
                          <span className="text-white">
                            {product.stock_quantity ?? 0}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Status:</span>
                          <Badge 
                            variant={product.is_active ? "default" : "outline"}
                            className={`text-xs ${product.is_active ? "bg-urbana-gold text-black" : "text-gray-400 border-gray-600"}`}
                          >
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulário e Dialog */}
      {isFormOpen && (
        <ProductForm
          productId={selectedProduct}
          onCancel={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchProducts();
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir produto</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductList;
