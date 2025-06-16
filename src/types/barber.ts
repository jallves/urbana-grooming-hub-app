// src/types/barber.ts
export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  specialties: string[]; // Alterado para array
  experience: number; // Alterado para number
  commission_rate: number;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  
  /** @deprecated */
  uuid_id?: string; // Marcado como deprecated
}