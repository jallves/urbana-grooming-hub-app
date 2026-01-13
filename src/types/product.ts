// Tipos para produtos da barbearia (painel_produtos)
export interface BarbershopProduct {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  estoque: number;
  categoria?: string | null;
  imagem_url?: string | null;
  ativo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

// Define um tipo para novos produtos (sem id e timestamps)
export type NewProduct = Omit<BarbershopProduct, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de produtos
export interface ProductFormData {
  nome: string;
  descricao: string | null;
  preco: number;
  estoque: number;
  categoria: string | null;
  ativo: boolean;
}

// Define o tipo para categorias de produtos (usando valores simples)
export interface ProductCategory {
  id: string;
  name: string;
}

export interface CartItem {
  product: BarbershopProduct;
  quantity: number;
}

export interface ProductSale {
  id: string;
  cliente_id: string;
  total: number;
  payment_method: 'pix' | 'credit' | 'debit';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  pix_qr_code?: string;
  pix_key?: string;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductSaleItem {
  id: string;
  sale_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
}
