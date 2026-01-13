// Define o tipo para avaliações de clientes
export interface ClientReview {
  id: string;
  client_id: string;
  appointment_id?: string | null;
  staff_id?: string | null;
  service_id?: string | null;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
}

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
