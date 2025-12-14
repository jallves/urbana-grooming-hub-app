
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Search, Plus, MoreVertical, Package, Image as ImageIcon } from 'lucide-react';
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
import { BarbershopProduct } from '@/types/product';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<BarbershopProduct[]>([]);
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
        .from('painel_produtos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setProducts((data || []).map(p => ({
        ...p,
        preco: Number(p.preco) || 0,
        estoque: Number(p.estoque) || 0,
        estoque_minimo: Number(p.estoque_minimo) || 5,
        commission_value: Number(p.commission_value) || 0,
        commission_percentage: Number(p.commission_percentage) || 0,
        imagens: Array.isArray(p.imagens) ? p.imagens : []
      })) as BarbershopProduct[]);
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
        .from('painel_produtos')
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
    product.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateProduct} 
            className="h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Lista de produtos - Grid responsivo sem scroll interno */}
      <div className="p-3 sm:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">Nenhum produto encontrado</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-all overflow-hidden">
                {/* Imagem do Produto */}
                {product.imagens && product.imagens.length > 0 ? (
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img 
                      src={product.imagens[0]} 
                      alt={product.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', product.imagens[0]);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground opacity-30" />
                  </div>
                )}
                
                <div className="p-2 sm:p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-[10px] sm:text-xs truncate mr-1 leading-tight">
                      {product.nome}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 flex-shrink-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditProduct(product.id)}
                          className="text-xs cursor-pointer"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDeleteProduct(product.id)}
                          className="text-destructive text-xs cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-0.5 text-[10px] sm:text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="text-primary font-semibold">
                        R$ {Number(product.preco || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estoque:</span>
                      <span className="font-medium">{product.estoque}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge 
                        variant={product.is_active ? "default" : "outline"}
                        className="text-[8px] sm:text-[10px] px-1.5 py-0"
                      >
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
