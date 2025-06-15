
export interface Barber {
  id: number; // Agora ID é sequencial (number), não UUID
  uuid_id?: string; // UUID original (opcional, para referência/migração)
  name: string;
  email?: string;
  phone?: string;
  image_url?: string;
  specialties?: string;
  experience?: string;
  commission_rate?: number | null;
  is_active?: boolean;
  role?: string;
  created_at?: string;
  updated_at?: string;
}
