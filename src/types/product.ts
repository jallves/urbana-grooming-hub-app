
import { Database } from '@/integrations/supabase/types';

// Define o tipo para produtos
export type Product = Database['public']['Tables']['products']['Row'];

// Define um tipo para novos produtos (sem id e timestamps)
export type NewProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

// Define um tipo para o formulário de produtos
export interface ProductFormData {
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number | null;
  is_active: boolean;
}

// Define o tipo para categorias de produtos
export type ProductCategory = Database['public']['Tables']['product_categories']['Row'];

// Tipos para produtos da barbearia (painel_produtos)
export interface BarbershopProduct {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  estoque_minimo: number;
  categoria: string;
  imagens: string[];
  is_active: boolean;
  destaque: boolean;
  created_at: string;
  updated_at: string;
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
