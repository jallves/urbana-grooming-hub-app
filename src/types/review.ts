
import { Database } from '@/integrations/supabase/types';

// Define o tipo para avaliações de clientes
export type ClientReview = Database['public']['Tables']['client_reviews']['Row'];

// Define um tipo para novas avaliações (sem id e timestamp)
export type NewClientReview = Omit<ClientReview, 'id' | 'created_at'>;

// Define um tipo para o formulário de avaliações
export interface ClientReviewFormData {
  client_id: string;
  appointment_id?: string | null;
  staff_id?: string | null;
  service_id?: string | null;
  rating: number;
  comment: string | null;
  is_published: boolean;
}
