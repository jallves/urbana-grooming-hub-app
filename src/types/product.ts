
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
