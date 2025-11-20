import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { BarbershopProduct } from '@/types/product';
import ProductForm from '@/components/admin/products/ProductForm';

const AdminProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<BarbershopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const productsData = (data || []).map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens : []
      })) as BarbershopProduct[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingProductId(null);
    loadProducts();
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingProductId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('painel_produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto excluído com sucesso');
      loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: BarbershopProduct) => {
    setEditingProductId(product.id);
    setIsDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProductId(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Produtos</h1>
        <Button onClick={handleNewProduct} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {products.map(product => (
          <Card key={product.id} className="p-3 sm:p-4 space-y-3">
            {/* Product Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.imagens.length > 0 ? (
                <img
                  src={product.imagens[0]}
                  alt={product.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg truncate">{product.nome}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {product.descricao}
                  </p>
                </div>
                {product.destaque && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded flex-shrink-0">
                    Destaque
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    R$ {product.preco.toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Estoque: {product.estoque} un.
                  </p>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${product.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="px-2 py-1 rounded bg-muted">
                  {product.categoria}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProductForm 
            productId={editingProductId}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsManagement;
