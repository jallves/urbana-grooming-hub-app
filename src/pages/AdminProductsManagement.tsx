import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Package, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BarbershopProduct } from '@/types/product';

const AdminProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<BarbershopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarbershopProduct | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    estoque: 0,
    estoque_minimo: 5,
    categoria: 'geral',
    imagens: [] as string[],
    is_active: true,
    destaque: false
  });

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
        preco: Number(p.preco) || 0,
        estoque: Number(p.estoque) || 0,
        estoque_minimo: Number(p.estoque_minimo) || 5,
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

  const handleSave = async () => {
    try {
      if (!formData.nome || formData.preco <= 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('painel_produtos')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('painel_produtos')
          .insert([formData]);

        if (error) throw error;
        toast.success('Produto criado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
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
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco,
      estoque: product.estoque,
      estoque_minimo: product.estoque_minimo,
      categoria: product.categoria,
      imagens: product.imagens,
      is_active: product.is_active,
      destaque: product.destaque
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      estoque: 0,
      estoque_minimo: 5,
      categoria: 'geral',
      imagens: [],
      is_active: true,
      destaque: false
    });
  };

  const handleNewProduct = () => {
    resetForm();
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="text-sm sm:text-base">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Pomada Modeladora"
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="descricao" className="text-sm sm:text-base">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o produto..."
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preco" className="text-sm sm:text-base">Preço *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="categoria" className="text-sm sm:text-base">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="cabelo">Cabelo</SelectItem>
                    <SelectItem value="barba">Barba</SelectItem>
                    <SelectItem value="cuidados">Cuidados</SelectItem>
                    <SelectItem value="acessorios">Acessórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estoque" className="text-sm sm:text-base">Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })}
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="estoque_minimo" className="text-sm sm:text-base">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 5 })}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">Imagens</Label>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Para adicionar imagens com upload, use o formulário principal de produtos
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-sm sm:text-base">Produto Ativo</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="destaque"
                  checked={formData.destaque}
                  onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked })}
                />
                <Label htmlFor="destaque" className="text-sm sm:text-base">Produto em Destaque</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Salvar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductsManagement;
