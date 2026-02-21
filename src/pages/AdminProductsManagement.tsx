import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Package, AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { resolveProductImageUrl } from '@/utils/productImages';
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

interface ProductWithMinStock extends BarbershopProduct {
  estoque_minimo: number;
}

const AdminProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<ProductWithMinStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithMinStock | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    estoque: 0,
    estoque_minimo: 10,
    categoria: 'geral',
    imagem_url: '',
    ativo: true
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
        estoque_minimo: Number((p as any).estoque_minimo) || 10
      })) as ProductWithMinStock[];
      
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
          .update(formData as any)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('painel_produtos')
          .insert([formData as any]);

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

  const handleEdit = (product: ProductWithMinStock) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco,
      estoque: product.estoque,
      estoque_minimo: product.estoque_minimo,
      categoria: product.categoria || 'geral',
      imagem_url: product.imagem_url || '',
      ativo: product.ativo
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
      estoque_minimo: 10,
      categoria: 'geral',
      imagem_url: '',
      ativo: true
    });
  };

  const handleNewProduct = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Calcular métricas de estoque
  const lowStockProducts = products.filter(p => p.ativo && p.estoque <= p.estoque_minimo && p.estoque > 0);
  const outOfStockProducts = products.filter(p => p.ativo && p.estoque <= 0);
  const healthyStockProducts = products.filter(p => p.ativo && p.estoque > p.estoque_minimo);

  const getStockBadge = (product: ProductWithMinStock) => {
    if (product.estoque <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-destructive/20 text-destructive">
          <PackageX className="w-3 h-3" />
          Sem estoque
        </span>
      );
    }
    if (product.estoque <= product.estoque_minimo) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          Estoque baixo ({product.estoque})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400">
        <PackageCheck className="w-3 h-3" />
        {product.estoque} un.
      </span>
    );
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

      {/* Painel de Resumo de Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5">
          <PackageCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-2xl font-bold text-emerald-400">{healthyStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Estoque OK</p>
          </div>
        </Card>
        <Card className={`p-4 flex items-center gap-3 ${lowStockProducts.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'}`}>
          <AlertTriangle className={`w-8 h-8 flex-shrink-0 ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-muted-foreground'}`} />
          <div>
            <p className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>{lowStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
          </div>
        </Card>
        <Card className={`p-4 flex items-center gap-3 ${outOfStockProducts.length > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
          <PackageX className={`w-8 h-8 flex-shrink-0 ${outOfStockProducts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          <div>
            <p className={`text-2xl font-bold ${outOfStockProducts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{outOfStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Sem Estoque</p>
          </div>
        </Card>
      </div>

      {/* Alertas de estoque baixo */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Estoque
          </div>
          <div className="space-y-1">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-destructive font-medium">🚫 {p.nome}</span>
                <span className="text-destructive font-bold">SEM ESTOQUE</span>
              </div>
            ))}
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-400">⚠️ {p.nome}</span>
                <span className="text-amber-400 font-bold">{p.estoque} un. (mín: {p.estoque_minimo})</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {products.map(product => (
          <Card key={product.id} className={`p-3 sm:p-4 space-y-3 ${product.estoque <= 0 ? 'border-destructive/40 opacity-75' : product.estoque <= product.estoque_minimo ? 'border-amber-500/40' : ''}`}>
            {/* Product Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              {(() => {
                const resolvedImageUrl = resolveProductImageUrl(product.imagem_url);
                return resolvedImageUrl ? (
                  <img
                    src={resolvedImageUrl}
                    alt={product.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                  </div>
                );
              })()}
              {/* Badge de estoque sobre a imagem */}
              <div className="absolute top-2 right-2">
                {getStockBadge(product)}
              </div>
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
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    R$ {product.preco.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mín: {product.estoque_minimo} un.
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
                <span className={`px-2 py-1 rounded ${product.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}`}>
                  {product.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <span className="px-2 py-1 rounded bg-muted">
                  {product.categoria || 'Geral'}
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
                <Label htmlFor="estoque" className="text-sm sm:text-base">Estoque Atual</Label>
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
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">Alerta quando estoque atingir este valor</p>
              </div>
            </div>

            <div>
              <Label htmlFor="imagem_url" className="text-sm sm:text-base">URL da Imagem</Label>
              <Input
                id="imagem_url"
                value={formData.imagem_url}
                onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                placeholder="https://..."
                className="text-sm sm:text-base"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo" className="text-sm sm:text-base">Produto Ativo</Label>
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
