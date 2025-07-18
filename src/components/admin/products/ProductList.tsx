import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Search, Plus } from 'lucide-react';
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
    <>
      <Card className="p-4 bg-gray-900 border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-urbana-gold" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-10 bg-black border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateProduct} 
            className="w-full sm:w-auto bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <div className="rounded-md border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-urbana-gold">Nome</TableHead>
                <TableHead className="text-urbana-gold">Preço</TableHead>
                <TableHead className="text-urbana-gold">Custo</TableHead>
                <TableHead className="text-urbana-gold">Estoque</TableHead>
                <TableHead className="text-urbana-gold">Status</TableHead>
                <TableHead className="text-right text-urbana-gold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-white">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-white">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell className="font-medium text-white">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-white">
                      R$ {product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-white">
                      {product.cost_price 
                        ? `R$ ${product.cost_price.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-white">
                      {product.stock_quantity ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.is_active ? "default" : "outline"}
                        className={product.is_active ? "bg-urbana-gold text-black" : "text-gray-400"}
                      >
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:text-urbana-gold">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => handleEditProduct(product.id)}
                            className="text-white hover:bg-gray-800"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmDeleteProduct(product.id)}
                            className="text-red-400 hover:bg-gray-800"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir produto</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
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
    </>
  );
};

export default ProductList;
